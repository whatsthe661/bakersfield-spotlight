/* ============================================================
   Audio Manager
   Web Audio API controller for layered ambient + narration audio.
   Supports HRTF spatial audio positioning.
   ============================================================ */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.narrationSource = null;
    this.narrationGain = null;
    this.panner = null;
    this.ambientBuffer = null;
    this.narrationBuffer = null;
    this.isPlaying = false;
    this.isMuted = false;
    this._ambientLoop = null;
  }

  /** Initialize the AudioContext (must be called from user gesture) */
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain for mute toggle
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    // Ambient chain: source -> panner (spatial) -> ambientGain -> master
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.4;

    this.panner = this.ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 10;
    this.panner.rolloffFactor = 1;
    this.panner.coneInnerAngle = 360;
    this.panner.coneOuterAngle = 0;
    this.panner.coneOuterGain = 0;
    this.panner.positionX.value = 0;
    this.panner.positionY.value = 0;
    this.panner.positionZ.value = -1;

    this.ambientGain.connect(this.masterGain);

    // Narration chain: source -> narrationGain -> master (non-spatial, clear voice)
    this.narrationGain = this.ctx.createGain();
    this.narrationGain.gain.value = 1.0;
    this.narrationGain.connect(this.masterGain);

    console.log('AudioManager initialized');
  }

  /**
   * Load audio files for the current station.
   * @param {Object} audioConfig - { ambient, narration, autoplay }
   */
  async loadStationAudio(audioConfig) {
    if (!audioConfig || !this.ctx) return;

    const loadBuffer = async (url) => {
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          console.warn(`Audio not found: ${url}`);
          return null;
        }
        const arrayBuffer = await resp.arrayBuffer();
        return await this.ctx.decodeAudioData(arrayBuffer);
      } catch (e) {
        console.warn(`Could not load audio: ${url}`, e);
        return null;
      }
    };

    // Load both in parallel
    const [ambBuf, narBuf] = await Promise.all([
      audioConfig.ambient ? loadBuffer(audioConfig.ambient) : null,
      audioConfig.narration ? loadBuffer(audioConfig.narration) : null,
    ]);

    this.ambientBuffer = ambBuf;
    this.narrationBuffer = narBuf;

    console.log('Audio loaded:', {
      ambient: !!ambBuf,
      narration: !!narBuf,
    });
  }

  /** Start playing audio (called when target is found) */
  play() {
    if (!this.ctx || this.isPlaying) return;

    // Resume context if suspended (autoplay policy)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // Play ambient (looped)
    if (this.ambientBuffer) {
      this.ambientSource = this.ctx.createBufferSource();
      this.ambientSource.buffer = this.ambientBuffer;
      this.ambientSource.loop = true;
      this.ambientSource.connect(this.panner);
      this.panner.connect(this.ambientGain);
      this.ambientSource.start(0);
    }

    // Play narration (one-shot)
    if (this.narrationBuffer) {
      this.narrationSource = this.ctx.createBufferSource();
      this.narrationSource.buffer = this.narrationBuffer;
      this.narrationSource.loop = false;
      this.narrationSource.connect(this.narrationGain);
      this.narrationSource.start(0);
    }

    this.isPlaying = true;
    console.log('Audio playing');
  }

  /** Pause/stop audio (called when target is lost) */
  pause() {
    if (!this.isPlaying) return;

    try {
      if (this.ambientSource) {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
        this.ambientSource = null;
      }
    } catch (e) { /* already stopped */ }

    try {
      if (this.narrationSource) {
        this.narrationSource.stop();
        this.narrationSource.disconnect();
        this.narrationSource = null;
      }
    } catch (e) { /* already stopped */ }

    this.isPlaying = false;
    console.log('Audio paused');
  }

  /** Toggle mute */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0 : 1,
        this.ctx.currentTime,
        0.05
      );
    }
    return this.isMuted;
  }

  /**
   * Update spatial audio position based on 3D scene.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  updatePosition(x, y, z) {
    if (!this.panner) return;
    this.panner.positionX.setTargetAtTime(x, this.ctx.currentTime, 0.02);
    this.panner.positionY.setTargetAtTime(y, this.ctx.currentTime, 0.02);
    this.panner.positionZ.setTargetAtTime(z, this.ctx.currentTime, 0.02);
  }

  /** Clean up */
  dispose() {
    this.pause();
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }
  }
}
