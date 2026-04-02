/* ============================================================
   Content Loader
   Loads station configuration from stations.json based on URL param.
   ============================================================ */

class ContentLoader {
  constructor() {
    this.stations = null;
    this.currentStation = null;
    this.stationId = null;
  }

  /**
   * Load all station definitions and resolve the current station from URL param.
   * @returns {Object} The current station config
   */
  async load() {
    // Get station ID from URL
    const params = new URLSearchParams(window.location.search);
    this.stationId = params.get('station') || 'schoolhouse';

    // Fetch station data
    const resp = await fetch('data/stations.json');
    if (!resp.ok) throw new Error(`Failed to load stations.json: ${resp.status}`);
    this.stations = await resp.json();

    // Resolve current station
    this.currentStation = this.stations[this.stationId];
    if (!this.currentStation) {
      // Fall back to first available station
      const firstKey = Object.keys(this.stations)[0];
      if (firstKey) {
        this.stationId = firstKey;
        this.currentStation = this.stations[firstKey];
        console.warn(`Station "${params.get('station')}" not found, falling back to "${firstKey}"`);
      } else {
        throw new Error('No stations defined in stations.json');
      }
    }

    console.log(`Loaded station: ${this.currentStation.name} (${this.stationId})`);
    return this.currentStation;
  }

  /** Check if current station is in through-glass mode */
  isThroughGlass() {
    return this.currentStation?.mode === 'through-glass';
  }

  /** Get the .mind target file path */
  getTargetSrc() {
    return this.currentStation?.target || 'assets/targets/default.mind';
  }

  /** Get overlay config */
  getOverlay() {
    return this.currentStation?.overlay || null;
  }

  /** Get audio config */
  getAudio() {
    return this.currentStation?.audio || null;
  }

  /** Get info cards array */
  getInfoCards() {
    return this.currentStation?.infoCards || [];
  }

  /** Get video config */
  getVideo() {
    return this.currentStation?.video || null;
  }
}
