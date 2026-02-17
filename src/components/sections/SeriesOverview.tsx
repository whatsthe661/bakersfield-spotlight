/**
 * SeriesOverview — Two-video looping showcase
 */

import { useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import glLoop from '@/assets/gl_loop.mp4';
import tblLoop from '@/assets/tbl_loop.mp4';

export function SeriesOverview() {
    const sectionRef = useRef<HTMLElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const seamlessLoop = useCallback((video: HTMLVideoElement) => {
        const handleTimeUpdate = () => {
            if (video.duration - video.currentTime < 0.3) {
                video.currentTime = 0;
                video.play();
            }
        };
        video.addEventListener('timeupdate', handleTimeUpdate);
        return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }, []);

    useEffect(() => {
        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        const ctx = gsap.context(() => {
            gsap.registerPlugin(ScrollTrigger);

            const items = sectionRef.current?.querySelectorAll('.showcase-image');
            if (items) {
                gsap.from(items, {
                    opacity: 0,
                    y: 60,
                    scale: 0.95,
                    duration: 1,
                    stagger: 0.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 70%',
                        toggleActions: 'play none none none',
                    },
                });
            }
        }, sectionRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    return (
        <section ref={sectionRef} id="overview" className="relative py-8 sm:py-12 md:py-16 overflow-hidden">
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="showcase-image overflow-hidden">
                        <video
                            ref={(el) => { if (el) seamlessLoop(el); }}
                            src={glLoop}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-auto object-contain"
                        />
                    </div>
                    <div className="showcase-image overflow-hidden">
                        <video
                            ref={(el) => { if (el) seamlessLoop(el); }}
                            src={tblLoop}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-auto object-contain"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
