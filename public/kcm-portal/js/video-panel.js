/* ============================================================
   Video Panel
   Creates an in-scene video playback plane anchored to the
   MindAR target. Uses THREE.VideoTexture for rendering.
   ============================================================ */

class VideoPanel {
  constructor() {
    this.videoEl = null;
    this.texture = null;
    this.mesh = null;
    this.material = null;
    this.anchorGroup = null;
    this.isPlaying = false;
    this.visible = false;
    this.config = null;
  }

  /**
   * Initialize with scene references.
   * @param {THREE.Group} anchorGroup - MindAR anchor group
   */
  init(anchorGroup) {
    this.anchorGroup = anchorGroup;
  }

  /**
   * Set up the video panel from station config.
   * @param {Object} videoConfig - { src, position, width, height }
   */
  setup(videoConfig) {
    if (!videoConfig || !videoConfig.src || !this.anchorGroup) return;
    this.config = videoConfig;

    // Create HTML5 video element
    this.videoEl = document.createElement('video');
    this.videoEl.src = videoConfig.src;
    this.videoEl.crossOrigin = 'anonymous';
    this.videoEl.loop = true;
    this.videoEl.muted = true; // Muted for autoplay policy; audio comes from AudioManager
    this.videoEl.playsInline = true;
    this.videoEl.setAttribute('playsinline', '');
    this.videoEl.setAttribute('webkit-playsinline', '');
    this.videoEl.preload = 'auto';

    // Create Three.js video texture
    this.texture = new THREE.VideoTexture(this.videoEl);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.format = THREE.RGBAFormat;

    // Video plane geometry
    const width = videoConfig.width || 1.6;
    const height = videoConfig.height || 0.9;
    const geometry = new THREE.PlaneGeometry(width, height);

    // Material with rounded-corner appearance via alpha
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.DoubleSide,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(geometry, this.material);

    // Position relative to anchor
    const pos = videoConfig.position || { x: 0, y: 0, z: 0 };
    this.mesh.position.set(pos.x, pos.y, pos.z);

    // Add a subtle border/frame
    const frameGeo = new THREE.PlaneGeometry(width + 0.04, height + 0.04);
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0x1a1816,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.copy(this.mesh.position);
    frame.position.z -= 0.001;

    // Play/pause icon overlay (shown when paused)
    this.playIconMesh = this._createPlayIcon();
    this.playIconMesh.position.copy(this.mesh.position);
    this.playIconMesh.position.z += 0.002;

    // Initially hidden
    this.mesh.visible = false;
    frame.visible = false;
    this.playIconMesh.visible = false;

    this.anchorGroup.add(frame);
    this.anchorGroup.add(this.mesh);
    this.anchorGroup.add(this.playIconMesh);

    this._frame = frame;

    // Load video metadata
    this.videoEl.load();

    console.log('Video panel created:', videoConfig.src);
  }

  /** Create a play icon triangle mesh */
  _createPlayIcon() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.06, -0.08);
    shape.lineTo(-0.06, 0.08);
    shape.lineTo(0.08, 0);
    shape.closePath();

    const geo = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  /** Show or hide the video panel */
  setVisible(visible) {
    this.visible = visible;
    if (this.mesh) this.mesh.visible = visible;
    if (this._frame) this._frame.visible = visible;

    if (visible) {
      this.play();
      if (this.playIconMesh) this.playIconMesh.visible = false;
    } else {
      this.stop();
      if (this.playIconMesh) this.playIconMesh.visible = false;
    }
  }

  /** Toggle visibility */
  toggle() {
    this.setVisible(!this.visible);
    return this.visible;
  }

  /** Start video playback */
  play() {
    if (!this.videoEl) return;
    const playPromise = this.videoEl.play();
    if (playPromise) {
      playPromise.catch(e => {
        console.warn('Video autoplay blocked:', e);
        // Show play icon so user knows to tap
        if (this.playIconMesh) this.playIconMesh.visible = true;
      });
    }
    this.isPlaying = true;
  }

  /** Stop video playback */
  stop() {
    if (!this.videoEl) return;
    this.videoEl.pause();
    this.videoEl.currentTime = 0;
    this.isPlaying = false;
  }

  /** Pause video */
  pause() {
    if (!this.videoEl) return;
    this.videoEl.pause();
    this.isPlaying = false;
  }

  /** Update (call in render loop if needed) */
  update() {
    // VideoTexture auto-updates, nothing needed here
  }

  /** Clean up */
  dispose() {
    this.stop();
    if (this.videoEl) {
      this.videoEl.src = '';
      this.videoEl = null;
    }
    if (this.texture) this.texture.dispose();
    if (this.material) this.material.dispose();
    if (this.mesh) {
      this.mesh.geometry.dispose();
      if (this.anchorGroup) this.anchorGroup.remove(this.mesh);
    }
    if (this._frame) {
      this._frame.geometry.dispose();
      this._frame.material.dispose();
      if (this.anchorGroup) this.anchorGroup.remove(this._frame);
    }
    if (this.playIconMesh) {
      this.playIconMesh.geometry.dispose();
      this.playIconMesh.material.dispose();
      if (this.anchorGroup) this.anchorGroup.remove(this.playIconMesh);
    }
  }
}
