/**
 * HeroContent Component
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
      className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto"
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
        className="text-black/50 text-xs sm:text-sm tracking-[0.35em] uppercase mb-4 font-body"
      >
        Presented by Vetra
      </motion.p>

      {/* Sub-tagline - Fits within title width */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0.55)}
        className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl text-black/90 tracking-[0.2em] sm:tracking-[0.3em] uppercase mt-2 mb-8"
      >
        Built in Bakersfield
      </motion.p>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getTransition(0.7)}
        className="text-black/60 text-base sm:text-lg md:text-xl font-body font-light max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        A series spotlighting the people and places that built this city.
      </motion.p>

      {/* CTA Button with glow animation */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
        }}
        transition={{
          ...getTransition(0.85),
          scale: { type: 'spring', stiffness: 200, damping: 20, delay: prefersReducedMotion ? 0 : 0.85 }
        }}
        onClick={onNominateClick}
        className="golden-button px-10 py-4 rounded-full text-primary-foreground font-body font-semibold text-lg tracking-wide transition-all duration-300 hover:shadow-[0_8px_40px_hsl(210_45%_38%/0.5)] active:shadow-[0_4px_20px_hsl(210_45%_38%/0.4)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        whileHover={prefersReducedMotion ? {} : { 
          scale: 1.05,
          transition: { duration: 0.25, ease: 'easeOut' }
        }}
        whileTap={prefersReducedMotion ? {} : { 
          scale: 0.97,
          transition: { duration: 0.1 }
        }}
      >
        Nominate a Business
      </motion.button>
    </motion.div>
  );
}
