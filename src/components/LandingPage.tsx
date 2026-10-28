import { 
  ArrowRight, BookOpen, GraduationCap, Newspaper, 
  MapPin, Globe, Users, ExternalLink 
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onNavigateToArchive: () => void;
  onNavigateToTraining: () => void;
  onNavigateToBlog: () => void;
}

const ResearchImpactChart = () => (
  <div className="w-full h-32 relative group/chart">
    <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#ea580c" stopOpacity="1" />
          <stop offset="100%" stopColor="#d97706" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M 0 80 Q 50 85 100 60 T 200 40 T 300 70 T 400 20"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="transition-all duration-1000"
      />
      {[0, 100, 200, 300, 400].map((x, i) => {
        const y = [80, 60, 40, 70, 20][i];
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4.5"
            className="fill-orange-600 stroke-white stroke-2 transition-all duration-500 group-hover/chart:r-6"
          />
        );
      })}
    </svg>
    <div className="absolute top-0 left-0 text-[10px] font-mono text-slate-400 uppercase tracking-widest">Global Impact Index</div>
    <div className="absolute bottom-0 right-0 text-[10px] font-mono text-slate-400 uppercase tracking-widest">2026 Projection</div>
  </div>
);

export default function LandingPage({
  onNavigateToArchive,
  onNavigateToTraining,
  onNavigateToBlog,
}: LandingPageProps) {
  return (
    <div className="py-8 space-y-12 max-w-7xl mx-auto">
      {/* Main Hero Panel with Cultural Heritage Watermark */}
      <section className="glass-panel cultural-watermark-card p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/5 to-transparent pointer-events-none" />
        
        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left: Academic Focal Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-[4/3] rounded-[2rem] overflow-hidden group shadow-xl border border-stone-200"
          >
            <img 
              src="https://picsum.photos/seed/academic-future/1200/900" 
              alt="Academic Future" 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 space-y-1.5 text-white">
              <div className="flex items-center gap-2 text-white/80 text-xs font-mono uppercase tracking-widest">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                Global Research Hub • London, UK
              </div>
              <h3 className="text-2xl font-bold text-white drop-shadow-sm">The Future of Scholarly Exchange</h3>
            </div>
          </motion.div>

          {/* Right: Editorial Narrative Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="h-[2px] w-12 bg-orange-600" />
                <span className="text-xs font-mono text-orange-700 uppercase tracking-[0.25em] font-bold">
                  Transformation Framework
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.02]">
                Advancing Higher Ed <br />
                <span className="text-orange-600">Research & Teaching.</span>
              </h1>

              <div className="grid grid-cols-3 gap-6 py-6 border-y border-stone-200">
                {[
                  { label: 'Research', val: '2.4M+', icon: Globe },
                  { label: 'Network', val: '150+', icon: Users },
                  { label: 'Growth', val: '12%', icon: ArrowRight },
                ].map((stat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono uppercase tracking-widest">
                      <stat.icon className="w-3 h-3 text-orange-600" />
                      {stat.label}
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stat.val}</div>
                  </div>
                ))}
              </div>

              <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl">
                ARHET is a specialized academic platform dedicated to the strategic transformation of higher education. We bridge foundational scholarly traditions with modern digital research repositories and executive training.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button 
                  onClick={onNavigateToArchive}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold transition-all shadow-md shadow-orange-600/20 flex items-center gap-2 group text-xs uppercase tracking-wider"
                >
                  Explore Research Archive
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={onNavigateToTraining}
                  className="px-8 py-4 bg-white hover:bg-stone-50 text-slate-800 border border-stone-300 rounded-2xl font-bold transition-all shadow-sm text-xs uppercase tracking-wider"
                >
                  Book Training Workshops
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Section: Research Impact & Faculty Lead */}
        <div className="grid lg:grid-cols-3 gap-8 mt-12 relative z-10">
          <div className="lg:col-span-2 glass-card p-8 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-black text-sm border border-orange-200">
                  01
                </div>
                <h4 className="text-lg font-bold text-slate-900">Transformation Impact</h4>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-[10px] font-mono text-slate-600 uppercase tracking-widest font-bold">
                Live Data Index
              </div>
            </div>
            <ResearchImpactChart />
          </div>

          <div className="glass-card p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-sm border border-stone-200">
                    PA
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Dr P Ajibade (PhD)</div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Lead Research Scholar</div>
                  </div>
                </div>
                <button 
                  onClick={onNavigateToBlog}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors text-slate-400 hover:text-orange-600"
                  title="View Publications"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-stone-200">
                {[
                  { label: 'Papers', val: '42' },
                  { label: 'Citations', val: '1.2k' },
                  { label: 'Projects', val: '18' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl font-bold text-slate-900">{stat.val}</div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <button 
              onClick={onNavigateToBlog}
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-xs font-bold text-slate-800 transition-all uppercase tracking-widest"
            >
              View Research Publications
            </button>
          </div>
        </div>
      </section>

      {/* Secondary Pillars Section */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          {
            title: 'Global Archive',
            desc: 'Access millions of open-access academic publications across OpenAlex, CrossRef, and CORE repositories.',
            icon: BookOpen,
            color: 'text-orange-600',
            action: onNavigateToArchive,
          },
          {
            title: 'Executive Training',
            desc: 'Four quarterly interactive workshops with direct Google Meet virtual classrooms and certified attendance.',
            icon: GraduationCap,
            color: 'text-amber-600',
            action: onNavigateToTraining,
          },
          {
            title: 'Scholarly Blog',
            desc: 'Stay informed with critical essays, curriculum reform analyses, and transformation strategies from academic leaders.',
            icon: Newspaper,
            color: 'text-orange-700',
            action: onNavigateToBlog,
          }
        ].map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={feat.action}
            className="glass-card p-8 group cursor-pointer hover:border-orange-500/40 hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
              <feat.icon className={`w-6 h-6 ${feat.color}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
              {feat.title}
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm">{feat.desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
