/**
 * ManifestoSection — Simple statement
 */

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

export function ManifestoSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        const ctx = gsap.context(() => {
            gsap.registerPlugin(ScrollTrigger);

            const text = sectionRef.current?.querySelector('.manifesto-text');
            if (text) {
                gsap.from(text, {
                    opacity: 0,
                    y: 40,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 75%',
                        toggleActions: 'play none none none',
                    },
                });
            }
        }, sectionRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    return (
        <section
            ref={sectionRef}
            id="manifesto"
            className="relative py-10 sm:py-12 md:py-16 px-6 bg-charcoal overflow-hidden"
        >
            {/* Grain texture */}
            <div className="absolute inset-0 grain-overlay" />

            <div className="relative z-10 max-w-4xl mx-auto text-center">
                <p className="manifesto-text font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight font-medium text-cinematic" style={{ color: 'hsl(40 15% 88% / 0.9)' }}>
                    Everyone has a story.
                </p>
            </div>

        </section>
    );
}

