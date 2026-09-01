import { Fragment } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ChevronRight, FileText } from 'lucide-react';
import { LottieMark } from './NotesLoader';
import pdfLoadingAnimation from '../assets/loading3.json';

const EASE = [0.22, 1, 0.36, 1];

const ProcessingModal = ({
  open,
  source = null,
  stages = [],
  activeIndex = 0,
  state = 'running', // running | done
  heading = 'Structuring your lecture',
  doneHeading = '',
  sub = '',
  detail = '',
  loadingAnimation = pdfLoadingAnimation,
  resultContent = null,
  onOpenStructured,
}) => {
  const reduced = useReducedMotion();
  const done = state === 'done';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={done ? 'Processing complete' : 'Processing lecture'}
        className="relative w-full max-w-[720px] rounded-[24px] border border-(--border) bg-(--surface-elevated) shadow-2xl overflow-hidden"
        initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduced ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: EASE }}
      >
        {/* Compact source preview */}
        {source && (
          <div className="flex items-center gap-3 px-6 pt-6">
            {source.thumbnail ? (
              <img
                src={source.thumbnail}
                alt=""
                className="w-16 h-10 rounded-lg object-cover border border-(--border-subtle) shrink-0"
              />
            ) : (
              <span className="w-10 h-10 rounded-lg bg-(--accent-soft) text-(--accent-text) flex items-center justify-center shrink-0">
                <FileText size={16} />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-(--text) truncate">{source.label}</p>
              <p className="text-[11.5px] text-(--text-faint) truncate">{source.meta}</p>
            </div>
          </div>
        )}

        {/* Center processing area */}
        <div className="px-6 pt-5 pb-8 flex flex-col items-center text-center">
          {/* Lottie / success */}
          <div className="relative h-[168px] w-[168px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!done ? (
                <motion.div
                  key="lottie"
                  className="absolute inset-0"
                  exit={reduced ? undefined : { opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <LottieMark size={168} src={loadingAnimation} />
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  className="absolute inset-0 flex items-center justify-center"
                  initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <span className="w-14 h-14 rounded-full bg-(--success-soft) text-(--success) flex items-center justify-center">
                    <Check size={26} strokeWidth={2.5} />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <h2 className="mt-4 font-display text-[22px] text-(--text) tracking-tight leading-tight">
            {done ? doneHeading || 'Your lecture is ready.' : heading}
          </h2>
          {sub && !done && (
            <p className="mt-1.5 text-[13px] text-(--text-dim) max-w-sm">{sub}</p>
          )}

          {/* Compact horizontal stage bar */}
          <div className="mt-6 flex items-start gap-0">
            {stages.map((s, i) => {
              const isDone = i < activeIndex || done;
              const isActive = i === activeIndex && !done;
              return (
                <Fragment key={s.key}>
                  {i > 0 && (
                    <div
                      className={`mt-[9px] w-6 sm:w-8 h-px shrink-0 ${i <= activeIndex ? 'bg-(--accent-teal)/60' : 'bg-(--border)'}`}
                    />
                  )}
                  <div className="flex flex-col items-center gap-1.5 w-[58px] sm:w-[72px]">
                    {isDone ? (
                      <span className="w-5 h-5 rounded-full bg-(--accent-teal)/15 text-(--accent-teal) flex items-center justify-center">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    ) : isActive ? (
                      <motion.span
                        className="relative w-5 h-5"
                        animate={reduced ? {} : { scale: [1, 1.12, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <span className="absolute inset-0 rounded-full border-2 border-(--accent-amber)" />
                        <span className="absolute inset-[6px] rounded-full bg-(--accent-amber)" />
                      </motion.span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-(--text-faint) opacity-40" />
                    )}
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                        isDone
                          ? 'text-(--accent-teal)'
                          : isActive
                          ? 'text-(--accent-amber)'
                          : 'text-(--text-faint) opacity-60'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </Fragment>
              );
            })}
          </div>

          {detail && !done && (
            <p className="mt-5 text-[11.5px] text-(--text-faint)">{detail}</p>
          )}

          {done && resultContent ? (
            <div className="mt-6 w-full">
              {resultContent}
            </div>
          ) : (
            done && (
              <motion.button
                type="button"
                onClick={onOpenStructured}
                className="mt-6 btn-primary px-5 h-10 text-[13px]"
                initial={reduced ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3, ease: EASE }}
              >
                Open structured notes
                <ChevronRight size={15} />
              </motion.button>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProcessingModal;
