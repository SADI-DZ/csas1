import { Cpu, Github, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#0088ff] rounded-xl flex items-center justify-center">
                <Cpu className="w-5 h-5 text-black" />
              </div>
              <div>
                <span className="text-white font-bold text-lg block">محاكي الحاسوب</span>
                <span className="text-[#00ff88] text-xs">تعلم التجميع بتقنية 3D</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              منصة تعليمية تفاعلية تتيح لك استكشاف مكونات الحاسوب وتعلم تركيبها
              من خلال محاكاة ثلاثية الأبعاد غامرة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#explore"
                  className="text-gray-500 hover:text-[#00ff88] transition-colors text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  استكشاف المكونات
                </a>
              </li>
              <li>
                <a
                  href="#learn"
                  className="text-gray-500 hover:text-[#0088ff] transition-colors text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  وضع التعلم
                </a>
              </li>
              <li>
                <a
                  href="#assemble"
                  className="text-gray-500 hover:text-[#00ff88] transition-colors text-sm flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  محاكاة التجميع
                </a>
              </li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-white font-bold mb-4">التقنيات المستخدمة</h4>
            <div className="flex flex-wrap gap-2">
              {['Three.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'].map(
                (tech) => (
                  <span
                    key={tech}
                    className="bg-[#1a1a1a] text-gray-400 px-3 py-1.5 rounded-lg text-sm border border-white/5"
                  >
                    {tech}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            محاكي تجميع الحاسوب 3D - منصة تعليمية تفاعلية
          </p>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Github className="w-4 h-4" />
            <span>بني بـ Three.js + React</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
