import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, FileText, Sparkles, Search, CheckCircle2, ArrowRight } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Auth illustration — clean geometric "messy → organized" visual.     */
/* Uses Lucide icons + CSS shapes instead of complex SVG drawing.      */
/* ------------------------------------------------------------------ */

const EASE = [0.22, 1, 0.36, 1];

const FloatCard = ({ children, className = '', delay = 0, y = [0, -6, 0], duration = 4 }) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.15, ease: EASE }}
    >
      <motion.div
        animate={reduced ? {} : { y }}
        transition={{ duration, delay: delay * 0.3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

const AuthIllustration = ({ className = '' }) => {
  const reduced = useReducedMotion();

  return (
    <div className={`${className} select-none`} aria-hidden>
      <div className="relative w-full max-w-[420px] mx-auto aspect-square">

        {/* Background decorative blurs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[8%] w-32 h-32 rounded-full bg-(--pastel-yellow) opacity-40 blur-2xl" />
          <div className="absolute top-[15%] right-[5%] w-28 h-28 rounded-full bg-(--pastel-lavender) opacity-35 blur-2xl" />
          <div className="absolute bottom-[20%] right-[12%] w-24 h-24 rounded-full bg-(--pastel-mint) opacity-30 blur-2xl" />
        </div>

        {/* ── CENTER: Transform arrow ── */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="flex items-center gap-3"
            initial={reduced ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            {/* MESSY side */}
            <div className="w-[140px] h-[170px] rounded-2xl border border-(--border-subtle) bg-(--surface) shadow-lg p-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={14} className="text-(--text-faint)" />
                <span className="text-[10px] font-semibold text-(--text-faint) uppercase tracking-wider">Messy</span>
              </div>
              {/* Scribble lines */}
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  <div className="h-[5px] w-[60%] rounded-full bg-(--text)/10" />
                  <div className="h-[5px] w-[25%] rounded-full bg-(--text)/8" />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-[5px] w-[40%] rounded-full bg-(--text)/8" />
                  <div className="h-[5px] w-[35%] rounded-full bg-(--text)/12" />
                </div>
                <div className="h-[5px] w-[55%] rounded-full bg-(--text)/7" />
                <div className="flex gap-1.5">
                  <div className="h-[5px] w-[30%] rounded-full bg-(--text)/10" />
                  <div className="h-[5px] w-[45%] rounded-full bg-(--text)/6" />
                </div>
                <div className="h-[5px] w-[35%] rounded-full bg-(--text)/8" />
                <div className="flex gap-1.5">
                  <div className="h-[5px] w-[50%] rounded-full bg-(--text)/10" />
                  <div className="h-[5px] w-[20%] rounded-full bg-(--text)/6" />
                </div>
              </div>
            </div>

            {/* Arrow */}
            <motion.div
              className="flex flex-col items-center gap-1"
              animate={reduced ? {} : { x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles size={14} className="text-(--accent-text)" />
              <ArrowRight size={18} className="text-(--accent-text)" />
            </motion.div>

            {/* CLEAN side */}
            <div className="w-[140px] h-[170px] rounded-2xl border border-(--accent-text)/20 bg-(--surface) shadow-lg p-3.5 flex flex-col gap-2 ring-1 ring-(--accent-text)/10">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={14} className="text-(--accent-text)" />
                <span className="text-[10px] font-semibold text-(--accent-text) uppercase tracking-wider">Clean</span>
              </div>
              {/* Structured lines */}
              <div className="space-y-2">
                <div className="h-[6px] w-[70%] rounded-full bg-(--accent-text)/25" />
                <div className="h-[4px] w-[90%] rounded-full bg-(--text)/10" />
                <div className="h-[4px] w-[80%] rounded-full bg-(--text)/8" />
                <div className="h-px w-full bg-(--border-subtle) my-0.5" />
                <div className="h-[6px] w-[55%] rounded-full bg-(--accent-text)/20" />
                <div className="h-[4px] w-[85%] rounded-full bg-(--text)/10" />
                <div className="h-[4px] w-[65%] rounded-full bg-(--text)/8" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── FLOATING ACCENT CARDS ── */}

        {/* Top-left: PDF badge */}
        <FloatCard className="top-[6%] left-[4%]" delay={1} y={[0, -5, 0]} duration={4.5}>
          <div className="w-11 h-11 rounded-xl bg-(--pastel-yellow) border border-(--border-subtle) shadow-sm flex items-center justify-center rotate-[-6deg]">
            <FileText size={18} className="text-(--text) opacity-70" />
          </div>
        </FloatCard>

        {/* Top-right: Sparkle badge */}
        <FloatCard className="top-[8%] right-[10%]" delay={2} y={[0, -4, 0]} duration={3.8}>
          <div className="w-10 h-10 rounded-xl bg-(--pastel-lavender) border border-(--border-subtle) shadow-sm flex items-center justify-center rotate-[5deg]">
            <Sparkles size={16} className="text-(--accent-text) opacity-80" />
          </div>
        </FloatCard>

        {/* Bottom-left: Search */}
        <FloatCard className="bottom-[14%] left-[6%]" delay={3} y={[0, -4, 0]} duration={5}>
          <div className="w-10 h-10 rounded-xl bg-(--pastel-cyan) border border-(--border-subtle) shadow-sm flex items-center justify-center rotate-[4deg]">
            <Search size={16} className="text-(--text) opacity-60" />
          </div>
        </FloatCard>

        {/* Bottom-right: Checkmark chip */}
        <FloatCard className="bottom-[12%] right-[5%]" delay={4} y={[0, -5, 0]} duration={4.2}>
          <div className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-(--pastel-mint) border border-(--border-subtle) shadow-sm rotate-[-3deg]">
            <CheckCircle2 size={13} className="text-(--success)" />
            <span className="text-[10px] font-semibold text-(--text) opacity-60">Organized</span>
          </div>
        </FloatCard>

        {/* Small floating dots */}
        <motion.div
          className="absolute top-[22%] left-[38%] w-1.5 h-1.5 rounded-full bg-(--accent-text)/30"
          animate={reduced ? {} : { opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[30%] right-[18%] w-1 h-1 rounded-full bg-(--accent-text)/25"
          animate={reduced ? {} : { opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 3, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[28%] left-[25%] w-1 h-1 rounded-full bg-(--text)/15"
          animate={reduced ? {} : { opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 2.8, delay: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />

      </div>
    </div>
  );
};

export default AuthIllustration;