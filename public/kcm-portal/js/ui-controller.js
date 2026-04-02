/* ============================================================
   UI Controller
   Manages HUD overlays, onboarding screen, loading states,
   tracking indicator, and info detail panel.
   ============================================================ */

class UIController {
  constructor() {
    // DOM refs (populated in init)
    this.onboarding = null;
    this.hud = null;
    this.trackingIndicator = null;
    this.trackingText = null;
    this.infoDetail = null;
    this.loadingSpinner = null;
    this.instructions = null;
    this.loadingTextEl = null;
  }

  /** Bind DOM elements */
  init() {
    this.onboarding = document.getElementById('onboarding');
    this.hud = document.getElementById('hud');
    this.trackingIndicator = document.getElementById('tracking-indicator');
    this.trackingText = document.getElementById('tracking-text');
    this.infoDetail = document.getElementById('info-detail');
    this.loadingSpinner = document.getElementById('loading-spinner');
    this.instructions = document.getElementById('onboarding-instructions');
    this.loadingTextEl = document.getElementById('loading-text');
  }

  /**
   * Set the station info in the onboarding and HUD.
   * @param {Object} station - Station config object
   */
  setStationInfo(station) {
    if (!station) return;

    const nameEl = document.getElementById('onboarding-station-name');
    const yearEl = document.getElementById('onboarding-station-year');
    const hudName = document.getElementById('hud-station-name');
    const hudYear = document.getElementById('hud-station-year');
    const instructionText = document.getElementById('instruction-text');

    if (nameEl) nameEl.textContent = station.name;
    if (yearEl) yearEl.textContent = station.year;
    if (hudName) hudName.textContent = station.name;
    if (hudYear) hudYear.textContent = station.year;

    // Adjust instruction text based on mode
    if (instructionText) {
      if (station.mode === 'through-glass') {
        instructionText.textContent = 'Point your phone at the marker visible through the glass';
      } else {
        instructionText.textContent = 'Point your phone at the marker on the building';
      }
    }
  }

  /**
   * Update loading status text.
   * @param {string} text
   */
  setLoadingText(text) {
    if (this.loadingTextEl) this.loadingTextEl.textContent = text;
  }

  /** Show the instructions (after loading completes) */
  showInstructions() {
    if (this.loadingSpinner) this.loadingSpinner.style.display = 'none';
    if (this.instructions) this.instructions.style.display = 'block';
  }

  /** Hide onboarding and show HUD */
  showAR() {
    if (this.onboarding) {
      this.onboarding.classList.add('hidden');
      // Remove from DOM after transition
      setTimeout(() => {
        if (this.onboarding) this.onboarding.style.display = 'none';
      }, 400);
    }
    if (this.hud) this.hud.style.display = 'flex';
  }

  /**
   * Update tracking state.
   * @param {boolean} isTracking
   */
  setTracking(isTracking) {
    if (!this.trackingIndicator) return;

    if (isTracking) {
      this.trackingIndicator.classList.add('tracking');
      if (this.trackingText) this.trackingText.textContent = 'Marker locked';
    } else {
      this.trackingIndicator.classList.remove('tracking');
      if (this.trackingText) this.trackingText.textContent = 'Searching for marker...';
    }
  }

  /**
   * Show the full-screen info detail panel.
   * @param {Object} cardData - { title, body, image }
   */
  showInfoDetail(cardData) {
    if (!this.infoDetail || !cardData) return;

    const img = document.getElementById('info-detail-image');
    const title = document.getElementById('info-detail-title');
    const body = document.getElementById('info-detail-body');

    if (img) {
      if (cardData.image) {
        img.src = cardData.image;
        img.style.display = 'block';
      } else {
        img.style.display = 'none';
      }
    }
    if (title) title.textContent = cardData.title || '';
    if (body) body.textContent = cardData.body || '';

    this.infoDetail.style.display = 'flex';
  }

  /** Hide the info detail panel */
  hideInfoDetail() {
    if (this.infoDetail) this.infoDetail.style.display = 'none';
  }

  /**
   * Toggle the active state of a HUD button.
   * @param {string} btnId - DOM id of the button
   * @param {boolean} active
   */
  setButtonActive(btnId, active) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.toggle('active', active);
    }
  }

  /**
   * Update the audio icon state.
   * @param {boolean} muted
   */
  setAudioIcon(muted) {
    const on = document.getElementById('icon-audio-on');
    const off = document.getElementById('icon-audio-off');
    if (on) on.style.display = muted ? 'none' : 'block';
    if (off) off.style.display = muted ? 'block' : 'none';
  }
}
