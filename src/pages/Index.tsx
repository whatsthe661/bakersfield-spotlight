import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { HeroBackground } from '@/components/HeroBackground';
import { HeroContent } from '@/components/HeroContent';
import { NominationForm } from '@/components/NominationForm';
import { Footer } from '@/components/Footer';

const Index = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background with dynamic blur */}
      <HeroBackground blurAmount={isFormOpen ? 12 : 4} />

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!isFormOpen ? (
            <HeroContent 
              key="hero" 
              onNominateClick={() => setIsFormOpen(true)} 
            />
          ) : (
            <NominationForm 
              key="form" 
              isOpen={isFormOpen} 
              onClose={() => setIsFormOpen(false)} 
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
};

export default Index;
