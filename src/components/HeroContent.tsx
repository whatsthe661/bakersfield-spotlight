import { motion } from 'framer-motion';

interface HeroContentProps {
  onNominateClick: () => void;
}

export function HeroContent({ onNominateClick }: HeroContentProps) {
  return (
    <motion.div
      className="relative z-10 text-center px-6 max-w-3xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Presented By */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-foreground/60 text-sm tracking-[0.3em] uppercase mb-4 font-body"
      >
        Presented by Vetra
      </motion.p>

      {/* Main Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-golden tracking-wide mb-6"
      >
        WHAT'S THE 661
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="text-foreground/80 text-lg sm:text-xl md:text-2xl font-body font-light max-w-2xl mx-auto mb-12 leading-relaxed"
      >
        A cinematic series spotlighting the grittiest, most beloved businesses in Bakersfield.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        onClick={onNominateClick}
        className="golden-button px-10 py-4 rounded-full text-primary-foreground font-body font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        Nominate a Business
      </motion.button>
    </motion.div>
  );
}
