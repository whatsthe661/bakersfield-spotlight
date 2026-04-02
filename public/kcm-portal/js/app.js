/* ============================================================
   AR App — Main Controller
   Initializes MindAR, loads station content, wires up all
   modules (audio, video, info cards, UI).
   ============================================================ */

(function () {
  'use strict';

  // Module instances
  const contentLoader = new ContentLoader();
  const audioManager = new AudioManager();
  const infoCards = new InfoCardsManager();
  const videoPanel = new VideoPanel();
  const ui = new UIController();

  // State
  let mindarThree = null;
  let isTracking = false;
  let animationTime = 0;
  let station = null;

  // ---- Boot sequence ----

  async function boot() {
    ui.init();
    ui.setLoadingText('Loading station data...');

    try {
      // 1. Load station config
      station = await contentLoader.load();
      ui.setStationInfo(station);
      ui.setLoadingText('Preparing AR engine...');

      // 2. Wait for MindAR and Three.js to load from CDN
      await waitForLibs();
      ui.setLoadingText('Ready');

      // 3. Show instructions
      ui.showInstructions();
    } catch (err) {
      console.error('Boot error:', err);
      ui.setLoadingText('Error: ' + err.message);
    }
  }

  /** Wait until window.MINDAR and window.THREE are available */
  function waitForLibs() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.MINDAR && window.MINDAR.IMAGE && window.THREE) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  // ---- Start Experience (called from Begin button) ----

  async function startExperience() {
    // Init audio context from user gesture
    audioManager.init();

    ui.setLoadingText('Starting camera...');

    try {
      // Initialize MindAR
      const targetSrc = contentLoader.getTargetSrc();

      // MindAR configuration
      const config = {
        container: document.querySelector('#ar-container'),
        imageTargetSrc: targetSrc,
        uiScanning: false,
        uiLoading: false,
      };

      // Adjust for through-glass mode — increase filtering
      if (contentLoader.isThroughGlass()) {
        config.filterMinCF = 0.0001;
        config.filterBeta = 0.01;
        config.missTolerance = 10;
        config.warmupTolerance = 8;
      } else {
        config.filterMinCF = 0.001;
        config.filterBeta = 1;
        config.missTolerance = 5;
        config.warmupTolerance = 5;
      }

      mindarThree = new window.MINDAR.IMAGE.MindARThree(config);

      const { renderer, scene, camera } = mindarThree;

      // Set renderer for best mobile quality
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // Create anchor for the first target
      const anchor = mindarThree.addAnchor(0);

      // ---- Set up overlay content ----
      setupOverlay(anchor, station);

      // ---- Set up info cards ----
      infoCards.init(anchor.group, scene, camera);
      infoCards.createCards(contentLoader.getInfoCards());
      infoCards.onCardTap = (cardData) => {
        ui.showInfoDetail(cardData);
      };

      // ---- Set up video panel ----
      videoPanel.init(anchor.group);
      videoPanel.setup(contentLoader.getVideo());

      // ---- Load audio ----
      await audioManager.loadStationAudio(contentLoader.getAudio());

      // ---- Target found / lost events ----
      anchor.onTargetFound = () => {
        isTracking = true;
        ui.setTracking(true);

        // Auto-play audio if configured
        const audioConf = contentLoader.getAudio();
        if (audioConf && audioConf.autoplay) {
          audioManager.play();
        }

        console.log('Target found');
      };

      anchor.onTargetLost = () => {
        isTracking = false;
        ui.setTracking(false);
        audioManager.pause();
        console.log('Target lost');
      };

      // ---- Tap/click handler for info cards ----
      const container = document.querySelector('#ar-container');
      container.addEventListener('click', (e) => {
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        infoCards.handleTap(x, y);
      });

      // ---- Start MindAR ----
      await mindarThree.start();

      // Show AR view
      ui.showAR();

      // ---- Render loop ----
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        animationTime = clock.getElapsedTime();
        infoCards.update(animationTime);
        videoPanel.update();
        renderer.render(scene, camera);
      });

      console.log('AR experience started');

    } catch (err) {
      console.error('AR start error:', err);
      ui.setLoadingText('Camera error: ' + err.message);
    }
  }

  /**
   * Set up the main overlay content (image or video) on the anchor.
   * @param {Object} anchor - MindAR anchor
   * @param {Object} station - Station config
   */
  function setupOverlay(anchor, station) {
    const overlay = contentLoader.getOverlay();
    if (!overlay) return;

    const width = overlay.width || 2.0;
    const height = overlay.height || 1.5;
    const pos = overlay.position || { x: 0, y: 0, z: 0 };

    if (overlay.type === 'video-loop' || overlay.type === 'video') {
      // Video overlay
      const video = document.createElement('video');
      video.src = overlay.src;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';

      const videoTexture = new THREE.VideoTexture(video);
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;

      const geo = new THREE.PlaneGeometry(width, height);
      const mat = new THREE.MeshBasicMaterial({
        map: videoTexture,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(geo, mat);
      plane.position.set(pos.x, pos.y, pos.z);
      anchor.group.add(plane);

      // Play on target found
      const origFound = anchor.onTargetFound;
      anchor.onTargetFound = () => {
        video.play().catch(() => {});
        if (origFound) origFound();
      };
      const origLost = anchor.onTargetLost;
      anchor.onTargetLost = () => {
        video.pause();
        if (origLost) origLost();
      };

    } else if (overlay.type === 'image') {
      // Static image overlay (supports PNG transparency)
      const loader = new THREE.TextureLoader();
      loader.load(overlay.src, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const geo = new THREE.PlaneGeometry(width, height);
        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const plane = new THREE.Mesh(geo, mat);
        plane.position.set(pos.x, pos.y, pos.z);
        anchor.group.add(plane);
      });
    }
  }

  // ---- Public API (exposed to HUD buttons) ----

  function toggleAudio() {
    const muted = audioManager.toggleMute();
    ui.setAudioIcon(muted);
  }

  function toggleInfoCards() {
    const visible = infoCards.toggle();
    ui.setButtonActive('btn-info', visible);
  }

  function toggleVideo() {
    const visible = videoPanel.toggle();
    ui.setButtonActive('btn-video', visible);
  }

  function closeInfoDetail() {
    ui.hideInfoDetail();
  }

  function resetView() {
    // Restart tracking
    if (mindarThree) {
      mindarThree.stop();
      mindarThree.start();
    }
  }

  // Expose to window for HTML onclick handlers
  window.arApp = {
    startExperience,
    toggleAudio,
    toggleInfoCards,
    toggleVideo,
    closeInfoDetail,
    resetView,
  };

  // ---- Kick off ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
