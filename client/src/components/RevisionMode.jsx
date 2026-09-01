import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  BrainCircuit,
  Check,
  Layers,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  X,
  Zap,
  ChevronRight,
} from 'lucide-react';
import {
  FcIdea,
  FcReading,
  FcFlashOn,
  FcComboChart,
  FcWorkflow,
  FcViewDetails,
  FcMindMap,
  FcInspection,
  FcTimeline,
  FcBookmark,
  FcQuestions,
  FcDocument,
  FcCheckmark,
  FcBullish,
  FcList,
} from 'react-icons/fc';

/* ------------------------------------------------------------------ */
/* Content derivation — everything here is built from the lecture's    */
/* real structured notes (processedNotes markdown). No fake endpoints. */
/* ------------------------------------------------------------------ */

const HEADING_RE = /^(#{1,4})\s+(.+)$/;
const BOLD_DEF_RE = /^(?:[-*•]\s*)?\*\*([^*]+)\*\*\s*[—:–]\s*(.+)$/;

const parseRevision = (markdown = '') => {
  const lines = String(markdown || '').split('\n');
  let summary = '';
  let keyPoints = '';
  let inSummary = false;
  let inKeyPoints = false;
  const blocks = [];
  let current = null;

  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;

    const h = s.match(HEADING_RE);
    if (h) {
      const title = h[2].replace(/[*_`]/g, '').trim();
      const lower = title.toLowerCase();
      if (/summary/i.test(lower)) {
        flush();
        inSummary = true;
        inKeyPoints = false;
        continue;
      }
      if (/key points|exam|question/i.test(lower)) {
        flush();
        inKeyPoints = true;
        inSummary = false;
        continue;
      }
      inSummary = false;
      inKeyPoints = false;
      flush();
      current = { title, bullets: [], intro: '' };
      continue;
    }

    if (inSummary) {
      summary += (summary ? '\n' : '') + s;
      continue;
    }
    if (inKeyPoints) {
      keyPoints += (keyPoints ? '\n' : '') + s;
      continue;
    }
    if (current) {
      if (/^[-*•]/.test(s)) {
        current.bullets.push(s.replace(/^[-*•]\s*/, '').replace(/[*_`]/g, '').trim());
      } else if (!current.intro) {
        current.intro = s;
      }
    }
  }
  flush();

  const definitions = lines
    .map((l) => l.trim().match(BOLD_DEF_RE))
    .filter(Boolean)
    .map((m) => ({ term: m[1].trim(), def: m[2].trim() }));

  const concepts = blocks.map((b) => b.title);
  const questions = concepts.map((c) => `What is ${c}?`);

  return {
    summary: summary.trim(),
    keyPoints: keyPoints.trim(),
    blocks,
    concepts,
    definitions,
    questions,
  };
};

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const SectionEmpty = ({ text }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
    <div className="w-11 h-11 rounded-xl bg-(--surface-hover) border border-(--border-subtle) flex items-center justify-center mb-3">
      <Sparkles size={18} className="text-(--text-faint)" strokeWidth={1.75} />
    </div>
    <p className="text-[13px] text-(--text-dim) max-w-sm leading-relaxed">{text}</p>
  </div>
);

/* ------------------------------------------------------------------ */
/* Quick Revision (overview) — visual study-board style                */
/* ------------------------------------------------------------------ */

const SECTION_COLORS = [
  { bg: 'bg-teal-500/8', border: 'border-teal-600 dark:border-teal-500', badge: 'bg-teal-500/15 text-teal-700 dark:text-teal-400', headerBg: 'bg-teal-600 dark:bg-teal-700', dot: 'bg-teal-500' },
  { bg: 'bg-sky-500/8', border: 'border-sky-600 dark:border-sky-500', badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-400', headerBg: 'bg-sky-600 dark:bg-sky-700', dot: 'bg-sky-500' },
  { bg: 'bg-emerald-500/8', border: 'border-emerald-600 dark:border-emerald-500', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', headerBg: 'bg-emerald-600 dark:bg-emerald-700', dot: 'bg-emerald-500' },
];

const ICON_POOL = [FcComboChart, FcWorkflow, FcMindMap, FcInspection, FcTimeline, FcBookmark, FcDocument, FcBullish, FcList];

const getIllustrationForTitle = (title, index) => {
  const t = title.toLowerCase();
  if (t.includes('summary') || t.includes('intro') || t.includes('overview')) return FcViewDetails;
  if (t.includes('key point') || t.includes('important') || t.includes('highlight')) return FcFlashOn;
  if (t.includes('concept') || t.includes('what')) return FcIdea;
  if (t.includes('definition') || t.includes('meaning')) return FcReading;
  if (t.includes('question') || t.includes('quiz') || t.includes('faq')) return FcQuestions;
  if (t.includes('how') || t.includes('process') || t.includes('workflow') || t.includes('pipeline')) return FcWorkflow;
  if (t.includes('tool') || t.includes('feature') || t.includes('platform')) return FcInspection;
  if (t.includes('tip') || t.includes('best practice')) return FcBookmark;

  return ICON_POOL[index % ICON_POOL.length];
};

const Overview = ({ parsed }) => {
  const reduced = useReducedMotion();
  const { summary, keyPoints, blocks, concepts, definitions } = parsed;
  const hasAnything = summary || keyPoints || concepts.length || definitions.length || blocks.length;

  if (!hasAnything) {
    return <SectionEmpty text="No revision content yet. Structure this lecture with AI to generate key points, concepts and definitions." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-8 py-6 flex flex-col gap-5">

      {/* Key points — prominent card with warm tint */}
      {keyPoints && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border-2 border-amber-400/40 bg-amber-500/5 p-5 sm:p-6 relative overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 opacity-[0.06] pointer-events-none">
            <FcFlashOn size={140} />
          </div>
          <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-(--text) tracking-tight mb-4 relative z-10">
            <span className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><FcFlashOn size={20} /></span>
            Key Points
          </h3>
          <div className="markdown-body !text-[13.5px] !leading-[1.7] relative z-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{keyPoints}</ReactMarkdown>
          </div>
        </motion.div>
      )}

      {/* Summary card */}
      {summary && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04 }}
          className="rounded-2xl border border-(--border-subtle) bg-(--surface) p-5 sm:p-6 relative overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 opacity-[0.04] pointer-events-none">
            <FcViewDetails size={140} />
          </div>
          <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-(--text) tracking-tight mb-3 relative z-10">
            <span className="w-8 h-8 rounded-lg bg-(--surface-hover) flex items-center justify-center"><FcViewDetails size={20} /></span>
            Quick Summary
          </h3>
          <div className="markdown-body !text-[13.5px] !leading-[1.7] relative z-10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </motion.div>
      )}

      {/* Section blocks — 2-column poster-style cards */}
      {blocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {blocks.map((block, i) => {
            const color = SECTION_COLORS[i % SECTION_COLORS.length];
            const Illus = getIllustrationForTitle(block.title, i);
            return (
              <motion.div
                key={block.title + i}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 * i }}
                className={`rounded-2xl border border-(--border-subtle) overflow-hidden`}
              >
                {/* Colored header bar */}
                <div className={`${color.headerBg} px-4 py-3 flex items-center justify-between`}>
                  <h4 className="text-[14.5px] font-bold text-white tracking-tight leading-snug">
                    {block.title}
                  </h4>
                  <Illus size={28} className="shrink-0 drop-shadow-md" />
                </div>
                {/* Card body */}
                <div className={`${color.bg} p-4`}>
                  {block.intro && (
                    <p className="text-[13px] text-(--text) leading-relaxed mb-3 bg-(--bg) p-2.5 rounded-lg border border-(--border-subtle) italic">{block.intro}</p>
                  )}
                  {block.bullets.length > 0 && (
                    <ul className="space-y-2">
                      {block.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-[13px] text-(--text-dim) leading-relaxed">
                          <span className={`w-5 h-5 rounded-md ${color.badge} flex items-center justify-center shrink-0 mt-[1px]`}>
                            <ChevronRight size={11} strokeWidth={3} />
                          </span>
                          <span className="min-w-0">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Concepts chips */}
      {concepts.length > 0 && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-(--border-subtle) bg-(--surface) p-5 sm:p-6"
        >
          <h3 className="flex items-center gap-2.5 text-[16px] font-bold text-(--text) tracking-tight mb-4">
            <span className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center"><FcIdea size={20} /></span>
            Core Concepts
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {concepts.map((c, i) => {
              const color = SECTION_COLORS[i % SECTION_COLORS.length];
              return (
                <span
                  key={c}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold ${color.badge} border border-(--border-subtle)`}
                >
                  {c}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Definitions — card grid */}
      {definitions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {definitions.map((d, i) => {
            const color = SECTION_COLORS[i % SECTION_COLORS.length];
            return (
              <motion.div
                key={d.term}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.04 * i }}
                className={`rounded-2xl border border-(--border-subtle) overflow-hidden`}
              >
                <div className={`${color.headerBg} px-4 py-2.5 flex items-center gap-2`}>
                  <FcReading size={18} />
                  <span className="text-[13.5px] font-bold text-white">{d.term}</span>
                </div>
                <div className={`${color.bg} p-4`}>
                  <p className="text-[13px] text-(--text-dim) leading-relaxed">{d.def}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Flashcards — flip cards built from headings + definitions           */
/* ------------------------------------------------------------------ */

const Flashcards = ({ parsed, reduced }) => {
  const cards = useMemo(() => {
    const fromBlocks = parsed.blocks
      .filter((b) => b.title && (b.intro || b.bullets.length))
      .map((b) => ({
        type: 'concept',
        front: b.title,
        back: [
          b.intro || '',
          ...b.bullets.map((x) => `- ${x}`),
        ].filter(Boolean).join('\n'),
      }));

    const fromDefs = parsed.definitions.map((d) => ({
      type: 'definition',
      front: d.term,
      back: d.def,
    }));

    const blockTitles = new Set(fromBlocks.map((c) => c.front.toLowerCase()));
    const uniqueDefs = fromDefs.filter((d) => !blockTitles.has(d.front.toLowerCase()));

    return [...fromBlocks, ...uniqueDefs];
  }, [parsed.blocks, parsed.definitions]);

  const [revealed, setRevealed] = useState(() => new Set());

  if (cards.length === 0) {
    return <SectionEmpty text="No flashcards yet. Structure this lecture with AI — flashcards are built from your headings and key points." />;
  }

  const toggle = (i) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <p className="text-[12.5px] text-(--text-faint)">
          {cards.length} {cards.length === 1 ? 'card' : 'cards'} · click a card to reveal the answer
        </p>
        <button
          type="button"
          onClick={() => setRevealed(new Set())}
          className="btn-ghost px-2 py-1.5 text-[12px]"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {cards.map((card, i) => {
          const isRevealed = revealed.has(i);
          return (
            <motion.div
              key={card.front + i}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.03 * i }}
              className={`rounded-xl border ${isRevealed ? 'border-(--accent-text)/30' : 'border-(--border-subtle)'} overflow-hidden cursor-pointer transition-colors`}
              onClick={() => toggle(i)}
            >
              {/* Question row */}
              <div className={`flex items-center gap-3 px-5 py-3.5 ${isRevealed ? 'bg-(--surface)' : 'bg-(--surface) hover:bg-(--surface-hover)'} transition-colors`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${card.type === 'definition' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400' : 'bg-teal-500/15 text-teal-600 dark:text-teal-400'}`}>
                  {card.type === 'definition' ? 'Def' : 'Q'}
                </span>
                <p className="text-[14px] font-semibold text-(--text) leading-snug flex-1 min-w-0">
                  {card.front}
                </p>
                <ChevronRight size={14} className={`text-(--text-faint) shrink-0 transition-transform duration-200 ${isRevealed ? 'rotate-90' : ''}`} />
              </div>

              {/* Answer — slides open */}
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-(--border-subtle) bg-teal-500/[0.03] px-5 py-3"
                >
                  <div className="markdown-body !text-[13.5px] !leading-[1.75]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.back}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Quiz — multiple-choice self-test built from real concepts           */
/* ------------------------------------------------------------------ */

const buildQuiz = (concepts) => {
  return concepts
    .slice(0, 8)
    .map((c) => {
      const distractors = concepts.filter((x) => x !== c).slice(0, 3);
      if (!distractors.length) return null;
      return { q: `What is ${c}?`, answer: c, options: shuffle([c, ...distractors]) };
    })
    .filter(Boolean);
};

const Quiz = ({ parsed, reduced }) => {
  const questions = useMemo(() => buildQuiz(parsed.concepts), [parsed.concepts]);
  const [answers, setAnswers] = useState({});

  if (questions.length === 0) {
    return <SectionEmpty text="Not enough concepts to build a quiz yet. Structure this lecture with AI first." />;
  }

  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.answer ? 1 : 0), 0);
  const allAnswered = answeredCount === questions.length;

  const pick = (qi, option) => {
    setAnswers((prev) => ({ ...prev, [qi]: option }));
  };

  const restart = () => setAnswers({});

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-[12px] text-(--text-faint)">
          {questions.length} questions · built from your concepts
        </p>
        {allAnswered && (
          <button type="button" onClick={restart} className="btn-ghost px-2 py-1.5 text-[12px]">
            <RefreshCw size={13} /> Restart
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {questions.map((q, qi) => {
          const chosen = answers[qi];
          return (
            <motion.div
              key={qi}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: qi * 0.04 }}
              className="rounded-2xl border border-(--border-subtle) bg-(--surface) p-5"
            >
              <p className="text-[14px] font-semibold text-(--text)">
                {qi + 1}. {q.q}
              </p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt) => {
                  const isChosen = chosen === opt;
                  const isCorrect = opt === q.answer;
                  let cls = 'border-(--border-subtle) bg-(--surface-hover) hover:border-(--accent-ring)';
                  if (chosen) {
                    if (isCorrect) cls = 'border-(--success) bg-(--success-soft) text-(--success)';
                    else if (isChosen) cls = 'border-(--danger) bg-(--danger-soft) text-(--danger)';
                    else cls = 'border-(--border-subtle) opacity-50';
                  }
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => pick(qi, opt)}
                      disabled={!!chosen}
                      className={`text-left rounded-xl border px-3.5 py-2.5 text-[12.5px] text-(--text) transition-colors disabled:cursor-default ${cls}`}
                    >
                      <span className="flex items-center gap-2">
                        {chosen && isCorrect && <Check size={13} className="shrink-0" />}
                        {chosen && isChosen && !isCorrect && <X size={13} className="shrink-0" />}
                        <span className="min-w-0">{opt}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {allAnswered && (
        <div className="mt-5 rounded-2xl border border-(--border-strong) bg-(--surface) p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[14px] font-semibold text-(--text)">Quiz complete</p>
            <p className="text-[12.5px] text-(--text-dim) mt-0.5">
              You got {score} of {questions.length} correct.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[22px] font-mono font-semibold text-(--accent-text)">
              {Math.round((score / questions.length) * 100)}%
            </span>
            <button type="button" onClick={restart} className="btn-secondary px-3 py-1.5 text-[12px]">
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Revision workspace                                                  */
/* ------------------------------------------------------------------ */

const RevisionMode = ({ content, onAskAI }) => {
  const reduced = useReducedMotion();
  const [view, setView] = useState('overview');
  const parsed = useMemo(() => parseRevision(content), [content]);

  if (!content?.trim()) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="w-12 h-12 rounded-xl bg-(--surface-hover) border border-(--border-subtle) flex items-center justify-center mb-4">
          <Zap size={20} className="text-(--text-faint)" strokeWidth={1.75} />
        </div>
        <h3 className="text-[15px] font-semibold text-(--text) mb-1.5">No revision data</h3>
        <p className="text-[13px] text-(--text-dim) max-w-sm leading-relaxed">
          Process your notes with AI first — revision mode shows key points, concepts, flashcards and
          self-tests built from your structured notes.
        </p>
        {onAskAI && (
          <button type="button" onClick={onAskAI} className="btn-primary mt-5 flex items-center gap-1.5">
            <MessageCircle size={14} /> Ask AI about these notes
          </button>
        )}
      </div>
    );
  }

  const actions = [
    { id: 'overview', label: 'Quick Revision', icon: Layers },
    { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
    { id: 'quiz', label: 'Practice', icon: Target },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 sm:px-8 py-2.5 border-b border-(--border-subtle) shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Zap size={14} className="text-(--accent-text) shrink-0" />
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-(--text) leading-tight">Revision workspace</p>
            <p className="text-[11px] text-(--text-dim) mt-0.5 hidden sm:block">
              Key points, flashcards & self-tests built from your notes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
          {actions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`pill-tab shrink-0 ${view === id ? 'active' : ''}`}
            >
              <Icon size={13} />
              <span className="hidden md:inline text-[11px] font-medium tracking-wider">{label}</span>
            </button>
          ))}
          {onAskAI && (
            <button type="button" onClick={onAskAI} className="btn-primary px-3 py-1.5 text-[12px] ml-1.5 shrink-0">
              <MessageCircle size={13} /> Ask AI
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {view === 'overview' && <Overview parsed={parsed} />}
        {view === 'flashcards' && <Flashcards parsed={parsed} reduced={reduced} />}
        {view === 'quiz' && <Quiz parsed={parsed} reduced={reduced} />}
      </div>
    </div>
  );
};

export default RevisionMode;
