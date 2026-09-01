import { motion, useReducedMotion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

/**
 * SourcePipeline — the shared INPUT → EXTRACT → STRUCTURE → INDEX → READY
 * visual for every import source. Each step gets a meaningful label and state
 * icon; active steps pulse subtly instead of using a generic spinner.
 *
 * props:
 *   stages      string[]        ordered step labels
 *   activeIndex number         0-based index of the currently-running step
 *   state       'running' | 'done' | 'error'
 *   errorText   string?         shown when state === 'error'
 *   onRetry     () => void?     show a retry affordance when provided
 */
const SourcePipeline = ({ stages, activeIndex = 0, state = 'running', errorText = '', onRetry, className = '' }) => {
  const reduced = useReducedMotion();

  return (
    <div className={`flex flex-col gap-2.5 ${className}`} role="status" aria-live="polite">
      {stages.map((label, i) => {
        const isPast = i < activeIndex;
        const isActive = i === activeIndex && state === 'running';
        const isFailed = i === activeIndex && state === 'error';

        return (
          <motion.div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-(--border-subtle) bg-(--surface) px-3.5 py-2.5"
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                isPast || (i === stages.length - 1 && state === 'done')
                  ? 'bg-(--success-soft) text-(--success)'
                  : isActive
                  ? 'bg-(--accent-soft) text-(--accent-text)'
                  : isFailed
                  ? 'bg-(--danger-soft) text-(--danger)'
                  : 'bg-(--surface-hover) text-(--text-faint)'
              }`}
            >
              {isActive ? (
                <span className="w-3 h-3 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" />
              ) : isPast || state === 'done' ? (
                <Check size={12} strokeWidth={3} />
              ) : (
                <Circle size={8} className="fill-current" />
              )}
            </span>

            <span
              className={`text-[12.5px] font-medium truncate ${
                isActive
                  ? 'text-(--text)'
                  : isFailed
                  ? 'text-(--danger)'
                  : isPast || state === 'done'
                  ? 'text-(--text-dim)'
                  : 'text-(--text-faint)'
              }`}
            >
              {label}
            </span>
          </motion.div>
        );
      })}

      {state === 'error' && errorText && (
        <motion.div
          className="mt-1 rounded-xl border border-(--danger-border) bg-(--danger-soft) px-3.5 py-3"
          initial={reduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-[12.5px] font-medium text-(--danger) leading-relaxed">{errorText}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2.5 h-8 px-3.5 rounded-lg bg-(--danger) text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default SourcePipeline;