import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { components } from '@/data/components';
import ThreeScene from '@/components/three/ThreeScene';

const tips = [
  {
    title: 'اختيار المعالج المناسب',
    content: 'حدد استخدامك قبل الشراء: المعالجات متعددة الأنوية أفضل للألعاب والمونتاج، بينما الأنوية الأقل تكفي للاستخدام المكتبي.',
    icon: 'cpu',
  },
  {
    title: 'التوافق بين المكونات',
    content: 'تأكد من توافق المعالج مع مقبس اللوحة الأم، وتوافق الذاكرة مع نوع اللوحة (DDR4/DDR5).',
    icon: 'motherboard',
  },
  {
    title: 'حجم الصندوق',
    content: 'تأكد من أن بطاقة الرسوميات تتسع داخل الصندوق، وأن المبرد يتناسب مع الارتفاع المتاح.',
    icon: 'case',
  },
  {
    title: 'قدرة مزود الطاقة',
    content: 'احسب استهلاك الطاقة الإجمالي وأضف 30% هامش أمان. استخدم حاسبات PSU المتوفرة أونلاين.',
    icon: 'psu',
  },
  {
    title: 'تدفق الهواء',
    content: 'نظم مراوح الصندوق بحيث تدخل الهواء من الأمام والأسفل وتخرج من الخلف والأعلى.',
    icon: 'cooler',
  },
  {
    title: 'سرعة الذاكرة',
    content: 'اختر أعلى تردد يدعمه المعالج واللوحة الأم للحصول على أفضل أداء.',
    icon: 'ram',
  },
];

export default function LearnSection() {
  const [activeComponent, setActiveComponent] = useState(0);
  const [activeTip, setActiveTip] = useState(0);

  const current = components[activeComponent];

  const next = () => {
    setActiveComponent((prev) => (prev + 1) % components.length);
  };

  const prev = () => {
    setActiveComponent((prev) => (prev - 1 + components.length) % components.length);
  };

  return (
    <section id="learn" className="relative py-20 px-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center gap-2 bg-[#0088ff]/10 border border-[#0088ff]/20 rounded-full px-4 py-2 mb-6">
          <BookOpen className="w-5 h-5 text-[#0088ff]" />
          <span className="text-[#0088ff] text-sm font-semibold">وضع التعلم</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black mb-4">
          <span className="text-[#0088ff]">تعلم </span>
          <span className="text-white">بطريقة تفاعلية</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          استكشف كل مكون بتفصيل، تعلم وظيفته وكيفية اختياره وتركيبه بشكل صحيح
        </p>
      </motion.div>

      {/* Main Learning Area */}
      <div className="max-w-7xl mx-auto">
        {/* Component Selector */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 bg-[#1a1a1a] rounded-full p-2 overflow-x-auto">
            {components.map((comp, idx) => (
              <button
                key={comp.id}
                onClick={() => setActiveComponent(idx)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  idx === activeComponent
                    ? 'bg-[#0088ff] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {comp.name}
              </button>
            ))}
          </div>
        </div>

        {/* Component Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="glass-panel rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* 3D View */}
              <div className="relative min-h-[400px]">
                <ThreeScene componentId={current.id} autoRotate={true} height="400px" />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
                  <span className="text-white text-sm font-semibold">
                    {activeComponent + 1} / {components.length}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button
                    onClick={prev}
                    className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#0088ff] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={next}
                    className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#0088ff] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Info Panel */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-black text-[#0088ff]">{current.nameEn}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{current.name}</h3>
                <p className="text-gray-300 leading-relaxed mb-8">{current.fullDescription}</p>

                {/* Specs */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-[#00ff88] mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    المواصفات التقنية
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {current.specs.map((spec) => (
                      <div
                        key={spec.label}
                        className="bg-[#2a2a2a] rounded-lg p-3 border border-white/5"
                      >
                        <div className="text-gray-500 text-xs mb-1">{spec.label}</div>
                        <div className="text-white text-sm font-bold">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compatibility */}
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-[#0088ff] mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    نقاط التوافق
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {current.compatibility.map((item) => (
                      <span
                        key={item}
                        className="bg-[#0088ff]/10 text-[#0088ff] px-3 py-2 rounded-lg text-sm border border-[#0088ff]/20 font-semibold"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-white/5">
                  <div className="text-gray-500 text-sm mb-1">الأبعاد</div>
                  <div className="text-white font-bold text-lg">{current.dimensions}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tips Section */}
        <div className="mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h3 className="text-3xl font-bold text-white mb-3">
              <Lightbulb className="w-8 h-8 text-[#00ff88] inline-block ml-2" />
              نصائح مهمة للاختيار
            </h3>
            <p className="text-gray-400">نصائح عملية تساعدك في اختيار المكونات المناسبة</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tips.map((tip, index) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-300 ${
                  activeTip === index
                    ? 'bg-[#00ff88]/10 border-[#00ff88]/30 neon-glow'
                    : 'bg-[#1a1a1a] border-white/5 hover:border-white/20'
                }`}
                onClick={() => setActiveTip(index)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#00ff88]/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-2">{tip.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{tip.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
