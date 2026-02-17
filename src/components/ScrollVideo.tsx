/**
 * ScrollVideo — Fixed background that scrubs a video with scroll position.
 *
 * Desktop: Uses GSAP ScrollTrigger to tween video.currentTime directly.
 *
 * Mobile/iOS: Pre-rendered JPEG image sequence drawn to canvas.
 * Portrait orientation uses vertical frames (/frames-vertical/).
 * Landscape orientation uses horizontal frames (/frames/).
 * GSAP ScrollTrigger's `scrub` parameter handles all the interpolation
 * and deceleration smoothing, eliminating iOS inertial scroll stutter.
 */

import { useEffect, useRef, useState } from 'react';
import timelapseVideoFile from '@/assets/Timelapse_60fps.mp4';

/** Number of pre-rendered frame images in each frames directory */
const MOBILE_FRAME_COUNT = 90;

export function ScrollVideo() {
    const timelapseVideo = timelapseVideoFile;
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [videoReady, setVideoReady] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isPortrait, setIsPortrait] = useState(false);
    const [canvasReady, setCanvasReady] = useState(false);

    // Detect mobile/touch devices and orientation
    useEffect(() => {
        const checkMobile = () => {
            const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const smallScreen = window.innerWidth <= 1024;
            setIsMobile(touch && smallScreen);
            setIsPortrait(window.innerHeight > window.innerWidth);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ── Mobile: Load pre-rendered image sequence, paint to canvas via GSAP ──
    useEffect(() => {
        if (!isMobile || videoError) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;
        if (typeof gsap === 'undefined') return;

        let destroyed = false;

        // Pick frame directory based on orientation
        const frameDir = isPortrait ? '/frames-vertical' : '/frames';

        // Cached draw rect — computed once, reused every frame
        let drawRect = { x: 0, y: 0, w: 0, h: 0 };
        let currentFrameIndex = -1;

        // Track the largest observed innerHeight to avoid iOS Safari URL bar
        // resize "pop". The URL bar shrinks as you scroll, making innerHeight
        // grow. We always use the largest value so the canvas never shrinks
        // when the bar reappears. Orientation changes trigger a full re-init
        // via the isPortrait dependency, so stale values aren't a concern.
        let stableHeight = window.innerHeight;

        const resizeCanvas = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            // Only grow, never shrink — prevents pop when URL bar reappears
            if (window.innerHeight > stableHeight) {
                stableHeight = window.innerHeight;
            }
            canvas.width = window.innerWidth * dpr;
            canvas.height = stableHeight * dpr;
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        };

        const computeDrawRect = (img: HTMLImageElement) => {
            const cw = canvas.width;
            const ch = canvas.height;
            const imgAspect = img.naturalWidth / img.naturalHeight;
            const canvasAspect = cw / ch;

            let x: number, y: number, w: number, h: number;

            if (canvasAspect > imgAspect) {
                w = cw;
                h = cw / imgAspect;
                x = 0;
                y = (ch - h) / 2;
            } else {
                h = ch;
                w = ch * imgAspect;
                x = (cw - w) / 2;
                y = 0;
            }

            // Overdraw by 2px on each side to prevent edge gaps.
            drawRect = {
                x: Math.floor(x) - 2,
                y: Math.floor(y) - 2,
                w: Math.ceil(w) + 4,
                h: Math.ceil(h) + 4,
            };
        };

        const paintFrame = (images: HTMLImageElement[], index: number) => {
            if (index < 0 || index >= images.length) return;
            if (!images[index]?.complete) return;
            if (index === currentFrameIndex) return;
            currentFrameIndex = index;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalAlpha = 1;
            ctx.drawImage(
                images[index],
                drawRect.x, drawRect.y,
                drawRect.w, drawRect.h
            );
        };

        const setup = async () => {
            // Load all frame images in parallel
            const images: HTMLImageElement[] = [];
            const loadPromises: Promise<HTMLImageElement>[] = [];

            for (let i = 1; i <= MOBILE_FRAME_COUNT; i++) {
                const img = new Image();
                const num = String(i).padStart(3, '0');
                img.src = `${frameDir}/frame_${num}.jpg`;
                images.push(img);
                loadPromises.push(
                    new Promise<HTMLImageElement>((resolve, reject) => {
                        img.onload = () => resolve(img);
                        img.onerror = () => reject(new Error(`Frame ${num} failed`));
                    })
                );
            }

            try {
                // Wait for first image to show something fast
                await loadPromises[0];
                if (destroyed) return;

                resizeCanvas();
                computeDrawRect(images[0]);
                paintFrame(images, 0);
                setCanvasReady(true);

                // Wait for all remaining images
                await Promise.all(loadPromises);
                if (destroyed) return;

                gsap.registerPlugin(ScrollTrigger);

                const frameObj = { frame: 0 };

                gsap.to(frameObj, {
                    frame: MOBILE_FRAME_COUNT - 1,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: document.documentElement,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 1.2,
                        onUpdate: () => {
                            const idx = Math.round(frameObj.frame);
                            paintFrame(images, idx);
                        },
                    },
                });

                // Handle resize — only respond to width changes (not URL bar height changes).
                // Orientation changes trigger full re-init via isPortrait dependency.
                let lastWidth = window.innerWidth;
                const onResize = () => {
                    const newWidth = window.innerWidth;
                    // iOS Safari URL bar only changes height, not width.
                    // Skip height-only changes to prevent the pop.
                    if (newWidth === lastWidth) return;
                    lastWidth = newWidth;

                    resizeCanvas();
                    computeDrawRect(images[0]);
                    currentFrameIndex = -1;
                    const idx = Math.round(frameObj.frame);
                    paintFrame(images, idx);
                };
                window.addEventListener('resize', onResize);

                return () => {
                    window.removeEventListener('resize', onResize);
                };
            } catch {
                if (!destroyed) {
                    console.error('Mobile frame loading failed, falling back to image.');
                    setVideoError(true);
                }
            }
        };

        let cleanupResize: (() => void) | undefined;
        setup().then(cleanup => {
            cleanupResize = cleanup ?? undefined;
        });

        return () => {
            destroyed = true;
            cleanupResize?.();
            setCanvasReady(false);
            // Kill ScrollTrigger instances for this effect
            ScrollTrigger.getAll().forEach(st => {
                if (st.trigger === document.documentElement) st.kill();
            });
        };
    }, [isMobile, isPortrait, videoError]);

    // ── Desktop: GSAP video.currentTime scrubbing ──
    useEffect(() => {
        if (isMobile || !timelapseVideo || videoError) return;

        const video = videoRef.current;
        if (!video || typeof gsap === 'undefined') return;

        const ctx = gsap.context(() => {
            gsap.registerPlugin(ScrollTrigger);

            const setupScrub = () => {
                if (!video.duration || isNaN(video.duration)) return;

                video.pause();
                video.currentTime = 0.001;
                setVideoReady(true);

                gsap.to(video, {
                    currentTime: video.duration - 0.5,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: document.documentElement,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: 2,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => {
                            if (self.progress === 0) {
                                video.currentTime = 0.001;
                            }
                            // Keep video from going past the last visible frame
                            if (video.currentTime > video.duration - 0.5) {
                                video.currentTime = video.duration - 0.5;
                            }
                        }
                    },
                });
            };

            const handleError = () => {
                console.error("Video failed to load, falling back to image.");
                setVideoError(true);
            };

            video.addEventListener('error', handleError);

            if (video.readyState >= 1) {
                setupScrub();
            } else {
                video.addEventListener('loadedmetadata', setupScrub, { once: true });
            }
        });

        return () => {
            ctx.revert();
        };
    }, [videoError, timelapseVideo, isMobile]);

    const showVideo = !isMobile && timelapseVideo && !videoError;
    const showCanvas = isMobile && !videoError;

    return (
        <div
            ref={containerRef}
            className="scroll-video-container"
            aria-hidden="true"
        >
            {/* Black cover — fades out when video/canvas is ready */}
            <div
                className="absolute inset-0"
                style={{
                    zIndex: 4,
                    backgroundColor: '#000',
                    opacity: (showVideo && videoReady) || (showCanvas && canvasReady) ? 0 : 1,
                    transition: 'opacity 1.2s ease',
                    pointerEvents: 'none',
                }}
            />

            {/* Mobile: Canvas for image sequence scrubbing */}
            {showCanvas ? (
                <canvas
                    ref={canvasRef}
                    className="scroll-video-canvas"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 2,
                        opacity: canvasReady ? 1 : 0,
                        transition: 'opacity 1.2s ease',
                    }}
                />
            ) : null}

            {/* Desktop: Direct video scrubbing */}
            {showVideo ? (
                <video
                    ref={videoRef}
                    src={timelapseVideo}
                    muted
                    playsInline
                    preload="auto"
                    className="scroll-video-media"
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        opacity: videoReady ? 1 : 0,
                        transition: 'opacity 1.2s ease',
                        backgroundColor: 'transparent',
                    }}
                />
            ) : null}

            {/* Subtle dark overlay for text readability */}
            <div className="scroll-video-overlay" style={{ zIndex: 3 }} />

            {/* Soft vignette for cinematic edge */}
            <div className="scroll-video-vignette" style={{ zIndex: 3 }} />

            {/* ── Top shadow gradient — smooth fade from black into video ── */}
            <div className="scroll-video-shadow-top" />

            {/* ── Bottom shadow gradient — smooth fade from video into black ── */}
            <div className="scroll-video-shadow-bottom" />
        </div>
    );
}
