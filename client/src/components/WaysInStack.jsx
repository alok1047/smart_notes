import { Fragment, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Clapperboard,
  FileText,
  PenLine,
  Play,
  Sparkles,
  Type,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/* ------------------------------------------------------------------ */
/* Card stack config                                                   */
/* ------------------------------------------------------------------ */

/* rank 0 = front card, 3 = furthest back */
const STACK_PRESETS = {
  desktop: [
    { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, z: 10 },
    { x: 50, y: 16, scale: 0.99, rotate: 4, opacity: 1, z: 9 },
    { x: 100, y: 34, scale: 0.98, rotate: 8, opacity: 1, z: 8 },
    { x: 150, y: 54, scale: 0.97, rotate: 12, opacity: 1, z: 7 },
  ],
  tablet: [
    { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, z: 10 },
    { x: 34, y: 14, scale: 0.99, rotate: 3, opacity: 1, z: 9 },
    { x: 68, y: 30, scale: 0.98, rotate: 6, opacity: 1, z: 8 },
    { x: 102, y: 46, scale: 0.97, rotate: 9, opacity: 1, z: 7 },
  ],
  mobile: [
    { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1, z: 10 },
    { x: 16, y: 10, scale: 0.98, rotate: 2, opacity: 0.9, z: 9 },
    { x: 28, y: 18, scale: 0.96, rotate: 4, opacity: 0, z: 8 },
    { x: 36, y: 24, scale: 0.94, rotate: 6, opacity: 0, z: 7 },
  ],
};

/* previous front card flies out to the left before rejoining the deck */
const EXIT_PRESET = { x: '-120%', y: '6%', scale: 1, rotate: -8, opacity: 1, z: 11 };

/* One shared size for every card — cards cannot diverge. */
const CARD_SIZE = {
  desktop: { w: 920, h: 520 },
  tablet: { w: '86%', h: 480 },
  mobile: { w: '92%', h: 820 },
};

/* ------------------------------------------------------------------ */
/* Card data (data-driven, single render path)                         */
/* ------------------------------------------------------------------ */

const CARDS = [
  {
    id: 'pdf',
    tab: 'PDF',
    accentText: 'text-[#9FA6DE]',
    accentHex: '#9FA6DE',
    accentBg: 'bg-(--pastel-lavender)',
    cardBgVar: '--ws-card-pdf',
    deepVar: '--ws-deep-pdf',
    glow: 'rgba(159,166,222,0.14)',
    edge: 'rgba(159,166,222,0.4)',
    eyebrow: 'PDF → STRUCTURED NOTES',
    title: 'Turn lecture PDFs into organized knowledge.',
    description:
      'Upload slides, lecture PDFs, or documents and NotesSync extracts the important concepts, structures them, and makes them searchable.',
    source: 'pdf',
    steps: ['Extracting text + structure', 'AI processing'],
    outputLabel: 'AI STRUCTURED NOTES',
    output: {
      title: 'Database Normalization',
      items: ['1NF — atomic values', '2NF — no partial dependency', '3NF — no transitive dependency'],
    },
  },
  {
    id: 'youtube',
    tab: 'YouTube',
    accentText: 'text-[#E07A86]',
    accentHex: '#E07A86',
    accentBg: 'bg-(--pastel-peach)',
    cardBgVar: '--ws-card-youtube',
    deepVar: '--ws-deep-youtube',
    glow: 'rgba(224,122,134,0.14)',
    edge: 'rgba(224,122,134,0.4)',
    eyebrow: 'YOUTUBE → STRUCTURED NOTES',
    title: 'Turn entire lectures into notes.',
    description:
      'Paste a YouTube lecture and NotesSync extracts the transcript, identifies important concepts, and converts the lecture into structured notes.',
    source: 'youtube',
    steps: ['Transcript extracted', 'AI processing'],
    outputLabel: 'AI STRUCTURED NOTES',
    output: {
      title: 'Indexing strategies',
      items: ['B-tree indexes explained', 'Hash vs B-tree trade-offs', 'Composite keys'],
    },
  },
  {
    id: 'notion',
    tab: 'Notion',
    accentText: 'text-[#A98ED8]',
    accentHex: '#A98ED8',
    accentBg: 'bg-(--pastel-lavender)',
    cardBgVar: '--ws-card-notion',
    deepVar: '--ws-deep-notion',
    glow: 'rgba(169,142,216,0.16)',
    edge: 'rgba(169,142,216,0.45)',
    eyebrow: 'NOTION → STRUCTURED NOTES',
    title: 'Give your documents a brain.',
    description:
      'Import Notion pages or documents and turn scattered information into connected, searchable knowledge.',
    source: 'notion',
    steps: ['Reading structure', 'AI organizing'],
    outputLabel: 'AI STRUCTURED NOTES',
    output: {
      title: 'ACID properties',
      items: ['Atomicity — all or nothing', 'Consistency — valid states only', 'Isolation — concurrent safety'],
    },
  },
  {
    id: 'text',
    tab: 'Paste Text',
    accentText: 'text-[#7FC7A8]',
    accentHex: '#7FC7A8',
    accentBg: 'bg-(--pastel-mint)',
    cardBgVar: '--ws-card-text',
    deepVar: '--ws-deep-text',
    glow: 'rgba(127,199,168,0.14)',
    edge: 'rgba(127,199,168,0.4)',
    eyebrow: 'TEXT → STRUCTURED NOTES',
    title: 'Paste anything. Get structure.',
    description:
      'Drop messy notes, copied lectures, screenshots converted to text, or raw thoughts and let NotesSync organize them.',
    source: 'text',
    steps: ['AI organizing', 'Concept extraction'],
    outputLabel: 'STRUCTURED NOTES',
    output: {
      title: 'Third Normal Form (3NF)',
      items: ['Definition in plain words', '1NF → 2NF → 3NF progression', 'Key example: transitive dependency'],
    },
  },
];

const CARD_ORDER = CARDS.map((c) => c.id);

/* ------------------------------------------------------------------ */
/* Transformation flow building blocks                                 */
/* ------------------------------------------------------------------ */

const ArrowDown = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

const ProcessChip = ({ children, deepVar, accentHex, prefersReduced }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-(--ws-line) bg-(--ws-chip-bg) px-3.5 py-1.5 shadow-sm">
    <motion.span
      aria-hidden
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ background: accentHex }}
      animate={prefersReduced ? undefined : { scale: [1, 1.7, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <Sparkles size={11} style={{ color: `var(${deepVar})` }} />
    <span className="text-[11px] font-semibold" style={{ color: `var(${deepVar})` }}>{children}</span>
  </div>
);

const OutputCard = ({ label, title, items, deepVar, accentHex }) => (
  <div className="w-full rounded-xl border border-(--ws-line) bg-(--ws-chip-bg) shadow-lg overflow-hidden">
    <div className="px-3.5 py-2 border-b border-(--ws-line-subtle) bg-(--ws-mock-bar) flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: `var(${deepVar})` }}>{label}</span>
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-(--ws-chip-ready-bg) text-(--ws-ink) text-[9px] font-semibold">
        <Sparkles size={9} style={{ color: `var(${deepVar})` }} /> Ready
      </span>
    </div>
    <div className="p-3.5">
      <p className="font-display text-[14.5px] font-semibold tracking-tight text-(--ws-ink) mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2 text-[12px] text-(--ws-dim)">
            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: accentHex }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

/* Source nodes — one per input type, rendered through a single switch */
const PdfSource = () => (
  <div className="flex items-center gap-3 rounded-xl border border-(--ws-line) bg-(--ws-chip-bg) px-3 py-2.5 shadow-sm">
    <span className="w-9 h-9 rounded-lg bg-(--pastel-lavender) flex items-center justify-center shrink-0" style={{ color: 'var(--ws-deep-pdf)' }}>
      <FileText size={15} />
    </span>
    <div className="min-w-0">
      <p className="text-[12px] font-semibold text-(--ws-ink) truncate">Lecture PDF / Slides</p>
      <p className="text-[10px] text-(--ws-faint) truncate">lecture_04.pdf · 24 slides</p>
    </div>
  </div>
);

const YoutubeSource = ({ prefersReduced }) => (
  <div className="flex items-center gap-3 rounded-xl border border-(--ws-line) bg-(--ws-chip-bg) p-2.5 shadow-sm">
    <div
      className="relative w-[74px] aspect-video rounded-md overflow-hidden shrink-0"
      style={{ background: 'linear-gradient(135deg, #3A2A24 0%, #2A1E1A 55%, #17160F 100%)' }}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center"
        animate={prefersReduced ? undefined : { scale: [1, 1.12, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
          <Play size={9} className="text-white ml-0.5" fill="currentColor" />
        </span>
      </motion.span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[12px] font-semibold text-(--ws-ink) flex items-center gap-1.5 truncate">
        <Clapperboard size={12} className="shrink-0" style={{ color: 'var(--ws-deep-youtube)' }} /> YouTube Lecture
      </p>
      <p className="text-[10px] text-(--ws-faint) truncate">DBMS · Lecture 07 — Indexing</p>
    </div>
  </div>
);

const NotionSource = () => (
  <div className="rounded-xl border border-(--ws-line) bg-(--ws-chip-bg) px-3 py-2.5 shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <span className="w-3.5 h-3.5 rounded bg-[#5D4A6E] shrink-0" />
      <p className="text-[12px] font-semibold text-(--ws-ink) truncate">Notion Document</p>
      <Type size={10} className="ml-auto text-(--ws-faint) shrink-0" />
    </div>
    <div className="space-y-1.5">
      <div className="h-1.5 rounded" style={{ width: '100%', background: 'var(--ws-ink)', opacity: 0.25 }} />
      <div className="h-1.5 rounded" style={{ width: '86%', background: 'var(--ws-ink)', opacity: 0.18 }} />
      <div className="h-1.5 rounded" style={{ width: '92%', background: 'var(--ws-ink)', opacity: 0.2 }} />
    </div>
  </div>
);

const TextSource = () => (
  <div className="rounded-xl border border-(--ws-line) bg-(--ws-chip-bg) px-3 py-2.5 shadow-sm">
    <div className="flex items-center gap-2 mb-1.5">
      <PenLine size={10} className="text-(--ws-faint) shrink-0" />
      <p className="text-[10px] font-semibold text-(--ws-dim) truncate">pasted_notes.txt</p>
    </div>
    <div className="space-y-1">
      <div className="h-1 rounded" style={{ width: '90%', background: 'var(--ws-ink)', opacity: 0.3 }} />
      <div className="h-1 rounded" style={{ width: '70%', background: 'var(--ws-ink)', opacity: 0.22 }} />
      <div className="h-1 rounded" style={{ width: '82%', background: 'var(--ws-ink)', opacity: 0.26 }} />
    </div>
    <p className="mt-2 text-[9.5px] text-(--ws-faint) italic truncate">"aaj 3nf padha, transitive dep hatao…"</p>
  </div>
);

const SourceNode = ({ type, prefersReduced }) => {
  if (type === 'youtube') return <YoutubeSource prefersReduced={prefersReduced} />;
  if (type === 'notion') return <NotionSource />;
  if (type === 'text') return <TextSource />;
  return <PdfSource />;
};

const TransformationFlow = ({ card, prefersReduced }) => (
  <div className="w-full flex flex-col items-center gap-2 sm:gap-2.5">
    <div className="w-full max-w-[320px]">
      <SourceNode type={card.source} prefersReduced={prefersReduced} />
    </div>
    <ArrowDown className="w-3.5 h-3.5 text-(--ws-faint)" />
    {card.steps.map((label) => (
      <Fragment key={label}>
        <ProcessChip deepVar={card.deepVar} accentHex={card.accentHex} prefersReduced={prefersReduced}>
          {label}
        </ProcessChip>
        <ArrowDown className="w-3.5 h-3.5 text-(--ws-faint)" />
      </Fragment>
    ))}
    <div className="w-full max-w-[320px]">
      <OutputCard
        label={card.outputLabel}
        title={card.output.title}
        items={card.output.items}
        deepVar={card.deepVar}
        accentHex={card.accentHex}
      />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const WaysInStack = () => {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();
  const [active, setActive] = useState('pdf');
  const [exiting, setExiting] = useState(null);
  const [settling, setSettling] = useState(null);
  const [autoPaused, setAutoPaused] = useState(false);
  const timerRef = useRef(null);
  const exitTimerRef = useRef(null);
  const settleTimerRef = useRef(null);
  const activeRef = useRef(active);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isMobile = !isDesktop && !isTablet;

  const activeIndex = CARD_ORDER.indexOf(active);
  const cardSize = isMobile ? CARD_SIZE.mobile : isTablet ? CARD_SIZE.tablet : CARD_SIZE.desktop;
  const stackPresets = isMobile ? STACK_PRESETS.mobile : isTablet ? STACK_PRESETS.tablet : STACK_PRESETS.desktop;

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const goTo = (id) => {
    if (id === activeRef.current) return;
    const exited = activeRef.current;
    clearTimeout(exitTimerRef.current);
    clearTimeout(settleTimerRef.current);
    setSettling(null);
    setExiting(exited);
    setActive(id);
    exitTimerRef.current = setTimeout(() => {
      setExiting(null);
      setSettling(exited);
      settleTimerRef.current = setTimeout(() => setSettling(null), 80);
    }, 650);
  };

  const select = (id) => {
    if (id === activeRef.current) return;
    setAutoPaused(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAutoPaused(false), 9000);
    goTo(id);
  };

  useEffect(() => {
    if (prefersReduced || autoPaused) return undefined;
    const t = setInterval(() => {
      goTo(CARD_ORDER[(CARD_ORDER.indexOf(activeRef.current) + 1) % CARD_ORDER.length]);
    }, 6000);
    return () => clearInterval(t);
  }, [prefersReduced, autoPaused]);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
      clearTimeout(exitTimerRef.current);
      clearTimeout(settleTimerRef.current);
    },
    [],
  );

  /* ring rotation: selected card → front, previous front exits left then rejoins at the back */
  const fanOrder = [...CARD_ORDER.slice(activeIndex + 1), ...CARD_ORDER.slice(0, activeIndex)].filter(
    (id) => id !== exiting,
  );
  const rankOf = (id) => (id === active ? 0 : id === exiting ? -1 : fanOrder.indexOf(id) + 1);

  return (
    <section id="ways" className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-16 md:py-24">
      {/* Intro */}
      <motion.div
        className="max-w-[620px] mx-auto text-center"
        initial={prefersReduced ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <p className="text-[12px] font-bold text-(--accent-text) uppercase tracking-[0.16em] mb-2.5">
          One workspace. Any input.
        </p>
        <h2 className="font-display text-[30px] sm:text-[40px] lg:text-[44px] leading-[1.08] tracking-tight text-(--text)">
          However your notes start,<br className="hidden sm:block" /> NotesSync makes them <em className="text-(--accent-text)">useful.</em>
        </h2>
        <p className="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-(--text-dim)">
          PDFs, videos, documents, or messy thoughts — bring them in and turn them
          into searchable knowledge.
        </p>
      </motion.div>

      {/* Navigation pills */}
      <motion.div
        className="mt-10 flex justify-center"
        initial={prefersReduced ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
      >
        <div
          role="tablist"
          aria-label="Input types"
          className="inline-flex items-center gap-1 p-1 rounded-2xl border border-(--border-subtle) bg-(--surface) shadow-sm overflow-x-auto max-w-full"
        >
          {CARDS.map((c) => {
            const isActive = c.id === active;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => select(c.id)}
                className="relative shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer"
              >
                {isActive && (
                  <motion.span
                    layoutId="ways-pill"
                    className={`absolute inset-0 rounded-xl ${c.accentBg} border border-(--border-subtle)`}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? 'text-(--text)' : 'text-(--text-dim)'}`}>{c.tab}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Card stack */}
      <motion.div
        className="relative mt-10"
        initial={prefersReduced ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
      >
        <div
          className="relative isolate mx-auto"
          style={{ width: cardSize.w, height: cardSize.h, maxWidth: '100%' }}
        >
          {CARDS.map((card) => {
            const rank = rankOf(card.id);
            const isExiting = rank === -1;
            const isSettling = !isExiting && card.id === settling;
            const base = isExiting ? EXIT_PRESET : stackPresets[Math.min(rank, stackPresets.length - 1)];
            const s = isSettling ? { ...base, opacity: 0 } : base;
            const isFront = rank === 0;
            return (
              <motion.article
                key={card.id}
                role="tabpanel"
                aria-hidden={!isFront}
                onClick={() => select(card.id)}
                className={`absolute inset-0 rounded-[28px] sm:rounded-[32px] border border-(--ws-line-subtle) overflow-hidden ${
                  isFront ? 'shadow-[0_30px_70px_rgba(0,0,0,0.28)]' : 'shadow-[0_16px_40px_rgba(0,0,0,0.18)] cursor-pointer'
                }`}
                initial={false}
                animate={{
                  x: s.x,
                  y: s.y,
                  scale: s.scale,
                  rotate: s.rotate,
                  opacity: s.opacity,
                  zIndex: s.z,
                }}
                transition={
                  prefersReduced
                    ? { duration: 0 }
                    : isExiting
                      ? { duration: 0.6, ease: [0.45, 0, 0.75, 0.4] }
                      : isSettling
                        ? { duration: 0 }
                        : {
                            type: 'spring',
                            stiffness: 220,
                            damping: 27,
                            mass: 1,
                            delay: Math.max(rank, 0) * 0.02,
                            opacity: { duration: 0.6, ease: 'easeOut' },
                          }
                }
                style={{ transformOrigin: 'center', background: `var(${card.cardBgVar})` }}
              >
                <div className="flex flex-col sm:grid sm:grid-cols-2 h-full">
                  {/* LEFT — description */}
                  <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-9 flex-1 min-h-0">
                    <p className="font-display italic text-[15px] text-(--ws-ink)">
                      {card.tab}
                    </p>
                    <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: `var(${card.deepVar})` }}>
                      {card.eyebrow}
                    </p>
                    <h3 className="mt-3 font-display text-[26px] sm:text-[28px] lg:text-[31px] leading-[1.12] tracking-tight text-(--ws-ink)">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-[13.5px] sm:text-[14px] lg:text-[15px] leading-relaxed text-(--ws-dim) max-w-[400px]">
                      {card.description}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="h-11 px-6 rounded-full bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) text-[13.5px] font-semibold flex items-center gap-2 transition-colors shadow-sm"
                      >
                        Try it
                        <ArrowRight size={14} />
                      </button>
                      <a
                        href="#ask"
                        className="h-11 px-5 rounded-full border border-(--ws-line) text-(--ws-ink) text-[13.5px] font-semibold flex items-center gap-2 hover:bg-(--surface-hover) transition-colors"
                      >
                        Learn more
                      </a>
                    </div>
                    </div>

                  {/* RIGHT — transformation panel */}
                  <div className="flex-1 min-h-0 p-4 sm:p-5 border-t sm:border-t-0 sm:border-l border-(--ws-line-subtle)">
                    <div className="relative h-full rounded-2xl border border-(--ws-line) bg-(--ws-mock-bg) overflow-hidden shadow-[0_18px_45px_rgba(0,0,0,0.18)] flex flex-col">
                      <div className="relative flex items-center px-4 h-9 border-b border-(--ws-line-subtle) bg-(--ws-mock-bar) shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#EE6A5F]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F5BE4F]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#61C455]" />
                        </div>
                        <p className="absolute inset-x-0 text-center text-[11px] font-semibold text-(--ws-faint) pointer-events-none">
                          NotesSync
                        </p>
                      </div>
                      <div className="relative flex-1 min-h-0 p-4 sm:p-6 lg:p-7 flex items-center justify-center overflow-hidden">
                        <TransformationFlow card={card} prefersReduced={prefersReduced} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </motion.div>

      {/* bottom caption */}
      <motion.p
        className="mt-16 text-center text-[12px] text-(--text-faint)"
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        One input system — any material in, structured knowledge out.
      </motion.p>
    </section>
  );
};

export default WaysInStack;
