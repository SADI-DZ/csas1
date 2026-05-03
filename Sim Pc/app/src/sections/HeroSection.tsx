import { motion } from 'framer-motion';
import { Cpu, Wrench, BookOpen, ChevronLeft } from 'lucide-react';

interface HeroSectionProps {
  onModeChange: (mode: 'explore' | 'learn' | 'assemble') => void;
}

export default function HeroSection({ onModeChange }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-bg.jpg"
          alt="PC Build"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#00ff88] rounded-full opacity-30"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -20, 20, -10, 0],
              opacity: [0.1, 0.4, 0.2, 0.5, 0.1],
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Cpu className="w-10 h-10 text-[#00ff88]" />
            <span className="text-[#00ff88] text-lg font-semibold tracking-wide">
              محاكي تجميع الحاسوب 3D
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-black mb-6 leading-tight"
        >
          <span className="gradient-text">تعلم تركيب</span>
          <br />
          <span className="text-white">حاسوبك بنفسك</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          استكشف مكونات الحاسوب بتقنية 3D تفاعلية، تعلم وظائف كل قطعة،
          وطبق ما تعلمته في محاكاة تركيب واقعية خطوة بخطوة
        </motion.p>

        {/* Mode Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <button
            onClick={() => onModeChange('explore')}
            className="group relative p-6 rounded-xl bg-[#1a1a1a]/80 border border-white/5 hover:border-[#00ff88]/30 transition-all duration-300 hover:neon-glow text-right"
          >
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-[#00ff88]" />
            </div>
            <BookOpen className="w-10 h-10 text-[#00ff88] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">استكشاف المكونات</h3>
            <p className="text-gray-400 text-sm">
              تعرف على جميع قطع الحاسوب ومواصفاتها التقنية بتقنية 3D
            </p>
          </button>

          <button
            onClick={() => onModeChange('learn')}
            className="group relative p-6 rounded-xl bg-[#1a1a1a]/80 border border-white/5 hover:border-[#0088ff]/30 transition-all duration-300 text-right"
            style={{ boxShadow: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 136, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-[#0088ff]" />
            </div>
            <Cpu className="w-10 h-10 text-[#0088ff] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">التعلم التفاعلي</h3>
            <p className="text-gray-400 text-sm">
              تعلم وظيفة كل مكون وكيفية اختيار القطع المتوافقة
            </p>
          </button>

          <button
            onClick={() => onModeChange('assemble')}
            className="group relative p-6 rounded-xl bg-[#1a1a1a]/80 border border-white/5 hover:border-[#00ff88]/30 transition-all duration-300 text-right"
            style={{ boxShadow: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 136, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-[#00ff88]" />
            </div>
            <Wrench className="w-10 h-10 text-[#00ff88] mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">محاكاة التجميع</h3>
            <p className="text-gray-400 text-sm">
              جرب تركيب الحاسوب خطوة بخطوة مع إرشادات وتحقق من الأخطاء
            </p>
          </button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-500 text-sm"
          >
            مرر للأسفل للاستكشاف
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
