import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowRight,
  CheckCircle2,
  Clapperboard,
  Lock,
  PenLine,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getTryStatus, processTry } from '../services/tryFreeService';
import { toErrorMessage } from '../utils/errors';
import { extractYouTubeId } from '../services/videoService';
import SourcePipeline from './SourcePipeline';

const EASE = [0.22, 1, 0.36, 1];

const ANON_KEY = 'notesync_try_anon';

const getOrCreateAnonId = () => {
  try {
    let id = localStorage.getItem(ANON_KEY);
    if (!id) {
      id = `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }
};

const TRY_STAGES_YOUTUBE = ['Finding video', 'Extracting transcript', 'AI structuring'];
const TRY_STAGES_TEXT = ['Reading text', 'AI structuring'];

const TryFreeSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const reduced = useReducedMotion();

  const [mode, setMode] = useState('youtube'); // youtube | text
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | working | done | error | locked
  const [stage, setStage] = useState(0);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [usedCount, setUsedCount] = useState(0);
  const [checking, setChecking] = useState(true);
  const timerRef = useRef(null);

  // Anonymous visitors get one free try. Authenticated users bypass the gate.
  const anonId = useRef(null);
  if (!anonId.current && typeof window !== 'undefined') anonId.current = getOrCreateAnonId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (isAuthenticated) {
          setUsedCount(0);
          setChecking(false);
          return;
        }
        const data = await getTryStatus(anonId.current);
        if (cancelled) return;
        setUsedCount(data.usedCount || 0);
        if (data.usedCount >= 1) setPhase('locked');
      } catch {
        if (!cancelled) setUsedCount(0);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated]);

  const stopStaging = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const runTry = async () => {
    if (isAuthenticated) return;
    if (phase === 'locked') return;

    const hasContent = mode === 'youtube' ? Boolean(extractYouTubeId(url.trim())) : Boolean(text.trim());
    if (!hasContent) {
      setError(mode === 'youtube' ? "That doesn't look like a valid YouTube link." : 'Paste some notes first.');
      return;
    }

    setError('');
    setOutput('');
    setPhase('working');
    setStage(0);
    stopStaging();

    // Staged progress — the backend returns the full result in one response,
    // so we advance through honest milestones while it works.
    timerRef.current = setInterval(() => {
      setStage((s) => {
        const max = mode === 'youtube' ? TRY_STAGES_YOUTUBE.length - 1 : TRY_STAGES_TEXT.length - 1;
        if (s < max) return s + 1;
        stopStaging();
        return s;
      });
    }, 1000);

    try {
      const result = await processTry(
        anonId.current,
        mode,
        mode === 'youtube' ? url.trim() : '',
        mode === 'text' ? text.trim() : ''
      );
      stopStaging();
      setOutput(result.markdown || '');
      setUsedCount(result.usedCount ?? 1);
      setPhase('done');
    } catch (err) {
      stopStaging();
      const message = toErrorMessage(err, 'Could not structure your notes. Try again.');
      if (err?.response?.data?.error?.code === 'TRY_LIMIT_REACHED' || /free try/i.test(message)) {
        setPhase('locked');
      } else {
        setPhase('error');
        setError(message);
      }
    }
  };

  const goLogin = () => navigate('/login');

  const stages = mode === 'youtube' ? TRY_STAGES_YOUTUBE : TRY_STAGES_TEXT;

  if (checking) {
    return (
      <section id="try" className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-16 md:py-24">
        <div className="rounded-[32px] border border-(--border-subtle) bg-(--surface) p-10 flex items-center justify-center">
          <Sparkles size={18} className="animate-pulse text-(--accent-text)" />
          <p className="ml-2 text-[13px] text-(--text-dim)">Checking your free try…</p>
        </div>
      </section>
    );
  }

  return (
    <section id="try" className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-16 md:py-24 scroll-mt-24">
      {/* Intro */}
      <motion.div
        className="max-w-[620px] mx-auto text-center"
        initial={reduced ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <p className="text-[12px] font-bold text-(--accent-text) uppercase tracking-[0.16em] mb-2.5">
          Try it free
        </p>
        <h2 className="font-display text-[30px] sm:text-[40px] lg:text-[44px] leading-[1.08] tracking-tight text-(--text)">
          See the magic <em className="text-(--accent-text)">before you sign up.</em>
        </h2>
        <p className="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-(--text-dim)">
          Paste a YouTube lecture or raw notes — NotesSync will structure it into clean,
          revision-ready Markdown. One free try, no account needed.
        </p>
      </motion.div>

      {/* Card */}
      <motion.div
        className="mt-10"
        initial={reduced ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
      >
        <div className="grid lg:grid-cols-2 gap-4">
          {/* LEFT — input */}
          <div className="rounded-[28px] border border-(--border-subtle) bg-(--surface) p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between gap-3 mb-5">
              <p className="text-[13px] font-semibold text-(--text)">Try any input:</p>
              <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-(--border-subtle) bg-(--bg-subtle)">
                <button
                  type="button"
                  onClick={() => { setMode('youtube'); setError(''); }}
                  className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 ${
                    mode === 'youtube' ? 'bg-(--accent) text-(--accent-fg) shadow-sm' : 'text-(--text-dim) hover:text-(--text)'
                  }`}
                >
                  <Clapperboard size={13} /> YouTube
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('text'); setError(''); }}
                  className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 ${
                    mode === 'text' ? 'bg-(--accent) text-(--accent-fg) shadow-sm' : 'text-(--text-dim) hover:text-(--text)'
                  }`}
                >
                  <PenLine size={13} /> Raw text
                </button>
              </div>
            </div>

            {phase === 'locked' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-(--border-subtle) bg-(--bg-subtle)/60 p-8">
                <span className="w-12 h-12 rounded-full bg-(--surface-hover) border border-(--border-subtle) flex items-center justify-center mb-4">
                  <Lock size={20} className="text-(--accent-text)" />
                </span>
                <h3 className="text-[16px] font-semibold text-(--text) mb-1.5">You've used your free try</h3>
                <p className="text-[13px] text-(--text-dim) max-w-sm leading-relaxed mb-5">
                  Log in to keep structuring PDFs, videos and notes — unlimited, synced across
                  your devices.
                </p>
                <button
                  type="button"
                  onClick={goLogin}
                  className="h-11 px-6 rounded-full bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) text-[13.5px] font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  Log in to continue
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-3">
                {mode === 'youtube' ? (
                  <div>
                    <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
                      YouTube lecture link
                    </label>
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && runTry()}
                      placeholder="https://youtube.com/watch?v=… or youtu.be/…"
                      disabled={phase === 'working'}
                      className="input w-full text-[13px]"
                      aria-label="YouTube URL"
                    />
                    <p className="mt-1.5 text-[11px] text-(--text-faint)">
                      Any public lecture with captions enabled.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
                      Paste messy notes
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={"Type or paste messy lecture notes…\n\nExample:\naaj 3NF padha. transitive dep hatao. 2NF bhi chahiye."}
                      disabled={phase === 'working'}
                      rows={8}
                      className="input w-full resize-none text-[13px] leading-relaxed"
                      aria-label="Raw notes"
                    />
                    <p className="mt-1.5 text-[11px] text-(--text-faint)">
                      Hinglish, shorthand, fragments — we structure it all.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-(--danger-border) bg-(--danger-soft) px-3.5 py-3 text-[12.5px] text-(--danger) leading-relaxed">
                    <X size={14} className="mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}

                {phase === 'working' && (
                  <div className="mt-1">
                    <SourcePipeline
                      stages={stages}
                      activeIndex={stage}
                      state="running"
                    />
                  </div>
                )}

                {phase === 'working' ? (
                  <div className="mt-1">
                    <button
                      type="button"
                      disabled
                      className="h-11 px-6 rounded-full bg-(--accent) opacity-70 text-(--accent-fg) text-[13.5px] font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Sparkles size={14} className="animate-pulse" />
                      Structuring…
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={runTry}
                      className="h-11 px-6 rounded-full bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) text-[13.5px] font-semibold flex items-center gap-2 transition-colors shadow-sm"
                    >
                      <Sparkles size={14} />
                      Try it now
                    </button>
                    <p className="text-[11.5px] text-(--text-faint) flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-(--accent-text)" />
                      1 free try · no sign-up
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — output preview */}
          <div className="rounded-[28px] border border-(--border-subtle) bg-(--surface) p-5 sm:p-6 flex flex-col min-h-[360px]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-[13px] font-semibold text-(--text)">Structured notes</p>
              {phase === 'done' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-(--success-soft) text-(--success) text-[11px] font-semibold">
                  <CheckCircle2 size={12} /> Ready
                </span>
              )}
            </div>

            {phase === 'done' && output ? (
              <div className="flex-1 rounded-2xl border border-(--border-subtle) bg-(--bg-subtle)/50 px-5 py-4 overflow-y-auto max-h-[440px]">
                <div className="try-preview-md">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
                </div>
              </div>
            ) : phase === 'working' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-(--border-subtle) p-8">
                <Sparkles size={22} className="text-(--accent-text) animate-pulse mb-3" />
                <p className="text-[13px] text-(--text-dim)">Your structured notes will appear here.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-(--border-subtle) p-8">
                <Sparkles size={22} className="text-(--text-faint) mb-3" />
                <p className="text-[13px] text-(--text-dim)">
                  Run a free try on the left to see clean Markdown output here.
                </p>
              </div>
            )}

            {phase === 'done' && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={goLogin}
                  className="h-10 px-5 rounded-full bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) text-[13px] font-semibold flex items-center gap-2 transition-colors shadow-sm"
                >
                  Save & keep structuring
                  <ArrowRight size={13} />
                </button>
                <a
                  href="#how"
                  className="h-10 px-5 rounded-full border border-(--border-subtle) text-(--text) text-[13px] font-semibold flex items-center gap-2 hover:bg-(--surface-hover) transition-colors"
                >
                  Learn more
                </a>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default TryFreeSection;