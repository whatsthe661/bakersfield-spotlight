/* ============================================================
   Experience Controller
   Camera capture → Gemini Veo 3.1 → AR portal overlay
   Designed for iPhone 16 Pro Max

   Supports:
   - Live capture → generate → AR overlay
   - Replay mode (?replay=videoUrl)
   - Quick next-building flow
   - Custom station creation
   ============================================================ */

(function () {
  'use strict';

  // --- State ---
  let cameraStream = null;
  let facingMode = 'environment';
  let station = null;
  let stationId = null;
  let allStations = {};
  let customPrompt = '';
  let currentJobId = null;
  let blendValue = 75;
  let portalMode = false;
  let isARActive = false;
  let currentArVideoObjectUrl = null;
  /** Prompt text used for the video currently shown in AR (set when generation starts). */
  let promptShownWithOverlay = '';

  // Motion tracking
  let baseOrientation = null;
  let currentOrientation = { alpha: 0, beta: 0, gamma: 0 };
  let motionEnabled = false;

  const LS_API_KEY = 'kcm_gemini_api_key';
  const LS_CUSTOM_STATIONS = 'kcm_custom_stations_v1';
  const LS_PHONE_CAPTURES = 'kcm_phone_captures_v1';
  const GENAI_CDN = 'https://esm.sh/@google/genai@1.48.0';

  let clientOnlyMode = false;
  let clientGenToken = 0;

  function apiUrl(path) {
    return new URL(path, window.location.href).href;
  }

  function loadCustomStationsLocal() {
    try {
      const raw = localStorage.getItem(LS_CUSTOM_STATIONS);
      if (!raw) return {};
      const o = JSON.parse(raw);
      return typeof o === 'object' && o && !Array.isArray(o) ? o : {};
    } catch {
      return {};
    }
  }

  function saveCustomStationsLocal(obj) {
    localStorage.setItem(LS_CUSTOM_STATIONS, JSON.stringify(obj));
  }

  async function detectClientOnlyMode() {
    try {
      const ac = new AbortController();
      const tid = setTimeout(() => ac.abort(), 2500);
      const resp = await fetch(apiUrl('api/settings'), { signal: ac.signal });
      clearTimeout(tid);
      clientOnlyMode = !resp.ok;
    } catch {
      clientOnlyMode = true;
    }
  }

  function videoToPlayableUrl(video, apiKey) {
    if (!video) return null;
    const bytes = video.videoBytes;
    if (bytes && typeof bytes === 'string') {
      const bin = atob(bytes);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const blob = new Blob([u8], { type: video.mimeType || 'video/mp4' });
      return URL.createObjectURL(blob);
    }
    if (video.uri) {
      let u = video.uri;
      if (!/^https?:\/\//i.test(u)) {
        u = `https://generativelanguage.googleapis.com/v1beta/${u.replace(/^\//, '')}`;
      }
      const sep = u.includes('?') ? '&' : '?';
      return `${u}${sep}key=${encodeURIComponent(apiKey)}`;
    }
    return null;
  }

  function savePhoneCaptureRecord(photoDataUrl, videoUrl) {
    try {
      let list = JSON.parse(localStorage.getItem(LS_PHONE_CAPTURES) || '[]');
      if (!Array.isArray(list)) list = [];
      list.unshift({
        id: 'ph_' + Date.now(),
        stationId: stationId || 'free-capture',
        stationName: station?.name || 'Capture',
        stationYear: station?.year || '',
        photoUrl: photoDataUrl,
        videoUrl,
        status: 'complete',
        createdAt: new Date().toISOString(),
        clientOnly: true,
      });
      localStorage.setItem(LS_PHONE_CAPTURES, JSON.stringify(list.slice(0, 40)));
    } catch (e) {
      console.warn('savePhoneCaptureRecord', e);
    }
  }

  // DOM refs
  const cameraFeed = document.getElementById('camera-feed');
  const captureCanvas = document.getElementById('capture-canvas');
  const arOverlay = document.getElementById('ar-overlay');
  const arVideo = document.getElementById('ar-video');
  const portalMask = document.getElementById('portal-mask');
  const hudCapture = document.getElementById('hud-capture');
  const hudAR = document.getElementById('hud-ar');
  const generatingOverlay = document.getElementById('generating-overlay');
  const previewImage = document.getElementById('preview-image');
  const progressFill = document.getElementById('progress-fill');
  const generatingStatus = document.getElementById('generating-status');
  const generatingDetail = document.getElementById('generating-detail');
  const promptModal = document.getElementById('prompt-modal');
  const promptInput = document.getElementById('prompt-input');
  const blendSlider = document.getElementById('blend-slider');
  const apiKeyBanner = document.getElementById('api-key-banner');
  const veoFileInput = document.getElementById('veo-file-input');

  async function refreshStations() {
    let base = {};
    if (!clientOnlyMode) {
      try {
        const resp = await fetch(apiUrl('api/stations'));
        if (resp.ok) base = await resp.json();
      } catch { /* fall through */ }
    }
    if (Object.keys(base).length === 0) {
      try {
        const r = await fetch(apiUrl('data/stations.json'));
        if (r.ok) base = await r.json();
      } catch { /* */ }
    }
    const custom = loadCustomStationsLocal();
    allStations = { ...base, ...custom };
  }

  async function refreshApiKeyBanner() {
    let needs = true;
    try {
      if (clientOnlyMode) {
        needs = !(localStorage.getItem(LS_API_KEY) || '').trim();
      } else {
        const resp = await fetch(apiUrl('api/settings'));
        const data = await resp.json();
        needs = !data.hasApiKey;
      }
    } catch {
      needs = true;
    }
    if (apiKeyBanner) {
      apiKeyBanner.style.display = needs ? 'block' : 'none';
    }
    hudCapture?.classList.toggle('has-api-banner', needs);
  }

  // --- Boot ---
  async function boot() {
    const params = new URLSearchParams(window.location.search);
    stationId = params.get('station') || 'free-capture';
    const replayUrl = params.get('replay');

    await detectClientOnlyMode();
    await refreshStations();

    station = allStations[stationId] || { name: 'Free Capture', year: '', description: '' };
    updateStationDisplay();

    customPrompt = buildDefaultPrompt();
    promptInput.value = customPrompt;

    const gt = document.getElementById('guide-text');
    if (gt) {
      gt.textContent = stationId === 'free-capture'
        ? 'Frame your space, tap the pencil to describe what you want, then tap the shutter'
        : 'Frame the room and tap the shutter';
    }

    refreshApiKeyBanner();

    await startCamera();
    setupMotionTracking();

    if (veoFileInput) {
      veoFileInput.addEventListener('change', onVeoFileSelected);
    }

    // If replay mode, jump straight to AR
    if (replayUrl) {
      promptShownWithOverlay = 'Replay link';
      showAROverlay(decodeURIComponent(replayUrl));
    }
  }

  function updateStationDisplay() {
    document.querySelectorAll('#hud-station-name, #ar-station-name')
      .forEach(el => el.textContent = station.name || 'Free Capture');
    document.querySelectorAll('#hud-station-year, #ar-station-year')
      .forEach(el => el.textContent = station.year || '');
  }

  function buildDefaultPrompt() {
    if (!station) return 'Bring this scene to life with people dressed in period-appropriate clothing.';
    if (station.defaultPrompt) return station.defaultPrompt;

    const name = station.name || 'this place';
    const year = station.year || 'the era it represents';
    const cards = station.infoCards || [];
    const context = cards.map(c => c.body).join(' ').slice(0, 300);

    return `Generate a cinematic video from this exact camera angle showing ${name} from ${year} brought to life: add period-dressed people naturally interacting in the space, realistic movement and lighting matching the ${year} era. The room structure, walls, windows, and furniture must stay exactly as they appear. Only add people and subtle atmospheric effects (dust motes in light beams, warm color grading). ${context ? 'Historical context: ' + context : ''}`;
  }

  // --- Camera ---
  async function startCamera() {
    try {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());

      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      cameraFeed.srcObject = cameraStream;
      await cameraFeed.play();
    } catch (err) {
      console.error('Camera error:', err);
      document.getElementById('guide-text').textContent = 'Camera access required — check permissions';
    }
  }

  function flipCamera() {
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera();
  }

  // --- Motion Tracking ---
  function setupMotionTracking() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Will request on first capture
    } else {
      enableMotionListeners();
    }
  }

  async function requestMotionPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm === 'granted') { enableMotionListeners(); return true; }
      } catch {}
      return false;
    }
    return true;
  }

  function enableMotionListeners() {
    window.addEventListener('deviceorientation', (e) => {
      currentOrientation = { alpha: e.alpha || 0, beta: e.beta || 0, gamma: e.gamma || 0 };
      if (isARActive) applyMotionParallax();
    });
    motionEnabled = true;
  }

  function captureBaseOrientation() {
    baseOrientation = { ...currentOrientation };
  }

  function applyMotionParallax() {
    if (!baseOrientation || !isARActive) return;

    let dBeta = Math.max(-15, Math.min(15, currentOrientation.beta - baseOrientation.beta));
    let dGamma = Math.max(-15, Math.min(15, currentOrientation.gamma - baseOrientation.gamma));

    const tx = dGamma * -0.8;
    const ty = dBeta * -0.5;

    arVideo.style.transform = `translate(${tx}px, ${ty}px) scale(1.05)`;
    if (portalMode) portalMask.style.transform = `translate(${tx * 0.3}px, ${ty * 0.3}px)`;
  }

  // --- Capture ---
  async function capture() {
    if (!cameraStream) return;
    if (!motionEnabled) await requestMotionPermission();

    const track = cameraStream.getVideoTracks()[0];
    const settings = track.getSettings();
    captureCanvas.width = settings.width || cameraFeed.videoWidth;
    captureCanvas.height = settings.height || cameraFeed.videoHeight;

    const ctx = captureCanvas.getContext('2d');
    ctx.drawImage(cameraFeed, 0, 0, captureCanvas.width, captureCanvas.height);

    const imageDataUrl = captureCanvas.toDataURL('image/jpeg', 0.92);
    captureBaseOrientation();

    previewImage.src = imageDataUrl;
    showGenerating();
    animateShutter();

    await submitGeneration(imageDataUrl);
  }

  function animateShutter() {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed; inset: 0; background: white; z-index: 999;
      opacity: 0.8; pointer-events: none;
      animation: shutterFlash 0.3s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
  }

  // --- Generation API ---
  async function submitGenerationClient(imageDataUrl) {
    promptShownWithOverlay = customPrompt;
    const token = ++clientGenToken;
    const apiKey = (localStorage.getItem(LS_API_KEY) || '').trim();
    if (!apiKey) {
      updateGeneratingUI('Add your Gemini API key (gear icon)', 0);
      generatingDetail.textContent = 'Runs on your phone over cellular once the key is set';
      generatingOverlay.onclick = () => { generatingOverlay.onclick = null; hideGenerating(); };
      return;
    }

    try {
      updateGeneratingUI('Loading Google AI (first time may take a moment)…', 5);
      const { GoogleGenAI } = await import(GENAI_CDN);
      if (token !== clientGenToken) return;

      const ai = new GoogleGenAI({ apiKey });
      const match = imageDataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
      if (!match) throw new Error('Invalid image');

      const mimeType = match[1];
      const imageData = match[2];
      updateGeneratingUI('Sending photo to Veo…', 15);

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt: customPrompt,
        image: { imageBytes: imageData, mimeType },
        config: {
          aspectRatio: '16:9',
          numberOfVideos: 1,
          durationSeconds: 8,
          personGeneration: 'allow_adult',
        },
      });

      let attempts = 0;
      const maxAttempts = 120;
      const msgs = [
        'Veo is studying your photo…',
        'Composing motion and lighting…',
        'Rendering video (this can take a couple of minutes)…',
      ];
      let mi = 0;

      while (!operation.done && attempts < maxAttempts) {
        if (token !== clientGenToken) return;
        await new Promise((r) => setTimeout(r, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
        attempts++;
        const prog = Math.min(92, 20 + Math.floor((attempts / maxAttempts) * 72));
        updateGeneratingUI(msgs[mi % msgs.length], prog);
        if (attempts % 4 === 0) mi++;
      }

      if (!operation.done) throw new Error('Video generation timed out');

      const gv = operation.response?.generatedVideos?.[0];
      const playUrl = videoToPlayableUrl(gv?.video, apiKey);
      if (!playUrl) throw new Error('No video in response');

      savePhoneCaptureRecord(imageDataUrl, playUrl);
      updateGeneratingUI('Portal ready!', 100);
      setTimeout(() => showAROverlay(playUrl), 600);
    } catch (err) {
      if (token !== clientGenToken) return;
      console.error('Client Veo error:', err);
      updateGeneratingUI('Error: ' + (err.message || String(err)), 0);
      generatingDetail.textContent = 'Tap to go back';
      generatingOverlay.onclick = () => { generatingOverlay.onclick = null; hideGenerating(); };
    }
  }

  async function submitGeneration(imageDataUrl) {
    if (clientOnlyMode) {
      return submitGenerationClient(imageDataUrl);
    }

    promptShownWithOverlay = customPrompt;

    try {
      updateGeneratingUI('Sending to AI...', 5);

      const resp = await fetch(apiUrl('api/generate-video'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageDataUrl,
          prompt: customPrompt,
          stationId,
          stationName: station.name || 'Free Capture',
          stationYear: station.year || '',
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Server error');
      }

      const { jobId } = await resp.json();
      currentJobId = jobId;
      updateGeneratingUI('AI is analyzing the scene...', 15);
      pollJobStatus(jobId);
    } catch (err) {
      console.error('Submit error:', err);
      updateGeneratingUI('Error: ' + err.message, 0);
      generatingDetail.textContent = 'Tap to go back';
      generatingOverlay.onclick = () => { generatingOverlay.onclick = null; hideGenerating(); };
    }
  }

  async function pollJobStatus(jobId) {
    const msgs = [
      'Analyzing the architecture and furnishings...',
      'Researching period-accurate clothing and hairstyles...',
      'Composing the scene with historical figures...',
      'Adding atmospheric lighting and details...',
      'Rendering the time portal...',
      'Almost there — finalizing the scene...',
    ];
    let mi = 0, lastProg = 15;

    const poll = async () => {
      if (currentJobId !== jobId) return;
      try {
        const resp = await fetch(apiUrl(`api/status/${jobId}`));
        const data = await resp.json();

        if (data.status === 'complete' && data.videoUrl) {
          updateGeneratingUI('Portal ready!', 100);
          setTimeout(() => showAROverlay(data.videoUrl), 800);
          return;
        }
        if (data.status === 'error') {
          updateGeneratingUI('Failed: ' + (data.error || 'Unknown error'), 0);
          generatingDetail.textContent = 'Tap to go back';
          generatingOverlay.onclick = () => { generatingOverlay.onclick = null; hideGenerating(); };
          return;
        }

        const prog = data.progress || lastProg;
        if (prog > lastProg) lastProg = prog;
        updateGeneratingUI(msgs[mi % msgs.length], lastProg);
        if (prog > (mi + 1) * 15) mi++;
        setTimeout(poll, 3000);
      } catch {
        setTimeout(poll, 5000);
      }
    };
    poll();
  }

  function updateGeneratingUI(status, progress) {
    if (generatingStatus) generatingStatus.textContent = status;
    if (progressFill && progress !== undefined) progressFill.style.width = progress + '%';
  }

  function revokeArVideoObjectUrl() {
    if (currentArVideoObjectUrl) {
      try { URL.revokeObjectURL(currentArVideoObjectUrl); } catch { /* ignore */ }
      currentArVideoObjectUrl = null;
    }
  }

  // --- AR Overlay ---
  function showAROverlay(videoUrl) {
    revokeArVideoObjectUrl();
    const url = videoUrl || '';
    if (url.startsWith('blob:')) currentArVideoObjectUrl = url;

    const promptEl = document.getElementById('ar-prompt-text');
    if (promptEl) {
      const text = promptShownWithOverlay || '';
      promptEl.textContent = text.trim() || '(No prompt text — upload or replay)';
    }

    arVideo.src = url;
    arVideo.load();

    arVideo.oncanplay = () => {
      hideGenerating();
      arOverlay.style.display = 'block';
      hudCapture.style.display = 'none';
      hudAR.style.display = 'flex';
      isARActive = true;
      setBlend(blendValue);
      arVideo.play().catch(() => {});
      arOverlay.classList.add('portal-opening');
      setTimeout(() => arOverlay.classList.remove('portal-opening'), 1200);
    };

    arVideo.onerror = () => { console.error('Video load failed'); hideGenerating(); };
  }

  function exitAR() {
    isARActive = false;
    revokeArVideoObjectUrl();
    arOverlay.style.display = 'none';
    arVideo.pause();
    arVideo.src = '';
    arVideo.removeAttribute('src');
    hudAR.style.display = 'none';
    hudCapture.style.display = 'flex';
    currentJobId = null;
    promptShownWithOverlay = '';
    const promptEl = document.getElementById('ar-prompt-text');
    if (promptEl) promptEl.textContent = '';
  }

  function removeOverlay() {
    exitAR();
  }

  // --- Blend & View Modes ---
  function setBlend(value) {
    blendValue = parseInt(value);
    if (blendSlider) blendSlider.value = blendValue;
    arOverlay.style.opacity = blendValue / 100;
  }

  function togglePortalMode() {
    portalMode = true;
    arOverlay.classList.add('portal-view');
    arOverlay.classList.remove('fullscreen-view');
    document.getElementById('btn-portal-mode').classList.add('active');
    document.getElementById('btn-fullscreen-mode').classList.remove('active');
  }

  function toggleFullscreenMode() {
    portalMode = false;
    arOverlay.classList.remove('portal-view');
    arOverlay.classList.add('fullscreen-view');
    document.getElementById('btn-portal-mode').classList.remove('active');
    document.getElementById('btn-fullscreen-mode').classList.add('active');
    portalMask.style.transform = '';
  }

  function recapture() { exitAR(); }

  // --- Next Building (quick switch) ---
  function nextBuilding() {
    const ids = Object.keys(allStations);
    if (ids.length === 0) return;
    const curIdx = ids.indexOf(stationId);
    const nextIdx = (curIdx + 1) % ids.length;
    window.location.href = `experience.html?station=${ids[nextIdx]}`;
  }

  // --- Add Custom Station (from phone) ---
  function showAddStation() {
    document.getElementById('new-station-name').value = '';
    document.getElementById('new-station-year').value = '';
    document.getElementById('new-station-desc').value = '';
    const promptEl = document.getElementById('new-station-prompt');
    if (promptEl) {
      promptEl.value =
        'Generate a cinematic video from this exact camera angle: period-dressed people, natural movement, warm light. Keep architecture and furniture exactly as shown; only add people and subtle atmosphere.';
    }
    document.getElementById('add-station-modal').style.display = 'flex';
  }

  function closeAddStation() {
    document.getElementById('add-station-modal').style.display = 'none';
  }

  async function saveNewStation() {
    const name = document.getElementById('new-station-name').value.trim();
    const year = document.getElementById('new-station-year').value.trim();
    const desc = document.getElementById('new-station-desc').value.trim();
    const userPrompt = (document.getElementById('new-station-prompt')?.value || '').trim();
    if (!name) { alert('Name is required'); return; }

    let id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    const defaultPrompt = userPrompt ||
      `Generate a cinematic video from this exact camera angle showing ${name} from ${year || 'its historical era'} brought to life: add period-dressed people naturally interacting in the space with realistic movement and lighting. Keep all structures exactly as they appear. Only add people and atmospheric effects. ${desc}`;

    try {
      if (clientOnlyMode) {
        const custom = loadCustomStationsLocal();
        let useId = id;
        if (custom[useId]) {
          let n = 2;
          while (custom[`${id}-${n}`]) n++;
          useId = `${id}-${n}`;
        }
        id = useId;
        custom[id] = {
          name,
          year,
          mode: 'indoor',
          description: desc,
          defaultPrompt,
          infoCards: [],
          custom: true,
        };
        saveCustomStationsLocal(custom);
        await refreshStations();
        stationId = id;
        station = allStations[id];
        updateStationDisplay();
        customPrompt = buildDefaultPrompt();
        promptInput.value = customPrompt;
        closeAddStation();
        return;
      }

      const resp = await fetch(apiUrl('api/stations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, year, description: desc, defaultPrompt }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || resp.statusText);

      await refreshStations();
      stationId = id;
      station = allStations[id] || { name, year, description: desc, defaultPrompt };
      updateStationDisplay();
      customPrompt = buildDefaultPrompt();
      promptInput.value = customPrompt;
      closeAddStation();
    } catch (e) {
      alert('Error saving station: ' + e.message);
    }
  }

  // --- Manage / delete custom stops ---
  function showManageStations() {
    renderManageStationsList();
    document.getElementById('manage-stations-modal').style.display = 'flex';
  }

  function closeManageStations() {
    document.getElementById('manage-stations-modal').style.display = 'none';
  }

  function renderManageStationsList() {
    const el = document.getElementById('manage-stations-list');
    if (!el) return;
    const custom = Object.entries(allStations).filter(([, s]) => s && s.custom);
    if (custom.length === 0) {
      el.innerHTML = '<p class="manage-empty">No custom stops yet. Use “Add” to create one.</p>';
      return;
    }
    el.innerHTML = custom.map(([id, s]) => `
      <div class="manage-station-row">
        <span>${escapeHtml(s.name || id)}${s.year ? ` · ${escapeHtml(s.year)}` : ''}</span>
        <button type="button" class="btn-danger" data-del-station="${escapeHtml(id)}">Delete</button>
      </div>
    `).join('');
    el.querySelectorAll('[data-del-station]').forEach((btn) => {
      btn.addEventListener('click', () => deleteCustomStation(btn.getAttribute('data-del-station')));
    });
  }

  function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  async function deleteCustomStation(id) {
    if (!id || !confirm('Remove this stop from your walk?')) return;
    try {
      const custom = loadCustomStationsLocal();
      const hadLocal = Boolean(custom[id]);
      if (hadLocal) {
        delete custom[id];
        saveCustomStationsLocal(custom);
      }

      if (!clientOnlyMode) {
        const resp = await fetch(apiUrl(`api/stations/${encodeURIComponent(id)}`), { method: 'DELETE' });
        if (!resp.ok && resp.status !== 404) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || resp.statusText);
        }
      } else if (!hadLocal) {
        throw new Error('Not a custom stop');
      }

      await refreshStations();
      renderManageStationsList();
      if (stationId === id) {
        const keys = Object.keys(allStations);
        window.location.href = keys.length
          ? `experience.html?station=${encodeURIComponent(keys[0])}`
          : 'experience.html?station=free-capture';
      }
    } catch (e) {
      alert(e.message);
    }
  }

  // --- Gemini API key (saved server-side) ---
  function showSetup() {
    document.getElementById('setup-status').textContent = '';
    document.getElementById('setup-api-key-input').value = '';
    document.getElementById('setup-modal').style.display = 'flex';
  }

  function closeSetup() {
    document.getElementById('setup-modal').style.display = 'none';
  }

  async function saveApiKey() {
    const input = document.getElementById('setup-api-key-input');
    const status = document.getElementById('setup-status');
    const key = (input.value || '').trim();
    if (!key) {
      status.textContent = 'Paste a key first.';
      return;
    }
    status.textContent = 'Saving…';
    try {
      if (clientOnlyMode) {
        localStorage.setItem(LS_API_KEY, key);
        status.textContent = 'Saved on this phone. Veo will use cellular data.';
        input.value = '';
        refreshApiKeyBanner();
        setTimeout(closeSetup, 900);
        return;
      }

      const resp = await fetch(apiUrl('api/settings/api-key'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Save failed');
      status.textContent = 'Saved. You can generate Veo videos now.';
      input.value = '';
      refreshApiKeyBanner();
      setTimeout(closeSetup, 900);
    } catch (e) {
      status.textContent = e.message;
    }
  }

  // --- Upload a Veo / camera roll video for overlay ---
  function pickVeoVideo() {
    if (veoFileInput) veoFileInput.click();
  }

  async function onVeoFileSelected(ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;

    if (clientOnlyMode) {
      promptShownWithOverlay = 'Video from your device (no AI prompt)';
      const url = URL.createObjectURL(file);
      captureBaseOrientation();
      showAROverlay(url);
      return;
    }

    const fd = new FormData();
    fd.append('video', file, file.name || 'video.mp4');
    try {
      updateGeneratingUI('Uploading video…', 20);
      showGenerating();
      const resp = await fetch(apiUrl('api/upload-video'), { method: 'POST', body: fd });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || 'Upload failed');
      hideGenerating();
      promptShownWithOverlay = 'Video uploaded from your device';
      captureBaseOrientation();
      showAROverlay(data.videoUrl);
    } catch (err) {
      hideGenerating();
      alert('Could not use that video: ' + err.message);
    }
  }

  // --- UI ---
  function showGenerating() {
    generatingOverlay.style.display = 'flex';
    generatingOverlay.onclick = null;
    generatingDetail.textContent = 'This may take a minute or two';
  }

  function hideGenerating() {
    generatingOverlay.style.display = 'none';
    progressFill.style.width = '0%';
  }

  function editPrompt() {
    promptInput.value = customPrompt;
    promptModal.style.display = 'flex';
  }

  function savePrompt() {
    customPrompt = promptInput.value.trim() || buildDefaultPrompt();
    promptModal.style.display = 'none';
  }

  function closePromptModal() { promptModal.style.display = 'none'; }

  function showStationInfo() {
    if (!station) return;
    document.getElementById('info-panel-title').textContent = station.name || '';
    document.getElementById('info-panel-year').textContent = station.year || '';
    const cards = station.infoCards || [];
    document.getElementById('info-panel-body').textContent =
      cards.map(c => c.body).join('\n\n') || station.description || 'No additional info.';
    document.getElementById('station-info-panel').style.display = 'flex';
  }

  function closeStationInfo() {
    document.getElementById('station-info-panel').style.display = 'none';
  }

  async function shareExperience() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${station.name} — Portal to the Past`,
          text: `I just traveled back to ${station.year} at the Kern County Museum!`,
          url: window.location.href,
        });
      } catch {}
    }
  }

  // --- Expose to window ---
  window.app = {
    capture, flipCamera, editPrompt, savePrompt, closePromptModal,
    showStationInfo, closeStationInfo, exitAR, setBlend,
    togglePortalMode, toggleFullscreenMode, recapture, shareExperience,
    nextBuilding, showAddStation, closeAddStation, saveNewStation,
    showManageStations, closeManageStations, deleteCustomStation,
    showSetup, closeSetup, saveApiKey,
    pickVeoVideo,
    removeOverlay,
  };

  // --- Boot ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
