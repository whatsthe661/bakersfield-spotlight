/**
 * Index — Main cinematic one-page experience
 * Composes sections with scroll-driven video background
 */

import { useState, useEffect, useRef } from 'react';
import { ParticleHero } from '@/components/sections/ParticleHero';
import { ManifestoSection } from '@/components/sections/ManifestoSection';
import { SeriesOverview } from '@/components/sections/SeriesOverview';
import { CinematicFooter } from '@/components/sections/CinematicFooter';
import { NominationForm } from '@/components/NominationForm';
import { ScrollVideo } from '@/components/ScrollVideo';

const Index = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll progress tracking with RAF and throttling for smooth performance
  useEffect(() => {
    let ticking = false;
    let lastProgress = 0;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const newProgress = window.scrollY / totalHeight;
            // Only update if change is significant (reduces re-renders)
            if (Math.abs(newProgress - lastProgress) > 0.005) {
              setScrollProgress(newProgress);
              lastProgress = newProgress;
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when form is open
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormOpen]);

  return (
    <>
      {/* Scroll progress indicator */}
      <div
        className="scroll-progress"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* Nomination form modal overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />
          {/* Form */}
          <div className="relative z-10 w-full max-w-md">
            <NominationForm
              isOpen={isFormOpen}
              onClose={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Fixed scroll-driven background */}
      <ScrollVideo />

      {/* Main cinematic scroll experience */}
      <main ref={mainRef} className="relative z-10">
        <ParticleHero onNominateClick={() => setIsFormOpen(true)} />
        <ManifestoSection />
        <SeriesOverview />
        <CinematicFooter />
      </main>
    </>
  );
};

export default Index;
