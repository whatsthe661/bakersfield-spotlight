import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import bakersfield from '@/assets/bakersfield-sign.png';

interface HeroBackgroundProps {
  blurAmount?: number;
}

export function HeroBackground({ blurAmount = 4 }: HeroBackgroundProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 50, stiffness: 100 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);
  
  const translateX = useTransform(x, [0, 1], [-15, 15]);
  const translateY = useTransform(y, [0, 1], [-15, 15]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set(clientX / innerWidth);
      mouseY.set(clientY / innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background Image with Parallax */}
      <motion.div
        className="absolute inset-0 scale-110"
        style={{ x: translateX, y: translateY }}
      >
        <img
          src={bakersfield}
          alt="Bakersfield Sign at sunset"
          className="w-full h-full object-cover"
          style={{ filter: `blur(${blurAmount}px)` }}
        />
      </motion.div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 hero-gradient" />

      {/* Grain Texture */}
      <div className="absolute inset-0 grain-overlay" />
    </div>
  );
}
