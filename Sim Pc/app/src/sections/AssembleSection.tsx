import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trophy,
  Zap,
  CircuitBoard,
  Cpu,
  MemoryStick,
  Monitor,
  HardDrive,
  Box,
  Fan,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { buildSteps, components } from '@/data/components';
import ThreeScene from '@/components/three/ThreeScene';

const componentIcons: Record<string, React.ReactNode> = {
  psu: <Zap className="w-5 h-5" />,
  motherboard: <CircuitBoard className="w-5 h-5" />,
  cpu: <Cpu className="w-5 h-5" />,
  cooler: <Fan className="w-5 h-5" />,
  ram: <MemoryStick className="w-5 h-5" />,
  gpu: <Monitor className="w-5 h-5" />,
  ssd: <HardDrive className="w-5 h-5" />,
  case: <Box className="w-5 h-5" />,
};

export default function AssembleSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const step = buildSteps[currentStep];
  const currentComponent = components.find((c) => c.id === step?.componentId);

  const completeStep = useCallback(() => {
    if (!completedSteps.includes(currentStep)) {
      const newCompleted = [...completedSteps, currentStep];
      setCompletedSteps(newCompleted);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      if (newCompleted.length === buildSteps.length) {
        setIsComplete(true);
      }
    }
  }, [currentStep, completedSteps]);

  const nextStep = useCallback(() => {
    if (currentStep < buildSteps.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
        return;
      }
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, completedSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsComplete(false);
    setShowWarning(false);
    setShowSuccess(false);
  }, []);

  const progress = (completedSteps.length / buildSteps.length) * 100;

  if (isComplete) {
    return (
      <section id="assemble" className="relative py-20 px-6 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-2xl mx-auto"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-8"
          >
            <Trophy className="w-24 h-24 text-[#00ff88]" />
          </motion.div>

          <h2 className="text-5xl font-black mb-4">
            <span className="gradient-text">تهانينا!</span>
          </h2>
          <p className="text-2xl text-white mb-4">لقد أكملت تجميع الحاسوب بنجاح</p>
          <p className="text-gray-400 mb-10">
            الآن أصبحت جاهزاً لتجميع حاسوب حقيقي. تذكر دائماً اتباع إرشادات السلامة والتعامل بلطف مع المكونات.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="flex items-center gap-2 bg-[#00ff88] text-black px-8 py-4 rounded-xl font-bold text-lg hover:neon-glow-strong transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              إعادة المحاولة
            </button>
          </div>

          {/* Summary */}
          <div className="mt-12 glass-panel rounded-2xl p-8 text-right">
            <h3 className="text-xl font-bold text-white mb-6">ملخص التجميع</h3>
            <div className="space-y-3">
              {buildSteps.map((s) => {
                const comp = components.find((c) => c.id === s.componentId);
                return (
                  <div
                    key={s.step}
                    className="flex items-center gap-3 bg-[#2a2a2a] rounded-lg p-3"
                  >
                    <CheckCircle className="w-5 h-5 text-[#00ff88] flex-shrink-0" />
                    <span className="text-[#00ff88]">{componentIcons[s.componentId]}</span>
                    <span className="text-white flex-1">{s.title}</span>
                    <span className="text-gray-400 text-sm">{comp?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section id="assemble" className="relative py-20 px-6">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-full px-4 py-2 mb-6">
          <Wrench className="w-5 h-5 text-[#00ff88]" />
          <span className="text-[#00ff88] text-sm font-semibold">وضع التجميع</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black mb-4">
          <span className="gradient-text">حاكِ </span>
          <span className="text-white">التجميع خطوة بخطوة</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          تبع الإرشادات واركب كل مكون في موقعه الصحيح. أكمل جميع الخطوات لتجميع حاسوبك الافتراضي
        </p>
      </motion.div>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-sm">تقدم التجميع</span>
          <span className="text-[#00ff88] font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #00ff88, #0088ff)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        {/* Steps Indicator */}
        <div className="flex justify-between mt-4">
          {buildSteps.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(idx)}
              className={`flex flex-col items-center gap-2 transition-all ${
                idx === currentStep
                  ? 'scale-110'
                  : idx < currentStep
                  ? 'opacity-60'
                  : 'opacity-40'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  completedSteps.includes(idx)
                    ? 'bg-[#0088ff] text-white'
                    : idx === currentStep
                    ? 'bg-[#00ff88] text-black ring-4 ring-[#00ff88]/20'
                    : 'bg-[#2a2a2a] text-gray-500'
                }`}
              >
                {completedSteps.includes(idx) ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  componentIcons[s.componentId]
                )}
              </div>
              <span className="text-xs text-gray-400 hidden md:block">{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Assembly Area */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D Component View */}
          <motion.div
            key={step?.componentId}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel rounded-2xl overflow-hidden"
          >
            {step && currentComponent && (
              <>
                <ThreeScene componentId={step.componentId} autoRotate={false} height="400px" />
                <div className="p-4 bg-[#1a1a1a] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#00ff88]">
                      {componentIcons[step.componentId]}
                    </span>
                    <div>
                      <span className="text-white font-bold">{currentComponent.name}</span>
                      <span className="text-gray-500 text-sm mr-2">{currentComponent.nameEn}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-[#2a2a2a] px-3 py-1 rounded-full">
                    الخطوة {currentStep + 1} / {buildSteps.length}
                  </span>
                </div>
              </>
            )}
          </motion.div>

          {/* Instructions Panel */}
          <div className="space-y-6">
            {/* Warning */}
            <AnimatePresence>
              {showWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#ff4444]/10 border border-[#ff4444]/30 rounded-xl p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-[#ff4444] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#ff4444] font-bold text-sm">تنبيه!</p>
                    <p className="text-gray-300 text-sm">
                      أكمل الخطوة الحالية قبل الانتقال للخطوة التالية
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-xl p-4 flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-[#00ff88]" />
                  <p className="text-[#00ff88] font-bold">تم التركيب بنجاح!</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step Card */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{step?.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Sparkles className="w-4 h-4 text-[#00ff88]" />
                    <span>خطوة {step?.step} من {buildSteps.length}</span>
                  </div>
                </div>
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                    completedSteps.includes(currentStep)
                      ? 'bg-[#0088ff]'
                      : 'bg-[#2a2a2a]'
                  }`}
                >
                  {completedSteps.includes(currentStep) ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : (
                    <span className="text-[#00ff88]">
                      {step && componentIcons[step.componentId]}
                    </span>
                  )}
                </div>
              </div>

              {/* Instruction */}
              <div className="bg-[#2a2a2a] rounded-xl p-5 mb-6 border border-white/5">
                <p className="text-gray-300 leading-relaxed text-lg">{step?.instruction}</p>
              </div>

              {/* Warning if exists */}
              {step?.warning && (
                <div className="bg-[#ffaa00]/10 border border-[#ffaa00]/30 rounded-xl p-4 flex items-start gap-3 mb-6">
                  <AlertTriangle className="w-5 h-5 text-[#ffaa00] flex-shrink-0 mt-0.5" />
                  <p className="text-[#ffaa00] text-sm">{step.warning}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {!completedSteps.includes(currentStep) ? (
                  <button
                    onClick={completeStep}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#00ff88] text-black px-6 py-4 rounded-xl font-bold text-lg hover:neon-glow-strong transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    أكملت التركيب
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-[#0088ff]/20 text-[#0088ff] px-6 py-4 rounded-xl font-bold border border-[#0088ff]/30">
                    <CheckCircle className="w-5 h-5" />
                    تم التركيب
                  </div>
                )}
              </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a2a] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#3a3a3a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
                السابق
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === buildSteps.length - 1}
                className="flex-1 flex items-center justify-center gap-2 bg-[#2a2a2a] text-white px-4 py-3 rounded-xl font-semibold hover:bg-[#3a3a3a] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                التالي
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-xl bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-all"
                title="إعادة البدء"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mini Assembly Visualization */}
        <div className="mt-12 glass-panel rounded-2xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">حالة التجميع</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {buildSteps.map((s, idx) => {
              const comp = components.find((c) => c.id === s.componentId);
              const isCompleted = completedSteps.includes(idx);
              const isCurrent = idx === currentStep;

              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    isCompleted
                      ? 'bg-[#0088ff]/20 border-2 border-[#0088ff]'
                      : isCurrent
                      ? 'bg-[#00ff88]/20 border-2 border-[#00ff88] scale-110'
                      : 'bg-[#2a2a2a] border-2 border-transparent hover:border-white/20'
                  }`}
                >
                  <span
                    className={
                      isCompleted
                        ? 'text-[#0088ff]'
                        : isCurrent
                        ? 'text-[#00ff88]'
                        : 'text-gray-500'
                    }
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      componentIcons[s.componentId]
                    )}
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isCompleted
                        ? 'text-[#0088ff]'
                        : isCurrent
                        ? 'text-[#00ff88]'
                        : 'text-gray-500'
                    }`}
                  >
                    {comp?.name.slice(0, 6)}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Connection lines */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-1">
              {buildSteps.map((_, idx) => (
                <div key={idx} className="flex items-center">
                  {idx > 0 && (
                    <ArrowRight
                      className={`w-4 h-4 mx-1 ${
                        completedSteps.includes(idx - 1)
                          ? 'text-[#00ff88]'
                          : 'text-gray-600'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
