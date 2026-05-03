import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/sections/Navbar';
import HeroSection from '@/sections/HeroSection';
import ExploreSection from '@/sections/ExploreSection';
import LearnSection from '@/sections/LearnSection';
import AssembleSection from '@/sections/AssembleSection';
import Footer from '@/sections/Footer';

export default function App() {
  const [mode, setMode] = useState<'explore' | 'learn' | 'assemble'>('explore');
  const exploreRef = useRef<HTMLDivElement>(null);
  const learnRef = useRef<HTMLDivElement>(null);
  const assembleRef = useRef<HTMLDivElement>(null);

  const handleModeChange = (newMode: 'explore' | 'learn' | 'assemble') => {
    setMode(newMode);

    setTimeout(() => {
      const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
        explore: exploreRef,
        learn: learnRef,
        assemble: assembleRef,
      };
      refs[newMode]?.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Update mode based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { id: 'explore', ref: exploreRef },
        { id: 'learn', ref: learnRef },
        { id: 'assemble', ref: assembleRef },
      ];

      const scrollY = window.scrollY + 200;

      for (const section of sections) {
        const el = section.ref.current;
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (scrollY >= top && scrollY < bottom) {
            setMode(section.id as 'explore' | 'learn' | 'assemble');
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,255,136,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,136,255,0.08) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Navigation */}
      <Navbar currentMode={mode} onModeChange={handleModeChange} />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero */}
        <HeroSection onModeChange={handleModeChange} />

        {/* Explore Mode */}
        <div ref={exploreRef} id="explore">
          <ExploreSection onSelectComponent={(_id: string) => {
            void _id;
            setMode('learn');
            setTimeout(() => learnRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }} />
        </div>

        {/* Learn Mode */}
        <div ref={learnRef} id="learn">
          <LearnSection />
        </div>

        {/* Assemble Mode */}
        <div ref={assembleRef} id="assemble">
          <AssembleSection />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Scroll to top */}
      <ScrollToTop />
    </div>
  );
}

function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 left-8 z-50 w-12 h-12 bg-[#00ff88] text-black rounded-full flex items-center justify-center shadow-lg hover:neon-glow-strong transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
