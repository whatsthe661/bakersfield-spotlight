import { motion, useReducedMotion } from 'framer-motion';
import { Send, Mail } from 'lucide-react';

interface SuccessStateProps {
  mailtoLink?: string;
}

export function SuccessState({ mailtoLink }: SuccessStateProps) {
  const prefersReducedMotion = useReducedMotion();

  // Apple-like easing
  const easeOut = [0.16, 1, 0.3, 1];

  return (
    <motion.div
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: easeOut }}
      className="text-center py-6"
    >
      {/* Animated Icon */}
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
            <Send className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
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
        Almost There!
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.55, duration: 0.5, ease: easeOut }}
        className="text-foreground/80 mb-4 leading-relaxed max-w-sm mx-auto text-lg"
      >
        Your email app should have opened with your nomination details.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.65, duration: 0.5, ease: easeOut }}
        className="text-foreground/50 leading-relaxed max-w-sm mx-auto text-sm mb-6"
      >
        Just hit send, and we'll take it from there!
      </motion.p>

      {/* Fallback button if email didn't open */}
      {mailtoLink && (
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.75, duration: 0.5, ease: easeOut }}
        >
          <p className="text-foreground/40 text-xs mb-3">Email didn't open?</p>
          <motion.a
            href={mailtoLink}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-muted/50 text-foreground/70 hover:text-foreground hover:bg-muted transition-all text-sm font-medium"
            whileHover={prefersReducedMotion ? {} : { scale: 1.03 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
          >
            <Mail size={16} />
            Tap to open email
          </motion.a>
        </motion.div>
      )}
    </motion.div>
  );
}
