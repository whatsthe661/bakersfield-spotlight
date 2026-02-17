/**
 * CorePrinciples — Vertical timeline with 5 principles
 */

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

const principles = [
    {
        number: '01',
        title: 'People Over Profiles',
        description: "We don't feature resumes. We feature humans. The messiness, the glory, the quiet moments in between.",
    },
];

export function CorePrinciples() {
    const sectionRef = useRef<HTMLElement>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        const ctx = gsap.context(() => {
            gsap.registerPlugin(ScrollTrigger);

            const items = sectionRef.current?.querySelectorAll('.principle-item');
            if (items) {
                items.forEach((item, i) => {
                    gsap.from(item, {
                        opacity: 0,
                        x: -40,
                        duration: 0.8,
                        ease: 'power3.out',
                        scrollTrigger: {
                            trigger: item,
                            start: 'top 80%',
                            toggleActions: 'play none none none',
                        },
                    });
                });
            }

            // Animate the timeline line growing
            const line = sectionRef.current?.querySelector('.timeline-connector');
            if (line) {
                gsap.from(line, {
                    scaleY: 0,
                    duration: 1.5,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 60%',
                        toggleActions: 'play none none none',
                    },
                });
            }
        }, sectionRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    return (
        <section ref={sectionRef} id="principles" className="relative py-12 sm:py-16 md:py-20 px-6 bg-charcoal overflow-hidden">
            <div className="absolute inset-0 grain-overlay" />

            <div className="relative z-10 max-w-4xl mx-auto">
                {/* Section header */}
                <p className="text-center text-foreground/30 text-xs tracking-[0.4em] uppercase mb-4 font-body">
                    Our Philosophy
                </p>
            </div>
        </section>
    );
}
