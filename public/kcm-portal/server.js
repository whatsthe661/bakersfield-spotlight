/* ============================================================
   Kern County Museum — Portal to the Past
   Express backend with Gemini Veo 3.1 + persistent storage
   ============================================================ */

import express from 'express';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { execSync, spawnSync } from 'child_process';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8443;

const runtimeConfigPath = path.join(__dirname, 'data', 'runtime-config.json');

function loadRuntimeConfig() {
  try {
    if (fs.existsSync(runtimeConfigPath)) {
      return JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8'));
    }
  } catch (e) {
    console.warn('  runtime-config load:', e.message);
  }
  return {};
}

function getLanIP() {
  try {
    return execSync("ipconfig getifaddr en0 2>/dev/null || true", { encoding: 'utf8' }).trim() || '';
  } catch {
    return '';
  }
}

function getEffectiveApiKey() {
  const env = process.env.GEMINI_API_KEY;
  if (env && env !== 'none') return env.trim();
  const saved = loadRuntimeConfig().geminiApiKey;
  if (saved && typeof saved === 'string') return saved.trim();
  return '';
}

// --- Gemini client (env or saved in data/runtime-config.json) ---
let ai = null;
function initGemini() {
  const key = getEffectiveApiKey();
  if (key) {
    ai = new GoogleGenAI({ apiKey: key });
    console.log('  Gemini API connected');
    return true;
  }
  ai = null;
  console.warn('  ⚠ No API key — save one in app Setup or .env (video generation disabled)');
  return false;
}
initGemini();

// --- Middleware ---
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// --- Data directories ---
const dirs = {
  generated: path.join(__dirname, 'generated'),
  captures: path.join(__dirname, 'data', 'captures'),
  photos: path.join(__dirname, 'data', 'photos'),
  uploads: path.join(__dirname, 'data', 'uploads'),
};
for (const dir of Object.values(dirs)) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const upload = multer({
  dest: dirs.uploads,
  limits: { fileSize: 120 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = file.originalname || '';
    const ok =
      /^video\//.test(file.mimetype) ||
      file.mimetype === 'application/octet-stream' ||
      /\.(mp4|webm|mov|m4v|qt)$/i.test(name);
    cb(null, ok);
  },
});

// --- Persistent capture database (JSON file) ---
const dbPath = path.join(__dirname, 'data', 'captures.json');

function loadDB() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (e) {
    console.warn('DB load error, starting fresh:', e.message);
  }
  return { captures: [], stations: {} };
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Load custom stations into the main stations.json on boot
function mergeCustomStations() {
  const db = loadDB();
  const stationsPath = path.join(__dirname, 'data', 'stations.json');
  let stations = {};
  try {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  } catch { /* start fresh */ }

  // Merge any custom stations from DB
  if (db.stations) {
    for (const [id, s] of Object.entries(db.stations)) {
      if (!stations[id]) stations[id] = s;
    }
  }
  return stations;
}

// In-memory job tracker
const jobs = new Map();

/* =========================================================
   API ROUTES
   ========================================================= */

// --- Settings: API key (persisted server-side for easy iPhone use) ---
app.get('/api/settings', (req, res) => {
  res.json({ hasApiKey: Boolean(getEffectiveApiKey()) });
});

app.post('/api/settings/api-key', (req, res) => {
  try {
    const { apiKey } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'apiKey required' });
    }
    const trimmed = apiKey.trim();
    if (!trimmed) return res.status(400).json({ error: 'apiKey empty' });

    const cfg = loadRuntimeConfig();
    cfg.geminiApiKey = trimmed;
    fs.writeFileSync(runtimeConfigPath, JSON.stringify(cfg, null, 2));
    initGemini();
    res.json({ ok: true, hasApiKey: true });
  } catch (err) {
    console.error('Save API key:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Upload a Veo (or other) video file for overlay ---
app.post('/api/upload-video', (req, res) => {
  upload.single('video')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message || 'Invalid upload' });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file (use field name "video")' });
      }
      const ext = path.extname(req.file.originalname || '') || '.mp4';
      const safeExt = /^\.(mp4|webm|mov|m4v)$/i.test(ext) ? ext.toLowerCase() : '.mp4';
      const finalName = `upload_${Date.now()}${safeExt}`;
      const finalPath = path.join(dirs.uploads, finalName);
      fs.renameSync(req.file.path, finalPath);
      res.json({ videoUrl: `/data/uploads/${finalName}` });
    } catch (e) {
      console.error('Upload save:', e);
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      res.status(500).json({ error: e.message });
    }
  });
});

// --- Generate video ---
app.post('/api/generate-video', async (req, res) => {
  try {
    const { image, prompt, stationId, stationName, stationYear } = req.body;

    if (!image || !prompt) {
      return res.status(400).json({ error: 'image and prompt are required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'No Gemini API key. Open Setup on your phone and save your key, or set GEMINI_API_KEY in .env.',
      });
    }

    const match = image.match(/^data:(image\/[\w+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid image data URL format' });
    }

    const mimeType = match[1];
    const imageData = match[2];
    const ts = Date.now();
    const jobId = `cap_${ts}`;

    // Save the source photo immediately
    const photoFile = `${jobId}.jpg`;
    const photoPath = path.join(dirs.photos, photoFile);
    fs.writeFileSync(photoPath, Buffer.from(imageData, 'base64'));

    // Create capture record
    const capture = {
      id: jobId,
      stationId: stationId || 'free-capture',
      stationName: stationName || 'Free Capture',
      stationYear: stationYear || '',
      prompt,
      photoUrl: `/data/photos/${photoFile}`,
      videoUrl: null,
      status: 'generating',
      createdAt: new Date(ts).toISOString(),
    };

    // Save to DB immediately
    const db = loadDB();
    db.captures.unshift(capture);
    saveDB(db);

    // In-memory job state for polling
    jobs.set(jobId, { status: 'generating', progress: 0, capture });

    // Start async generation
    generateVideo(jobId, imageData, mimeType, prompt);

    res.json({ jobId, captureId: jobId });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Poll job status ---
app.get('/api/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    // Check DB for completed captures
    const db = loadDB();
    const cap = db.captures.find(c => c.id === req.params.jobId);
    if (cap) {
      return res.json({
        status: cap.status === 'generating' ? 'error' : cap.status,
        progress: cap.videoUrl ? 100 : 0,
        videoUrl: cap.videoUrl,
        error: cap.status === 'generating' ? 'Server restarted during generation' : undefined,
      });
    }
    return res.status(404).json({ error: 'Job not found' });
  }

  const response = { status: job.status, progress: job.progress };
  if (job.status === 'complete') response.videoUrl = job.capture.videoUrl;
  if (job.status === 'error') response.error = job.error;
  res.json(response);
});

// --- Get all captures (gallery) ---
app.get('/api/captures', (req, res) => {
  const db = loadDB();
  res.json(db.captures);
});

// --- Delete a capture ---
app.delete('/api/captures/:id', (req, res) => {
  const db = loadDB();
  const idx = db.captures.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const cap = db.captures[idx];
  // Clean up files
  try {
    const photoFile = path.join(__dirname, cap.photoUrl);
    if (fs.existsSync(photoFile)) fs.unlinkSync(photoFile);
    if (cap.videoUrl) {
      const videoFile = path.join(__dirname, cap.videoUrl);
      if (fs.existsSync(videoFile)) fs.unlinkSync(videoFile);
    }
  } catch { /* best effort */ }

  db.captures.splice(idx, 1);
  saveDB(db);
  res.json({ ok: true });
});

// --- Get all stations (built-in + custom) ---
app.get('/api/stations', (req, res) => {
  res.json(mergeCustomStations());
});

// --- Add a custom station ---
app.post('/api/stations', (req, res) => {
  const { id, name, year, description, defaultPrompt } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });

  const db = loadDB();
  const station = {
    name,
    year: year || '',
    mode: 'indoor',
    description: description || '',
    defaultPrompt: defaultPrompt || '',
    infoCards: [],
    custom: true,
  };

  db.stations[id] = station;
  saveDB(db);

  // Also update the main stations.json
  const stationsPath = path.join(__dirname, 'data', 'stations.json');
  let stations = {};
  try { stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8')); } catch {}
  stations[id] = station;
  fs.writeFileSync(stationsPath, JSON.stringify(stations, null, 2));

  res.json({ ok: true, station });
});

// --- Delete a custom station (built-in stops cannot be removed) ---
app.delete('/api/stations/:id', (req, res) => {
  const id = req.params.id;
  const stationsPath = path.join(__dirname, 'data', 'stations.json');
  let stations = {};
  try {
    stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
  } catch {
    return res.status(404).json({ error: 'No stations file' });
  }

  const s = stations[id];
  if (!s) return res.status(404).json({ error: 'Station not found' });
  if (!s.custom) {
    return res.status(403).json({ error: 'Only custom “Add Building” stops can be deleted' });
  }

  delete stations[id];
  fs.writeFileSync(stationsPath, JSON.stringify(stations, null, 2));

  const db = loadDB();
  if (db.stations && db.stations[id]) delete db.stations[id];
  saveDB(db);

  res.json({ ok: true });
});

/* =========================================================
   VIDEO GENERATION
   ========================================================= */

async function generateVideo(jobId, imageData, mimeType, prompt) {
  const job = jobs.get(jobId);
  const db = loadDB();
  const capIdx = db.captures.findIndex(c => c.id === jobId);

  try {
    console.log(`[${jobId}] Starting Veo 3.1 video generation...`);
    job.progress = 10;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageData,
        mimeType: mimeType,
      },
      config: {
        aspectRatio: '16:9',
        numberOfVideos: 1,
        durationSeconds: 8,
        personGeneration: 'allow_adult',
      },
    });

    job.progress = 30;
    console.log(`[${jobId}] Submitted, polling...`);

    let attempts = 0;
    const maxAttempts = 120;

    while (!operation.done && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
      attempts++;
      job.progress = Math.min(90, 30 + Math.floor((attempts / maxAttempts) * 60));
      if (attempts % 6 === 0) console.log(`[${jobId}] Polling... (${attempts})`);
    }

    if (!operation.done) throw new Error('Video generation timed out');

    job.progress = 90;
    console.log(`[${jobId}] Done, downloading...`);

    const generatedVideo = operation.response?.generatedVideos?.[0];
    if (!generatedVideo) throw new Error('No video in result');

    const videoFileName = `${jobId}.mp4`;
    const videoPath = path.join(dirs.generated, videoFileName);

    await ai.downloadFile({
      file: generatedVideo,
      downloadPath: videoPath,
    });

    const videoUrl = `/generated/${videoFileName}`;

    // Update in-memory
    job.status = 'complete';
    job.progress = 100;
    job.capture.videoUrl = videoUrl;
    job.capture.status = 'complete';

    // Update DB
    if (capIdx >= 0) {
      db.captures[capIdx].videoUrl = videoUrl;
      db.captures[capIdx].status = 'complete';
      saveDB(db);
    }

    console.log(`[${jobId}] Saved: ${videoPath}`);

  } catch (err) {
    console.error(`[${jobId}] Failed:`, err);
    job.status = 'error';
    job.error = err.message;

    if (capIdx >= 0) {
      db.captures[capIdx].status = 'error';
      db.captures[capIdx].error = err.message;
      saveDB(db);
    }
  }
}

/* =========================================================
   HTTPS + LAUNCH
   ========================================================= */

function ensureCerts() {
  const certFile = path.join(__dirname, 'localhost.pem');
  const keyFile = path.join(__dirname, 'localhost-key.pem');
  const lan = getLanIP();

  if (!fs.existsSync(certFile) || !fs.existsSync(keyFile)) {
    console.log('  Generating HTTPS certificates (iPhone needs LAN host in cert)…');
    try {
      const hosts = ['localhost', '127.0.0.1', '::1'];
      if (lan) hosts.push(lan);
      const args = ['-cert-file', 'localhost.pem', '-key-file', 'localhost-key.pem', ...hosts];
      const r = spawnSync('mkcert', args, { cwd: __dirname, stdio: 'inherit' });
      if (r.status !== 0) throw new Error('mkcert failed');
    } catch {
      console.error('  mkcert required: brew install mkcert && mkcert -install');
      process.exit(1);
    }
  }
  return { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) };
}

const certs = ensureCerts();
const server = https.createServer(certs, app);

const localIP = getLanIP() || 'localhost';

server.listen(PORT, '0.0.0.0', () => {
  const db = loadDB();
  const iphoneUrl = localIP === 'localhost' ? '(connect Wi‑Fi — run ipconfig for IP)' : `https://${localIP}:${PORT}`;
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║   Kern County Museum — Portal to the Past             ║
  ╠═══════════════════════════════════════════════════════╣
  ║   iPhone:  ${iphoneUrl}
  ║   Local:   https://localhost:${PORT}
  ║   Captures: ${db.captures.length}   Gemini: ${ai ? 'OK' : 'set key in app Setup'}
  ╚═══════════════════════════════════════════════════════╝
  `);
});
