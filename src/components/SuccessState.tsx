import { motion } from 'framer-motion';
import { Check, Instagram, Youtube, Mail } from 'lucide-react';

// TikTok icon component since lucide doesn't have it
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export function SuccessState() {
  const socialLinks = [
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: TikTokIcon, href: '#', label: 'TikTok' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Mail, href: 'mailto:hello@vetramedia.com', label: 'Email' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="text-center py-4"
    >
      {/* Checkmark Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Thank You Message */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="font-display text-3xl text-golden mb-3"
      >
        Thank You
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-foreground/80 mb-8 leading-relaxed"
      >
        Your nomination has been received. We'll review it and may reach out if this business is selected.
      </motion.p>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-muted-foreground text-sm mb-4">Follow the journey:</p>
        <div className="flex justify-center gap-4">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-foreground/60 hover:text-primary hover:bg-muted transition-all duration-200"
            >
              <Icon />
            </a>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
