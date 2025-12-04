/**
 * HeroContent Component
 * 
 * PROJECT ANALYSIS (as requested):
 * - Framework: Vite + React 18 + TypeScript
 * - Routing: react-router-dom (SPA)
 * - Styling: Tailwind CSS with shadcn/ui components
 * - Animations: Framer Motion (already installed)
 * - Landing page: src/pages/Index.tsx
 * - Form submission: src/lib/api.ts (previously fake, now connected to /api/nominate)
 * - Types: src/types/nomination.ts
 */

import { motion, useReducedMotion } from 'framer-motion';

interface HeroContentProps {
  onNominateClick: () => void;
}

export function HeroContent({ onNominateClick }: HeroContentProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Apple-like easing curves
  const easeOut = [0.16, 1, 0.3, 1];
  
  // Respect reduced motion preferences
  const getTransition = (delay: number) => ({
    duration: prefersReducedMotion ? 0 : 0.8,
    delay: prefersReducedMotion ? 0 : delay,
    ease: easeOut,
  });

  return (
    <motion.div
      className="relative z-10 text-center px-6 max-w-4xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
    >
      {/* Presented By */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0.2)}
        className="text-foreground/50 text-xs sm:text-sm tracking-[0.35em] uppercase mb-6 font-body"
      >
        Presented by Vetra
      </motion.p>

      {/* Main Title */}
      <motion.h1
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0.4)}
        className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-golden tracking-wide mb-4"
      >
        WHAT'S THE 661
      </motion.h1>

      {/* Sub-tagline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0.55)}
        className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground/90 tracking-wider mb-6"
      >
        Built in Bakersfield.
      </motion.p>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0.7)}
        className="text-foreground/60 text-base sm:text-lg md:text-xl font-body font-light max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        A cinematic series spotlighting the people and places that built this city.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          ...getTransition(0.85),
          scale: { type: 'spring', stiffness: 200, damping: 20, delay: prefersReducedMotion ? 0 : 0.85 }
        }}
        onClick={onNominateClick}
        className="golden-button px-10 py-4 rounded-full text-primary-foreground font-body font-semibold text-lg tracking-wide transition-all duration-300 hover:shadow-[0_8px_40px_hsl(38_85%_55%/0.45)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        whileHover={prefersReducedMotion ? {} : { 
          scale: 1.03,
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        whileTap={prefersReducedMotion ? {} : { 
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
      >
        Nominate a Business
      </motion.button>
    </motion.div>
  );
}
