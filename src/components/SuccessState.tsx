import { motion, useReducedMotion } from 'framer-motion';
import { Check, Instagram, Youtube, Mail } from 'lucide-react';

// TikTok icon component since lucide doesn't have it
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export function SuccessState() {
  const prefersReducedMotion = useReducedMotion();
  
  const socialLinks = [
    { icon: Instagram, href: 'https://instagram.com/whatsthe661', label: 'Instagram' },
    { icon: TikTokIcon, href: 'https://tiktok.com/@whatsthe661', label: 'TikTok' },
    { icon: Youtube, href: 'https://youtube.com/@whatsthe661', label: 'YouTube' },
    { icon: Mail, href: 'mailto:contact@whatsthe661.com', label: 'Email' },
  ];

  // Apple-like easing
  const easeOut = [0.16, 1, 0.3, 1];

  return (
    <motion.div
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: easeOut }}
      className="text-center py-4"
    >
      {/* Checkmark Animation */}
      <motion.div
        initial={{ scale: prefersReducedMotion ? 1 : 0, opacity: prefersReducedMotion ? 1 : 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          delay: prefersReducedMotion ? 0 : 0.15, 
          type: prefersReducedMotion ? 'tween' : 'spring', 
          stiffness: 180, 
          damping: 15 
        }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/15 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: prefersReducedMotion ? 1 : 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: prefersReducedMotion ? 0 : 0.3, 
            type: prefersReducedMotion ? 'tween' : 'spring', 
            stiffness: 200, 
            damping: 14 
          }}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center"
        >
          <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.45, duration: prefersReducedMotion ? 0 : 0.3, ease: easeOut }}
          >
            <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Thank You Message */}
      <motion.h3
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.5, duration: prefersReducedMotion ? 0 : 0.5, ease: easeOut }}
        className="font-display text-3xl text-golden mb-3"
      >
        Thank You
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.6, duration: prefersReducedMotion ? 0 : 0.5, ease: easeOut }}
        className="text-foreground/70 mb-8 leading-relaxed max-w-sm mx-auto"
      >
        Your nomination has been received. We'll review it and reach out if this business is selected for the series.
      </motion.p>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.7, duration: prefersReducedMotion ? 0 : 0.5, ease: easeOut }}
      >
        <p className="text-muted-foreground text-sm mb-4">Follow the journey:</p>
        <div className="flex justify-center gap-3">
          {socialLinks.map(({ icon: Icon, href, label }, index) => (
            <motion.a
              key={label}
              href={href}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              aria-label={label}
              className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center text-foreground/50 hover:text-primary hover:bg-primary/10 transition-all duration-200"
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: prefersReducedMotion ? 0 : 0.75 + index * 0.05, 
                duration: prefersReducedMotion ? 0 : 0.3 
              }}
              whileHover={prefersReducedMotion ? {} : { scale: 1.1, y: -2 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
            >
              <Icon />
            </motion.a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
