import { Lottie } from 'lottie-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FileText,
  FileSearch,
  ScanText,
  LayoutTemplate,
  Database,
  CheckCircle2,
  Sparkles,
  Search,
  Brain,
} from 'lucide-react';
import loadingAnimation from '../assets/loading.json';
import pdfLoadingAnimation from '../assets/loading3.json';
import { BrandMark } from './Brand';

const EASE = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Lottie visual — the NotesSync motion mark                           */
/* ------------------------------------------------------------------ */
export const LottieMark = ({ size = 180, loop = true, autoplay = true, className = '', src }) => {
  const reduced = useReducedMotion();

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Lottie
        src={src || loadingAnimation}
        loop={reduced ? false : loop}
        autoplay={autoplay}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Full-screen app loader                                              */
/* ------------------------------------------------------------------ */
export const AppLoader = () => {
  const reduced = useReducedMotion();
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-(--bg)">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <BrandMark size={46} />
        <motion.p
          className="font-display text-[19px] tracking-tight text-(--text)"
          animate={reduced ? {} : { opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          NotesSync
        </motion.p>
      </motion.div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Staged pipeline loader — e.g. PDF → Extract → Structure → Ready     */
/* ------------------------------------------------------------------ */
const PIPELINE_STAGES = {
  PDF_UPLOADING: [
    { icon: FileText, label: 'PDF' },
    { icon: FileSearch, label: 'Extract' },
    { icon: LayoutTemplate, label: 'Structure' },
    { icon: Database, label: 'Embed' },
    { icon: CheckCircle2, label: 'Ready' },
  ],
  PDF_EXTRACTING: [
    { icon: FileText, label: 'PDF' },
    { icon: ScanText, label: 'Extract' },
    { icon: LayoutTemplate, label: 'Structure' },
    { icon: Database, label: 'Embed' },
    { icon: CheckCircle2, label: 'Ready' },
  ],
};

export const PipelineLoader = ({ state = 'PDF_UPLOADING', current = 0, label }) => {
  const reduced = useReducedMotion();
  const stages = PIPELINE_STAGES[state] || PIPELINE_STAGES.PDF_UPLOADING;

  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className="flex items-center gap-2">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < current;
          const isActive = i === current;
          return (
            <div key={s.label} className="flex items-center gap-2">
              <motion.div
                className={`flex flex-col items-center gap-1.5 ${
                  isActive || isDone ? '' : 'opacity-40'
                }`}
                animate={reduced || !isActive ? {} : { y: [0, -4, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-(--success-soft) border-(--success-soft) text-(--success)'
                      : isActive
                      ? 'bg-(--accent) border-(--accent) text-(--accent-fg)'
                      : 'bg-(--surface) border-(--border-subtle) text-(--text-faint)'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide ${
                    isActive ? 'text-(--accent-text)' : 'text-(--text-faint)'
                  }`}
                >
                  {s.label}
                </span>
              </motion.div>
              {i < stages.length - 1 && (
                <motion.div
                  className="w-5 h-px mb-4"
                  style={{ background: 'var(--border-strong)' }}
                  animate={reduced || !isActive ? {} : { opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </div>
          );
        })}
      </div>
      {label && (
        <p className="text-[13px] text-(--text-dim) flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-(--border-strong) border-t-(--accent-text) animate-spin" />
          {label}
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Single-state loader (generic, branded)                              */
/* ------------------------------------------------------------------ */
const STATE_META = {
  APP_LOADING: { icon: Sparkles, label: 'Loading your workspace' },
  AI_PROCESSING: { icon: Sparkles, label: 'Structuring your notes with AI' },
  EMBEDDING: { icon: Database, label: 'Embedding notes for search' },
  SEARCHING: { icon: Search, label: 'Searching your notes' },
  RAG_THINKING: { icon: Brain, label: 'Thinking about your notes' },
  PDF_UPLOADING: { icon: FileText, label: 'Uploading file', src: pdfLoadingAnimation },
  PDF_EXTRACTING: { icon: ScanText, label: 'Extracting text', src: pdfLoadingAnimation },
};

export const NotesLoader = ({
  state = 'APP_LOADING',
  label,
  size = 'md',
  showLottie = true,
}) => {
  const reduced = useReducedMotion();
  const meta = STATE_META[state] || STATE_META.APP_LOADING;
  const Icon = meta.icon;
  const isSmall = size === 'sm';

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${isSmall ? '' : 'min-h-24'}`}
      role="status"
      aria-live="polite"
    >
      {showLottie ? (
        <LottieMark size={isSmall ? 88 : 140} src={meta.src} />
      ) : (
        <div className="relative">
          <motion.div
            className="w-12 h-12 rounded-2xl bg-(--accent) flex items-center justify-center text-(--accent-fg)"
            animate={reduced ? {} : { scale: [1, 1.06, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Icon size={20} />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-2xl border border-(--accent-ring)"
            animate={reduced ? {} : { scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            aria-hidden
          />
        </div>
      )}
      <motion.p
        className={`${isSmall ? 'text-[12px]' : 'text-[13px]'} text-(--text-dim) font-medium`}
        animate={reduced ? {} : { opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        {label || meta.label}…
      </motion.p>
    </div>
  );
};

export default NotesLoader;