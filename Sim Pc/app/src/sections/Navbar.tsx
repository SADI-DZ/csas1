import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Menu, X } from 'lucide-react';

interface NavbarProps {
  currentMode: string;
  onModeChange: (mode: 'explore' | 'learn' | 'assemble') => void;
}

const navItems = [
  { id: 'explore', label: 'استكشاف', color: '#00ff88' },
  { id: 'learn', label: 'تعلم', color: '#0088ff' },
  { id: 'assemble', label: 'تجميع', color: '#00ff88' },
];

export default function Navbar({ currentMode, onModeChange }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#0088ff] rounded-xl flex items-center justify-center">
            <Cpu className="w-5 h-5 text-black" />
          </div>
          <div className="hidden sm:block">
            <span className="text-white font-bold text-lg">محاكي الحاسوب</span>
            <span className="text-[#00ff88] text-xs block -mt-1">3D تفاعلي</span>
          </div>
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id as 'explore' | 'learn' | 'assemble')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                currentMode === item.id
                  ? 'text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={
                currentMode === item.id
                  ? { backgroundColor: item.color }
                  : undefined
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 bg-[#1a1a1a] rounded-xl flex items-center justify-center"
        >
          {mobileOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onModeChange(item.id as 'explore' | 'learn' | 'assemble');
                    setMobileOpen(false);
                  }}
                  className={`w-full text-right px-5 py-3 rounded-xl font-semibold transition-all ${
                    currentMode === item.id
                      ? 'text-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={
                    currentMode === item.id
                      ? { backgroundColor: item.color }
                      : undefined
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
