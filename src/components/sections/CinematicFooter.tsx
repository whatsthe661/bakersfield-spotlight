/**
 * CinematicFooter — Minimal footer with email signup
 */

import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

export function CinematicFooter() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const footerRef = useRef<HTMLElement>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (prefersReducedMotion || typeof gsap === 'undefined') return;

        const ctx = gsap.context(() => {
            gsap.registerPlugin(ScrollTrigger);

            const elements = footerRef.current?.querySelectorAll('.footer-reveal');
            if (elements) {
                gsap.from(elements, {
                    opacity: 0,
                    y: 30,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: footerRef.current,
                        start: 'top 85%',
                        toggleActions: 'play none none none',
                    },
                });
            }
        }, footerRef);

        return () => ctx.revert();
    }, [prefersReducedMotion]);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        const trimmedName = name.trim();

        if (!trimmedEmail || !trimmedName) {
            setErrorMsg('Please fill in both name and email.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        const formId = import.meta.env.VITE_FORMSPREE_ID;

        if (!formId) {
            setStatus('error');
            setErrorMsg('Configuration error. Please try again later.');
            console.error("Missing VITE_FORMSPREE_ID");
            return;
        }

        const endpoint = formId.startsWith('http') ? formId : `https://formspree.io/f/${formId}`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: trimmedName,
                    email: trimmedEmail
                }),
            });

            if (res.ok) {
                setStatus('success');
                setTimeout(() => {
                    setStatus('idle');
                    setEmail('');
                    setName('');
                }, 4000);
            } else {
                const data = await res.json();
                if (data.errors && Array.isArray(data.errors)) {
                    setErrorMsg(data.errors.map((error: any) => error.message).join(", "));
                } else {
                    setErrorMsg('Something went wrong. Please try again.');
                }
                setStatus('error');
            }
        } catch {
            setStatus('error');
            setErrorMsg('Unable to connect. Please try again.');
        }
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer ref={footerRef} id="contact" className="relative py-12 sm:py-16 md:py-20 px-6 bg-transparent overflow-hidden" style={{ '--foreground': '40 15% 88%' } as React.CSSProperties}>

            {/* Top divider */}
            <div className="section-divider-wide mb-10" />

            <div className="relative z-10 max-w-2xl mx-auto text-center">
                {/* Tagline */}
                <p className="footer-reveal text-white text-lg font-body font-semibold mb-2">
                    Celebrating the People and Soul of Bakersfield, California
                </p>

                {/* Credit */}
                <p className="footer-reveal text-white text-sm font-body font-medium tracking-wide mb-8">
                    Created by Brandon Rose
                </p>

                {/* Email signup */}
                <div className="footer-reveal mb-10">
                    <p className="text-white/70 text-base font-body font-medium mb-6">
                        Stay in the loop. First episode drops soon.
                    </p>
                    <form onSubmit={handleSubscribe} className="flex flex-col gap-3 max-w-sm mx-auto">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            disabled={status === 'loading' || status === 'success'}
                            className="bg-background/50 border border-border/30 rounded-full px-5 py-3 text-sm font-body text-white placeholder:text-white/40 focus:outline-none input-glow focus:border-primary/40 transition-colors disabled:opacity-50 text-center"
                        />
                        <div className="flex">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your Email"
                                disabled={status === 'loading' || status === 'success'}
                                className="flex-1 bg-background/50 border border-border/30 rounded-l-full px-5 py-3 text-sm font-body text-white placeholder:text-white/40 focus:outline-none input-glow focus:border-primary/40 transition-colors disabled:opacity-50"
                            />
                            <motion.button
                                type="submit"
                                disabled={status === 'loading' || status === 'success'}
                                className="golden-button px-5 py-3 rounded-r-full text-primary-foreground flex items-center gap-2 text-sm font-display tracking-wide disabled:opacity-70"
                                whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                            >
                                {status === 'success' ? (
                                    <>
                                        <Check size={16} />
                                        <span className="hidden sm:inline">You're in</span>
                                    </>
                                ) : status === 'loading' ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        Join
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                    {status === 'error' && (
                        <p className="text-red-500 text-xs font-body mt-2">{errorMsg}</p>
                    )}
                </div>

                {/* Bottom links */}
                <div className="footer-reveal flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6">
                        <a
                            href="mailto:brandon@whatsthe661.com"
                            className="text-white/50 text-xs font-body hover:text-primary/60 transition-colors duration-200"
                        >
                            brandon@whatsthe661.com
                        </a>
                        <span className="text-white/20">•</span>
                        <Link
                            to="/privacy"
                            className="text-white/50 text-xs font-body hover:text-primary/60 transition-colors duration-200"
                        >
                            Privacy Policy
                        </Link>
                    </div>

                    <p className="text-white/40 text-xs font-body">
                        © {currentYear} What's the 661. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
