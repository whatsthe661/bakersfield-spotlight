/**
 * ParticleHero — Full-viewport hero (particles removed per request)
 * Golden "661" logo with CTA buttons
 */

import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import logo from '@/assets/logo.png';

export function ParticleHero({ onNominateClick }: { onNominateClick: () => void }) {
    const prefersReducedMotion = useReducedMotion();
    const [isLoaded, setIsLoaded] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Scroll-based transform for logo (scale and y-shift)
    const logoScale = useTransform(scrollY, [0, 300], [1, 0.95]);
    const logoY = useTransform(scrollY, [0, 300], [0, -30]);

    // Scroll-based opacity fade for content
    const contentOpacity = useTransform(scrollY, [0, 200], [1, 0.7]);

    useEffect(() => {
        // Wait for video to load before fading in content
        const checkVideoLoaded = setInterval(() => {
            const videoContainer = document.querySelector('.scroll-video-container > div');
            if (videoContainer) {
                const opacity = window.getComputedStyle(videoContainer).opacity;
                if (opacity === '0') {
                    setVideoLoaded(true);
                    setIsLoaded(true);
                    clearInterval(checkVideoLoaded);
                }
            }
        }, 100);

        // Fallback: if video doesn't load in 3 seconds, show content anyway
        const fallbackTimer = setTimeout(() => {
            setVideoLoaded(true);
            setIsLoaded(true);
            clearInterval(checkVideoLoaded);
        }, 3000);

        return () => {
            clearInterval(checkVideoLoaded);
            clearTimeout(fallbackTimer);
        };
    }, []);

    const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1];

    return (
        <section className="relative w-full h-screen flex items-start justify-center overflow-hidden" id="hero">
            {/* Subtle radial glow */}
            <div className="absolute inset-0 pointer-events-none z-[2]" style={{
                background: 'radial-gradient(ellipse at center, rgba(70, 110, 160, 0.03) 0%, transparent 60%)'
            }} />

            {/* Content — mobile: split into logo (inside arch) + text/button (below arch) */}
            {/* Desktop: single centered block */}
            <motion.div
                ref={heroRef}
                className="hidden sm:flex relative z-10 text-center px-6 max-w-5xl mx-auto hero-content-landscape flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: videoLoaded ? 1 : 0 }}
                transition={{ duration: 1.2, ease: easeOut }}
                style={{ opacity: contentOpacity, paddingTop: '3vh' }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 20 }}
                    transition={{ duration: 1.2, delay: 0.3, ease: easeOut }}
                    className="mb-32 md:mb-40"
                    style={{ scale: logoScale, y: logoY }}
                >
                    <img src={logo} alt="What's the 661 Logo" className="sm:w-[35vw] md:w-[24vw] lg:w-[19vw] max-w-[280px] mx-auto hero-logo-landscape" />
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 20 }}
                    transition={{ duration: 1.2, delay: 0.6, ease: easeOut }}
                    className="text-xl md:text-2xl font-body font-semibold max-w-xl mx-auto mb-6 leading-relaxed tracking-wide hero-tagline-landscape text-cinematic"
                    style={{ color: 'hsl(40 15% 92%)' }}
                >
                    Celebrating the People and Soul of Bakersfield, California
                </motion.p>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: videoLoaded ? 1 : 0 }}
                    transition={{ duration: 1.2, delay: 0.9, ease: easeOut }}
                    className="text-lg font-body font-medium italic mb-8 hero-philosophy-landscape text-cinematic"
                    style={{ color: 'hsl(40 15% 80%)' }}
                >
                    Every person is a world. Every episode is a window.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 20 }}
                    transition={{ duration: 1.2, delay: 1.2, ease: easeOut }}
                    className="flex flex-row items-center justify-center gap-4"
                >
                    <motion.button
                        onClick={onNominateClick}
                        className="golden-button px-8 py-3.5 rounded-full text-primary-foreground font-display text-sm tracking-[0.15em] uppercase hero-button-landscape"
                        whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                        whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                    >
                        Nominate a Business
                    </motion.button>
                </motion.div>
            </motion.div>

            {/* Mobile: logo centered in arch area, text+button below arch */}
            <motion.div
                className="sm:hidden absolute inset-0 z-10 flex flex-col items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: videoLoaded ? 1 : 0 }}
                transition={{ duration: 1.2, ease: easeOut }}
                style={{ opacity: contentOpacity }}
            >
                {/* Logo — above the arch, between top of screen and the arch */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 20 }}
                    transition={{ duration: 1.2, delay: 0.3, ease: easeOut }}
                    className="absolute left-0 right-0 flex justify-center items-center hero-mobile-logo"
                    style={{ top: '5%', height: '38%' }}
                >
                    <motion.img
                        src={logo}
                        alt="What's the 661 Logo"
                        className="w-[65vw] max-w-[360px]"
                        style={{ scale: logoScale, y: logoY, transformOrigin: 'center center' }}
                    />
                </motion.div>

                {/* Text + Button — positioned below the arch (~58% down) */}
                <div className="absolute left-0 right-0 px-6 text-center hero-mobile-text" style={{ top: '58%' }}>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 20 }}
                        transition={{ duration: 1.2, delay: 0.6, ease: easeOut }}
                        className="text-lg font-body font-semibold max-w-xs mx-auto mb-4 leading-relaxed tracking-wide text-cinematic"
                        style={{ color: 'hsl(40 15% 92%)' }}
                    >
                        Celebrating the People and Soul of Bakersfield, California
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: videoLoaded ? 1 : 0 }}
                        transition={{ duration: 1.2, delay: 0.9, ease: easeOut }}
                        className="text-base font-body font-medium italic mb-6 text-cinematic"
                        style={{ color: 'hsl(40 15% 80%)' }}
                    >
                        Every person is a world. Every episode is a window.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: videoLoaded ? 1 : 0, y: videoLoaded ? 0 : 20 }}
                        transition={{ duration: 1.2, delay: 1.2, ease: easeOut }}
                    >
                        <motion.button
                            onClick={onNominateClick}
                            className="golden-button px-8 py-3.5 rounded-full text-primary-foreground font-display text-sm tracking-[0.15em] uppercase"
                            whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                        >
                            Nominate a Business
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.0, duration: 0.8 }}
            >
                <span className="text-xs tracking-[0.3em] uppercase font-body" style={{ color: 'hsl(40 15% 88% / 0.3)' }}>Scroll</span>
                <motion.div
                    className="w-px h-8" style={{ background: 'linear-gradient(to bottom, hsl(40 15% 88% / 0.3), transparent)' }}
                    animate={prefersReducedMotion ? {} : { scaleY: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.div>

        </section>
    );
}
