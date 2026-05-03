import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Info, Monitor, Cpu, HardDrive, Zap, Box, Fan, MemoryStick, CircuitBoard } from 'lucide-react';
import { components } from '@/data/components';
import ThreeScene from '@/components/three/ThreeScene';

const iconMap: Record<string, React.ReactNode> = {
  cpu: <Cpu className="w-6 h-6" />,
  motherboard: <CircuitBoard className="w-6 h-6" />,
  ram: <MemoryStick className="w-6 h-6" />,
  gpu: <Monitor className="w-6 h-6" />,
  psu: <Zap className="w-6 h-6" />,
  ssd: <HardDrive className="w-6 h-6" />,
  cooler: <Fan className="w-6 h-6" />,
  case: <Box className="w-6 h-6" />,
};

interface ExploreSectionProps {
  onSelectComponent: (id: string) => void;
}

export default function ExploreSection({ onSelectComponent }: ExploreSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = components.find((c) => c.id === selectedId);
  const hovered = components.find((c) => c.id === hoveredId);

  const scroll = useCallback((dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scroll('right');
      if (e.key === 'ArrowRight') scroll('left');
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [scroll]);

  return (
    <section id="explore" className="relative py-20 px-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-5xl font-black mb-4">
          <span className="gradient-text">استكشف المكونات</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          تعرف على جميع قطع الحاسوب الرئيسية ومواصفاتها التقنية من خلال نماذج ثلاثية الأبعاد تفاعلية
        </p>
      </motion.div>

      {/* 3D Preview Area */}
      <AnimatePresence>
        {(selectedId || hoveredId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-4xl mx-auto mb-12 overflow-hidden"
          >
            <div className="glass-panel rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ThreeScene
                  componentId={(selected || hovered)!.id}
                  autoRotate={!selectedId}
                  height="350px"
                />
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-[#00ff88]">
                      {iconMap[(selected || hovered)!.id]}
                    </div>
                    <h3 className="text-3xl font-bold text-white">
                      {(selected || hovered)!.name}
                    </h3>
                  </div>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {(selected || hovered)!.description}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {(selected || hovered)!.specs.slice(0, 4).map((spec) => (
                      <div
                        key={spec.label}
                        className="bg-[#2a2a2a] rounded-lg p-3"
                      >
                        <div className="text-gray-500 text-xs mb-1">{spec.label}</div>
                        <div className="text-white text-sm font-semibold">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => onSelectComponent((selected || hovered)!.id)}
                    className="flex items-center gap-2 bg-[#00ff88] text-black px-6 py-3 rounded-lg font-bold hover:neon-glow-strong transition-all duration-300 self-start"
                  >
                    <Info className="w-5 h-5" />
                    المزيد من التفاصيل
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards Carousel */}
      <div className="relative max-w-7xl mx-auto">
        <button
          onClick={() => scroll('left')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-[#1a1a1a]/90 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#00ff88]/20 hover:border-[#00ff88]/50 transition-all"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-[#1a1a1a]/90 border border-white/10 rounded-full flex items-center justify-center hover:bg-[#00ff88]/20 hover:border-[#00ff88]/50 transition-all"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide px-16 py-4 snap-x snap-mandatory"
        >
          {components.map((component, index) => (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="component-card min-w-[280px] snap-center"
              onMouseEnter={() => setHoveredId(component.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setSelectedId(component.id === selectedId ? null : component.id)}
            >
              <div className="relative h-48 overflow-hidden rounded-t-xl">
                <img
                  src={component.image}
                  alt={component.name}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="text-[#00ff88]">{iconMap[component.id]}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-white mb-2">{component.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{component.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-[#2a2a2a] px-3 py-1 rounded-full">
                    {component.dimensions}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectComponent(component.id);
                    }}
                    className="text-[#00ff88] text-sm font-semibold flex items-center gap-1 hover:underline"
                  >
                    التفاصيل
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Detail Modal */}
      <AnimatePresence>
        {selectedId && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              className="glass-panel rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-[#1a1a1a]/95 backdrop-blur-md p-6 border-b border-white/5 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="text-[#00ff88]">{iconMap[selected.id]}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
                    <p className="text-gray-400 text-sm">{selected.nameEn}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center hover:bg-[#ff4444] transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 3D View */}
                  <ThreeScene componentId={selected.id} autoRotate={true} height="400px" />

                  {/* Info */}
                  <div>
                    <h3 className="text-lg font-bold text-[#00ff88] mb-3">الوصف</h3>
                    <p className="text-gray-300 leading-relaxed mb-6">{selected.fullDescription}</p>

                    <h3 className="text-lg font-bold text-[#00ff88] mb-3">المواصفات التقنية</h3>
                    <div className="space-y-2 mb-6">
                      {selected.specs.map((spec) => (
                        <div
                          key={spec.label}
                          className="flex justify-between items-center bg-[#2a2a2a] rounded-lg p-3"
                        >
                          <span className="text-gray-400 text-sm">{spec.label}</span>
                          <span className="text-white font-semibold text-sm">{spec.value}</span>
                        </div>
                      ))}
                    </div>

                    <h3 className="text-lg font-bold text-[#0088ff] mb-3">التوافق</h3>
                    <div className="flex flex-wrap gap-2">
                      {selected.compatibility.map((item) => (
                        <span
                          key={item}
                          className="bg-[#0088ff]/10 text-[#0088ff] px-3 py-1 rounded-full text-sm border border-[#0088ff]/20"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
