import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
      <div className="flex flex-col items-center gap-2">
        <p className="text-foreground/40 text-sm font-body">
          © {currentYear} Vetra. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a 
            href="mailto:contact@whatsthe661.com"
            className="text-foreground/40 text-sm font-body hover:text-primary transition-colors duration-200"
          >
            contact@whatsthe661.com
          </a>
          <span className="text-foreground/20">•</span>
          <Link 
            to="/privacy"
            className="text-foreground/40 text-sm font-body hover:text-primary transition-colors duration-200"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </motion.footer>
  );
}
