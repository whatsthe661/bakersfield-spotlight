import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

export function SuccessState() {
  const prefersReducedMotion = useReducedMotion();

  // Apple-like easing
  const easeOut = [0.16, 1, 0.3, 1];

  return (
    <motion.div
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: easeOut }}
      className="text-center py-8"
    >
      {/* Animated Checkmark */}
      <motion.div
        initial={{ scale: prefersReducedMotion ? 1 : 0, rotate: prefersReducedMotion ? 0 : -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: prefersReducedMotion ? 0 : 0.1, 
          type: 'spring', 
          stiffness: 200, 
          damping: 15 
        }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/15 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: prefersReducedMotion ? 1 : 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: prefersReducedMotion ? 0 : 0.25, 
            type: 'spring', 
            stiffness: 250, 
            damping: 12 
          }}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.4, duration: 0.3 }}
          >
            <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Thank You Message */}
      <motion.h3
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.45, duration: 0.5, ease: easeOut }}
        className="font-display text-3xl sm:text-4xl text-golden mb-4"
      >
        Thank You!
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.55, duration: 0.5, ease: easeOut }}
        className="mb-3 leading-relaxed max-w-sm mx-auto text-lg" style={{ color: 'hsl(40 15% 88% / 0.8)' }}
      >
        Your nomination has been received!
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.65, duration: 0.5, ease: easeOut }}
        className="leading-relaxed max-w-sm mx-auto text-sm" style={{ color: 'hsl(40 15% 88% / 0.5)' }}
      >
        We'll review it and reach out if this business is selected for the series.
      </motion.p>
    </motion.div>
  );
}
