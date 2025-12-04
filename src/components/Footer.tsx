import { motion, useReducedMotion } from 'framer-motion';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.footer 
      className="absolute bottom-0 left-0 right-0 py-6 text-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: prefersReducedMotion ? 0 : 0.6, 
        delay: prefersReducedMotion ? 0 : 1.2 
      }}
    >
      <p className="text-foreground/40 text-sm font-body mb-1">
        © {currentYear} Vetra. All rights reserved.
      </p>
      <a 
        href="mailto:contact@whatsthe661.com"
        className="text-foreground/40 text-sm font-body hover:text-primary transition-colors duration-200"
      >
        contact@whatsthe661.com
      </a>
    </motion.footer>
  );
}
