/* ============================================================
   Info Cards Manager
   Creates interactive info card markers in the 3D AR scene.
   Cards are attached to the MindAR anchor group so they
   track with the image target.
   ============================================================ */

class InfoCardsManager {
  constructor() {
    this.cards = [];         // Config data
    this.meshes = [];        // Three.js meshes in the scene
    this.visible = false;
    this.anchorGroup = null;
    this.scene = null;
    this.camera = null;
    this.raycaster = null;
    this.onCardTap = null;   // Callback when a card is tapped
  }

  /**
   * Initialize with scene references.
   * @param {THREE.Group} anchorGroup - MindAR anchor group
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   */
  init(anchorGroup, scene, camera) {
    this.anchorGroup = anchorGroup;
    this.scene = scene;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
  }

  /**
   * Create card markers from station config.
   * @param {Array} cardsConfig - Array of info card definitions
   */
  createCards(cardsConfig) {
    if (!cardsConfig || !this.anchorGroup) return;
    this.cards = cardsConfig;

    cardsConfig.forEach((cardData, index) => {
      const pos = cardData.position || { x: 0, y: 0, z: 0 };

      // Create a small marker sphere + billboard
      const markerGroup = new THREE.Group();
      markerGroup.position.set(pos.x, pos.y, pos.z);

      // Pulsing ring indicator
      const ringGeo = new THREE.RingGeometry(0.06, 0.08, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xc8956c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      markerGroup.add(ring);

      // Center dot
      const dotGeo = new THREE.CircleGeometry(0.04, 32);
      const dotMat = new THREE.MeshBasicMaterial({
        color: 0xc8956c,
        side: THREE.DoubleSide,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.z = 0.001;
      markerGroup.add(dot);

      // Info icon — small "i" plane using canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#c8956c';
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('i', 32, 34);

      const iconTexture = new THREE.CanvasTexture(canvas);
      const iconGeo = new THREE.PlaneGeometry(0.12, 0.12);
      const iconMat = new THREE.MeshBasicMaterial({
        map: iconTexture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const icon = new THREE.Mesh(iconGeo, iconMat);
      icon.position.z = 0.002;
      markerGroup.add(icon);

      // Store card index for raycasting
      markerGroup.userData = { cardIndex: index, type: 'infoCard' };
      icon.userData = { cardIndex: index, type: 'infoCard' };
      dot.userData = { cardIndex: index, type: 'infoCard' };
      ring.userData = { cardIndex: index, type: 'infoCard' };

      // Initially hidden
      markerGroup.visible = false;

      this.anchorGroup.add(markerGroup);
      this.meshes.push(markerGroup);
    });

    console.log(`Created ${cardsConfig.length} info card markers`);
  }

  /** Show or hide all card markers */
  setVisible(visible) {
    this.visible = visible;
    this.meshes.forEach(m => { m.visible = visible; });
  }

  /** Toggle visibility */
  toggle() {
    this.setVisible(!this.visible);
    return this.visible;
  }

  /**
   * Handle tap/click to check if an info card was hit.
   * @param {number} x - Normalized device coord (-1 to 1)
   * @param {number} y - Normalized device coord (-1 to 1)
   * @returns {Object|null} Card data if hit
   */
  handleTap(x, y) {
    if (!this.visible || !this.raycaster || !this.camera) return null;

    const mouse = new THREE.Vector2(x, y);
    this.raycaster.setFromCamera(mouse, this.camera);

    // Collect all child meshes from markers
    const targets = [];
    this.meshes.forEach(group => {
      group.traverse(child => {
        if (child.isMesh) targets.push(child);
      });
    });

    const hits = this.raycaster.intersectObjects(targets, false);
    if (hits.length > 0) {
      const hit = hits[0].object;
      // Walk up to find cardIndex
      let obj = hit;
      while (obj && obj.userData.cardIndex === undefined) {
        obj = obj.parent;
      }
      if (obj && obj.userData.cardIndex !== undefined) {
        const cardData = this.cards[obj.userData.cardIndex];
        if (this.onCardTap) this.onCardTap(cardData);
        return cardData;
      }
    }
    return null;
  }

  /**
   * Animate markers (call in render loop).
   * @param {number} time - elapsed time in seconds
   */
  update(time) {
    this.meshes.forEach((group, i) => {
      if (!group.visible) return;
      // Gentle floating motion
      group.children[0].rotation.z = time * 0.5 + i;
      // Pulse scale
      const scale = 1.0 + Math.sin(time * 2 + i * 1.5) * 0.1;
      group.scale.set(scale, scale, scale);
    });
  }

  /** Clean up */
  dispose() {
    this.meshes.forEach(group => {
      group.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      if (this.anchorGroup) this.anchorGroup.remove(group);
    });
    this.meshes = [];
    this.cards = [];
  }
}
