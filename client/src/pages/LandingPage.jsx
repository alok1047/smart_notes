import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { AppLoader } from '../components/NotesLoader';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  CloudUpload,
  FileText,
  FileUp,
  LayoutTemplate,
  MessageSquareText,
  Moon,
  Search,
  Sparkles,
  Sun,
  Wand2,
  Zap,
  History,
  Braces,
  Tags,
  ArrowDown,
  Quote,
} from 'lucide-react';
import WaysInStack from '../components/WaysInStack';
import TryFreeSection from '../components/TryFreeSection';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const EASE = [0.22, 1, 0.36, 1];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE },
};

const Reveal = ({ children, delay = 0, className = '' }) => {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

const SectionLabel = ({ children }) => (
  <p className="text-[12px] font-bold text-(--accent-text) uppercase tracking-[0.16em] mb-2.5">
    {children}
  </p>
);

const SectionTitle = ({ children }) => (
  <h2 className="font-display text-[30px] sm:text-[40px] lg:text-[46px] leading-[1.08] tracking-tight text-(--text)">
    {children}
  </h2>
);

const SectionBody = ({ children }) => (
  <p className="mt-3.5 text-[15px] sm:text-[16px] leading-relaxed text-(--text-dim) max-w-[540px]">
    {children}
  </p>
);

/* ---------------- Illustration primitives (original line-art) ---------------- */

const Scribble = ({ className = '', children, ...rest }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} {...rest}>
    {children}
  </svg>
);

const PDFIcon = ({ className = '' }) => (
  <Scribble className={className} style={{ backgroundColor: 'transparent' }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h4" />
  </Scribble>
);

const NotebookIcon = ({ className = '' }) => (
  <Scribble className={className}>
    <path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Scribble>
);

const SearchIcon = ({ className = '' }) => (
  <Scribble className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Scribble>
);

const SparkIcon = ({ className = '' }) => (
  <Scribble className={className}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
  </Scribble>
);

const Logo = ({ compact = false }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="flex items-center gap-2 text-left group"
      aria-label="Go to NotesSync home"
    >
      <span className={`${compact ? 'w-7 h-7 rounded-[8px]' : 'w-8 h-8 rounded-[10px]'} bg-(--accent) flex items-center justify-center text-(--accent-fg) shadow-sm group-hover:-translate-y-0.5 transition-transform`}>
        <BookOpen size={compact ? 15 : 17} />
      </span>
      <span className={`font-display ${compact ? 'text-[16px]' : 'text-[18px]'} font-semibold text-(--text) tracking-tight`}>NotesSync</span>
    </button>
  );
};

const LandingPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const prefersReduced = useReducedMotion();
  const pageRef = useRef(null);
  const { scrollY } = useScroll({ container: pageRef });
  const heroFloat = useTransform(scrollY, [0, 600], [0, -40]);

  // Scroll progress (0 = top, 1 = collapsed) with hysteresis + spring smoothing.
  // Written imperatively to a MotionValue (no React re-renders per pixel).
  const scrollTop = useMotionValue(0);
  const rawProgress = useTransform(scrollTop, [20, 140], [0, 1]);
  const shrink = useSpring(rawProgress, {
    stiffness: prefersReduced ? 999 : 220,
    damping: prefersReduced ? 999 : 30,
    mass: prefersReduced ? 1 : 0.6,
  });

  // Morphing style values — single navbar transforms, no separate states.
  // At scrollY=0 the navbar is transparent/flat (no pill); it morphs into a
  // floating rounded pill with a top margin once the user scrolls.
  const navMaxWidth = useTransform(shrink, (v) => `min(100%, ${1180 - v * 460}px)`);
  const navHeight = useTransform(shrink, (v) => `${72 - v * 16}px`);
  const navMarginTop = useTransform(shrink, (v) => `${v * 7}px`);
  const navRadius = useTransform(shrink, (v) => `${v * 999}px`);
  const navPadX = useTransform(shrink, (v) => `${18 - v * 4}px`);
  const navShadow = useTransform(shrink, (v) =>
    `0 ${v * 14}px ${v * 40}px rgba(0,0,0,${v * 0.16})`
  );
  // Theme-aware background (light vs dark). Alpha scales with scroll so the
  // pill fades in on scroll and is fully transparent at the top.
  const navBg = useTransform(shrink, (v) =>
    theme === 'dark'
      ? `rgba(19,28,36,${v * 0.82})`
      : `rgba(255,255,255,${v * 0.85})`
  );
  const navBorder = useTransform(shrink, (v) =>
    theme === 'dark'
      ? `rgba(26,40,50,${v})`
      : `rgba(235,232,220,${v})`
  );
  const logoScale = useTransform(shrink, (v) => 1 - v * 0.12);
  const btnScale = useTransform(shrink, (v) => 1 - v * 0.1);
  // Navigation spacing — margin-based so the persistent links ("How it works"
  // and "Why NotesSync") hold a larger, consistent gap while the collapsible
  // links collapse fully (margin → 0) once scrolled.
  const persistentMargin = useTransform(shrink, (v) => `${-10 + v * 0}px`);
  const collapsibleMargin = useTransform(shrink, (v) => `${12 - v * 12}px`);
  // Nav links fade/collapse away once scrolled for a cleaner compact bar.
  const linkOpacity = useTransform(shrink, (v) => (v > 0.5 ? 0 : 1 - v * 2));
  const linkWidth = useTransform(shrink, (v) => `${Math.max(0, 400 - v * 400)}px`);

  useEffect(() => {
    if (loading) return undefined;
    const node = pageRef.current;
    if (!node) return undefined;
    const onScroll = () => scrollTop.set(node.scrollTop);
    onScroll();
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, [loading, scrollTop]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => navigate('/login');

  if (loading) {
    return <AppLoader />;
  }

  const navItems = [
    ['How it works', '#how'],
    ['Features', '#features'],
    ['Ask your notes', '#ask'],
    ['Why NotesSync', '#why'],
  ];

  const pipeline = [
    { n: '01', icon: <CloudUpload size={17} />, title: 'Extraction', copy: 'Text pulled from PDFs, videos, and images — locally first, OCR for scanned pages.' },
    { n: '02', icon: <Wand2 size={17} />, title: 'Structuring', copy: 'AI turns fragments into clean markdown with headings, tables, code, and key points.' },
    { n: '03', icon: <NotebookIcon className="w-[17px] h-[17px]" />, title: 'Chunking', copy: 'Notes split into connected chunks, embedded into vectors for semantic search.' },
    { n: '04', icon: <SparkIcon className="w-[17px] h-[17px]" />, title: 'Embedding', copy: 'Every chunk linked across every lecture, ready to search and ask questions about.' },
  ];

  const features = [
    { icon: <Sparkles size={18} />, title: 'Inline AI commands', copy: '//ai make table, //ai simplify, //ai explain — run while you are still thinking.' },
    { icon: <MessageSquareText size={18} />, title: 'Ask your notes', copy: 'RAG chat grounded only in your lectures. Every answer carries source citations.' },
    { icon: <Search size={18} />, title: 'Hybrid search', copy: 'Keyword + semantic merged with RRF ranking. Knows what you meant.' },
    { icon: <FileUp size={18} />, title: 'PDF → structured notes', copy: 'Reliable extraction that preserves headings and paragraphs, with OCR for scans.' },
    { icon: <History size={18} />, title: 'Version history', copy: 'Every save tracked. Diff between versions and roll back a bad rewrite.' },
    { icon: <Tags size={18} />, title: 'Tags & organization', copy: 'Subjects, tags, and lecture numbers keep a semester of chaos tidy.' },
    { icon: <Braces size={18} />, title: 'Markdown + code', copy: 'Real markdown rendering with highlighted code and Mermaid diagrams.' },
    { icon: <CloudUpload size={18} />, title: 'Export & publish', copy: 'Download clean markdown or PDF, or push notes to your GitHub repo.' },
  ];

  const testimonials = [
    { quote: 'I upload slide PDFs and get searchable notes in under a minute. The ask-your-notes chat saved my lab viva.', name: 'Aarav', role: 'CS undergrad, Bengaluru' },
    { quote: 'Semantic search actually finds the concept I half-remember, even when I phrase it badly.', name: 'Sneha', role: 'ECE student, Pune' },
    { quote: 'Hinglish in, clean notes out. Revision mode before exams is exactly what I needed.', name: 'Rohan', role: 'Mech engineering, Delhi' },
  ];

  return (
    <div ref={pageRef} className="min-h-screen bg-(--bg) text-(--text) font-sans selection:bg-(--accent-soft) overflow-x-hidden">
      {/* ================= NAV (wide → compact morph) ================= */}
      <motion.header className="sticky top-0 z-50 w-full" style={{ paddingTop: navMarginTop }}>
        <div className="w-full">
          <motion.div
            className="mx-auto flex items-center justify-between border backdrop-blur-xl"
            style={{
              maxWidth: navMaxWidth,
              height: navHeight,
              borderRadius: navRadius,
              paddingLeft: navPadX,
              paddingRight: navPadX,
              boxShadow: navShadow,
              backgroundColor: navBg,
              borderColor: navBorder,
            }}
          >
            <motion.div style={{ scale: logoScale }} className="shrink-0">
              <Logo />
            </motion.div>

            <motion.nav
              className="hidden md:flex items-center text-[13.5px] font-medium text-(--text-dim) whitespace-nowrap"
            >
              {navItems.map(([label, href]) => {
                const collapsible = label === 'Features' || label === 'Ask your notes';
                const persistent = label === 'How it works' || label === 'Why NotesSync';
                const isFirst = label === 'How it works';
                const isLast = label === 'Why NotesSync';
                return (
                  <motion.a
                    key={label}
                    href={href}
                    className="px-3 py-1.5 rounded-lg hover:bg-(--surface-hover) hover:text-(--text) transition-colors whitespace-nowrap"
                    style={{
                      scale: persistent ? btnScale : 1,
                      opacity: collapsible ? linkOpacity : 1,
                      maxWidth: collapsible ? linkWidth : undefined,
                      marginLeft: isFirst ? 0 : collapsible ? collapsibleMargin : persistentMargin,
                      marginRight: isLast ? 0 : collapsible ? collapsibleMargin : persistentMargin,
                    }}
                  >
                    {label}
                  </motion.a>
                );
              })}
            </motion.nav>

            <motion.div className="flex items-center gap-2 shrink-0" style={{ scale: btnScale }}>
              <button
                type="button"
                onClick={toggleTheme}
                className="h-8 w-8 rounded-lg border border-(--border-subtle) hover:bg-(--surface-hover) transition-colors text-(--text-dim) flex items-center justify-center"
                title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <button
                type="button"
                onClick={handleLogin}
                className="hidden sm:inline-flex h-9 px-3.5 rounded-lg bg-(--surface) hover:bg-(--surface-hover) border border-(--border) text-(--text) text-[13px] font-semibold transition-colors items-center"
              >
                Log in
              </button>

              <button
                type="button"
                onClick={handleLogin}
                className="h-9 px-4 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) text-[13px] font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="hidden sm:inline">Start for free</span>
                <span className="sm:hidden">Start</span>
                <ArrowRight size={14} className="hidden sm:block text-(--accent-fg)/80" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      <main>
        {/* ================= HERO ================= */}
        <section className="relative w-full max-w-[1180px] mx-auto px-4 sm:px-6 pt-10 md:pt-14 pb-14 md:pb-20">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-20 right-[-8%] w-[480px] h-[480px] rounded-full bg-(--pastel-lavender) blur-[110px]"
            style={{ y: heroFloat }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-44 left-[-10%] w-[400px] h-[400px] rounded-full bg-(--pastel-yellow) blur-[110px]"
            style={{ y: heroFloat }}
          />

          <div className="relative grid lg:grid-cols-[0.98fr_1.02fr] gap-10 lg:gap-12 items-center">
            <div className="max-w-[600px]">
              <motion.h1
                className="mt-5 font-display text-[40px] sm:text-[54px] lg:text-[64px] leading-[1.04] tracking-tight text-(--text)"
                {...fadeUp}
              >
                Messy notes in.
                <br />
                <em className="text-(--accent-text)">Organized knowledge</em> out.
              </motion.h1>

              <motion.p
                className="mt-5 text-[16px] sm:text-[17px] leading-relaxed text-(--text-dim) max-w-[520px]"
                {...fadeUp}
              >
                Upload lecture PDFs, slides, screenshots, or paste messy notes.
                NotesSync extracts, structures, and connects them into searchable
                knowledge you can actually use before the exam.
              </motion.p>

              <motion.div
                className="mt-7 flex flex-col sm:flex-row gap-2.5"
                {...fadeUp}
              >
                <a
                  href="#try"
                  className="h-12 px-6 rounded-xl bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) font-semibold text-[14.5px] flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-(--accent)/15 hover:-translate-y-0.5"
                >
                  <Sparkles size={16} />
                  <span>Try now</span>
                </a>

                <a
                  href="#how"
                  className="h-12 px-5 rounded-xl border border-(--border) bg-(--surface) hover:bg-(--surface-hover) text-(--text) font-semibold text-[13.5px] flex items-center justify-center gap-2 transition-colors"
                >
                  See how it works
                  <ArrowRight size={15} />
                </a>
              </motion.div>
            </div>

            {/* Layered product mockup */}
            <motion.div
              className="relative pt-8 lg:pt-4"
              initial={prefersReduced ? false : { opacity: 0, y: 36, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
            >
              {/* back layers */}
              <motion.div
                aria-hidden
                className="absolute top-0 left-2 w-[46%] rotate-[-5deg] rounded-2xl border border-(--border-subtle) bg-(--pastel-peach) p-4 shadow-md"
                animate={prefersReduced ? undefined : { y: [0, -8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <PDFIcon className="w-5 h-5 text-(--text)" />
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-20 rounded bg-(--text)/25" />
                    <div className="h-1.5 w-14 rounded bg-(--text)/15" />
                  </div>
                </div>
                <p className="mt-2 text-[10px] font-semibold text-(--text)/70">Slides_Week_3.pdf</p>
              </motion.div>

              <motion.div
                aria-hidden
                className="absolute top-10 right-2 w-[42%] rotate-[4deg] rounded-2xl border border-(--border-subtle) bg-(--pastel-cyan) p-4 shadow-md"
                animate={prefersReduced ? undefined : { y: [0, 8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <SearchIcon className="w-4 h-4 text-(--text)" />
                  <p className="text-[10.5px] font-semibold text-(--text)/80 truncate">"where did I learn 3NF?"</p>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="h-2 w-3/4 rounded bg-(--text)/15" />
                  <div className="h-2 w-1/2 rounded bg-(--text)/10" />
                </div>
              </motion.div>

              {/* primary card */}
              <div className="relative ml-3 sm:ml-6 rounded-2xl border border-(--border) bg-(--surface-elevated) shadow-xl overflow-hidden">
                <div className="h-10 px-4 border-b border-(--border-subtle) bg-(--bg-subtle) flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-(--success)/70" />
                  </div>
                  <span className="min-w-0 truncate text-[11px] font-medium text-(--text-dim)">
                    DBMS / Lecture 04 — Database Normalization
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--pastel-mint) text-(--text) text-[10px] font-semibold">
                    <Sparkles size={10} className="text-(--accent-text)" />
                    Revision ready
                  </span>
                </div>

                <div className="grid sm:grid-cols-[0.72fr_1.28fr] sm:min-h-[380px]">
                  <aside className="hidden sm:block border-r border-(--border-subtle) bg-(--bg-subtle) p-3">
                    <div className="flex items-center gap-2 text-[11.5px] text-(--text-dim) mb-3">
                      <FileText size={13} />
                      Lectures
                    </div>
                    {['3NF explained', 'Functional dependencies', 'BCNF vs 3NF'].map((item, index) => (
                      <div
                        key={item}
                        className={`p-2.5 rounded-lg text-[12.5px] mb-1.5 border transition-colors ${
                          index === 1
                            ? 'bg-(--surface) border-(--border) text-(--text) shadow-sm'
                            : 'bg-transparent border-(--border-subtle) text-(--text-dim)'
                        }`}
                      >
                        <div className="font-semibold">{item}</div>
                        <div className="mt-0.5 text-[11px] text-(--text-faint)">Lecture {index + 2}</div>
                      </div>
                    ))}
                  </aside>

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="text-[11px] text-(--text-faint) uppercase tracking-wide font-semibold">
                          AI structured notes
                        </p>
                        <h2 className="font-display text-[19px] font-semibold tracking-tight text-(--text)">
                          Functional Dependencies
                        </h2>
                      </div>
                    </div>

                    <div className="rounded-xl border border-(--border-subtle) bg-(--bg) p-3.5 mb-3">
                      <div className="flex items-center gap-2 text-[11.5px] font-semibold text-(--accent-text) mb-2">
                        <MessageSquareText size={13} />
                        Ask: "explain 3NF in simple terms"
                      </div>
                      <p className="text-[12.5px] leading-5 text-(--text-dim)">
                        A table is in 3NF if it's in 2NF and has no transitive dependency —
                        every non-key column depends on the key, and not on another non-key
                        column. <span className="text-(--accent-text) font-medium">[Source 1 · Lecture 3]</span>
                      </p>
                    </div>

                    <div className="rounded-xl border border-(--border-subtle) bg-(--bg) p-3.5 mb-3">
                      <pre className="text-[12px] leading-5 font-mono text-(--text-dim) whitespace-pre-wrap">
{`//ai simplify
aaj FD padha. X -> Y matlab
X determines Y. 3NF remove
transitive dep.`}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-(--border-subtle) bg-(--pastel-lavender) p-2.5">
                        <p className="text-[10.5px] text-(--text-dim)">Semantic match</p>
                        <p className="font-mono text-(--accent-text) font-semibold">94%</p>
                      </div>
                      <div className="rounded-xl border border-(--border-subtle) bg-(--pastel-cyan) p-2.5">
                        <p className="text-[10.5px] text-(--text-dim)">Chunks indexed</p>
                        <p className="font-mono text-(--accent-text) font-semibold">1,248</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================= TRY IT FREE ================= */}
        <TryFreeSection />

        {/* ================= BRING ANYTHING IN ================= */}
        <WaysInStack />

        {/* ================= NOTESYNC DOES THE MESSY WORK ================= */}
        <section id="how" className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-16 md:py-24">
          <Reveal className="max-w-[620px] mx-auto text-center">
            <SectionLabel className="!text-center">The messy work</SectionLabel>
            <SectionTitle>NotesSync does the <em>messy work.</em></SectionTitle>
            <SectionBody className="mx-auto">
              Extract, structure, chunk, and embed — every lecture becomes one connected
              knowledge base that's searchable and ready to ask questions about.
            </SectionBody>
          </Reveal>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {pipeline.map(({ n, icon, title, copy }, i) => (
              <Reveal key={title} delay={(i % 4) * 0.08}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-(--border-subtle) bg-(--surface) p-5 transition-all duration-300 hover:-translate-y-1 hover:border-(--border-strong) hover:shadow-md">
                  <div
                    aria-hidden
                    className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-(--accent-soft) blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="w-9 h-9 rounded-xl bg-(--accent-soft) flex items-center justify-center text-(--text) group-hover:bg-(--accent) group-hover:text-(--accent-fg) transition-colors">
                      {icon}
                    </span>
                    <span className="font-display text-[16px] text-(--text-faint) italic">{n}</span>
                  </div>
                  <h3 className="mt-4 text-[15.5px] font-semibold tracking-tight text-(--text)">{title}</h3>
                  <p className="mt-1 text-[13px] leading-5 text-(--text-dim)">{copy}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.15} className="mt-8">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-(--text-dim)">
              {['Any input', '→', 'Extract', '→', 'Structure', '→', 'Chunk', '→', 'Embed', '→', 'Ask'].map((s, i) => (
                <span key={i} className={i % 2 === 0 ? 'font-semibold text-(--text)' : 'text-(--text-faint)'}>
                  {s}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ================= FEATURE: AI NOTES ================= */}
        <section className="border-y border-(--border-subtle) bg-(--bg-subtle)/60 px-4 sm:px-6 py-16 md:py-24">
          <div className="w-full max-w-[1180px] mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <Reveal>
              <SectionLabel>AI notes</SectionLabel>
              <SectionTitle>
                Your lectures, rewritten for <em>actual revision.</em>
              </SectionTitle>
              <SectionBody>
                Write freely — Hinglish, fragments, shorthand. NotesSync structures
                everything into clean markdown with headings, tables, code blocks,
                and high-yield key points. Run //ai commands right in the editor.
              </SectionBody>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Inline //ai commands while you type',
                  'Headings, tables, code, and citations',
                  'Hinglish in → clean English out',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-(--text-dim)">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-(--accent-text)" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-(--border) bg-(--pastel-lavender) p-6 sm:p-8">
                <div className="rounded-xl border border-(--border) bg-(--surface) shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-(--border-subtle) bg-(--bg-subtle)">
                    <span className="text-[11px] font-semibold text-(--text-dim) uppercase tracking-wide">Raw notes</span>
                    <span className="text-[11px] text-(--text-faint)">0:41 in class</span>
                  </div>
                  <pre className="p-4 text-[12.5px] leading-6 font-mono text-(--text-dim) whitespace-pre-wrap">
{`aaj 3NF padha. transitive dep
hatao. X->Y, Y->Z to X->Z
bad. 2NF bhi chahiye.
//ai make table: 1NF 2NF 3NF diff`}
                  </pre>
                </div>
                <div className="mt-3 flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-(--accent-fg)">
                    <ArrowDown size={14} />
                  </span>
                </div>
                <div className="rounded-xl border border-(--border) bg-(--surface) shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-(--border-subtle) bg-(--bg-subtle)">
                    <span className="text-[11px] font-semibold text-(--accent-text) uppercase tracking-wide">AI structured</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--pastel-mint) text-(--text) text-[10px] font-semibold">
                      <Sparkles size={10} /> Ready
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-display text-[15px] font-semibold text-(--text) mb-2">Third Normal Form (3NF)</p>
                    <p className="text-[12.5px] leading-5 text-(--text-dim)">
                      A relation is in 3NF if it is in 2NF and has <b className="text-(--text)">no transitive dependencies</b>:
                      no non-key attribute depends on another non-key attribute.
                    </p>
                    <div className="mt-3 rounded-lg bg-(--bg) border border-(--border-subtle) p-2.5">
                      <table className="w-full text-[11px] text-(--text-dim)">
                        <tbody>
                          <tr><td className="font-semibold text-(--text)">1NF</td><td>Atomic values only</td></tr>
                          <tr><td className="font-semibold text-(--text)">2NF</td><td>No partial dependency</td></tr>
                          <tr><td className="font-semibold text-(--text)">3NF</td><td>No transitive dependency</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= FEATURE: SEARCH ================= */}
        <section id="features" className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
            <Reveal>
              <div className="rounded-2xl border border-(--border) bg-(--pastel-mint) p-6 sm:p-8">
                <div className="rounded-xl border border-(--border) bg-(--surface) shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-(--border-subtle) bg-(--bg-subtle)">
                    <div className="flex items-center gap-2.5">
                      <Search size={15} className="text-(--text-faint)" />
                      <span className="text-[13px] text-(--text-dim)">
                        search <b className="text-(--text)">"where did I learn about database normalization?"</b>
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--pastel-lavender) text-(--text) text-[11px] font-semibold">
                        <Sparkles size={11} className="text-(--accent-text)" /> Hybrid
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {[
                      { title: 'DBMS — Lecture 04 · Database Normalization', pct: '96%', pastel: 'bg-(--pastel-lavender)' },
                      { title: 'DBMS — Lecture 07 · Functional Dependencies', pct: '91%', pastel: 'bg-(--pastel-cyan)' },
                      { title: 'Database Systems — Assignment 2 · ER design', pct: '84%', pastel: 'bg-(--pastel-yellow)' },
                    ].map(({ title, pct, pastel }) => (
                      <div
                        key={title}
                        className="flex items-center gap-3 rounded-xl border border-(--border-subtle) bg-(--bg) p-2.5 transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-lg ${pastel} flex items-center justify-center text-[12px] shrink-0`}>
                          <FileText size={13} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-(--text) truncate">{title}</p>
                        </div>
                        <span className="ml-auto text-[11.5px] font-mono text-(--accent-text) font-semibold shrink-0">
                          {pct}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <SectionLabel>Semantic search</SectionLabel>
              <SectionTitle>
                Knows what you meant, <em>not just what you typed.</em>
              </SectionTitle>
              <SectionBody>
                Keyword + semantic search merged with RRF ranking. Ask like you'd ask a
                friend — "the one where we did quick sort" — and it finds it.
              </SectionBody>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Relevance percentage on every result',
                  'Subject + lecture filters',
                  'Snippets with search highlighting',
                  'Works in Hinglish',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-(--text-dim)">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-(--accent-text)" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ================= FEATURE: ASK YOUR NOTES ================= */}
        <section id="ask" className="border-y border-(--border-subtle) bg-(--bg-subtle)/60 px-4 sm:px-6 py-16 md:py-24">
          <div className="w-full max-w-[1180px] mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Reveal>
                <SectionLabel>Ask your notes</SectionLabel>
                <SectionTitle>
                  Stop googling. <em>Ask your own lectures.</em>
                </SectionTitle>
                <SectionBody>
                  RAG chat answers only from your notes — never hallucinated internet
                  facts. Every answer lists exactly which lecture and chunk it came from.
                </SectionBody>
              </Reveal>

              <Reveal delay={0.1} className="mt-5">
                <div className="rounded-2xl border border-(--border-subtle) bg-(--surface) p-4">
                  <p className="text-[12px] font-semibold text-(--text-dim) mb-2">Try asking</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Explain normalization simply',
                      'Compare 2NF and 3NF',
                      'What did I study last week?',
                      'Find everything related to indexing',
                    ].map((q) => (
                      <span
                        key={q}
                        className="px-3 py-1.5 rounded-full border border-(--border-subtle) bg-(--bg) text-[12px] text-(--text-dim) hover:border-(--accent-ring) hover:text-(--text) cursor-pointer transition-colors"
                      >
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-(--border) bg-(--pastel-cyan) p-6 sm:p-8">
                <div className="rounded-xl border border-(--border) bg-(--surface) shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-(--border-subtle) bg-(--bg-subtle)">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-(--accent) flex items-center justify-center text-(--accent-fg)">
                        <MessageSquareText size={14} />
                      </span>
                      <span className="text-[13px] font-semibold text-(--text)">Ask DBMS notes</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="max-w-[85%] ml-auto rounded-2xl rounded-tr-sm bg-(--accent) text-(--accent-fg) text-[12.5px] leading-5 px-3.5 py-2.5 shadow-sm">
                      Explain 3NF using my DBMS notes.
                    </div>
                    <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-(--border-subtle) bg-(--bg) text-[12.5px] leading-5 px-3.5 py-2.5 text-(--text-dim)">
                      A table is in <b className="text-(--text)">3NF</b> if it is in 2NF and has no
                      transitive dependency — every non-key column depends on the primary key, not on
                      another non-key column.
                      <div className="mt-2.5 pt-2 border-t border-(--border-subtle)">
                        <p className="text-[10px] font-semibold text-(--text-faint) uppercase tracking-wide mb-1">
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-(--pastel-lavender) text-[11px] font-semibold text-(--text)">
                            DBMS · Lecture 04
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-(--pastel-mint) text-[11px] font-semibold text-(--text)">
                            DBMS · Lecture 07
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= FEATURE: VERSION HISTORY ================= */}
        <section className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <Reveal>
              <div className="rounded-2xl border border-(--border) bg-(--pastel-yellow) p-6 sm:p-8">
                <div className="rounded-xl border border-(--border) bg-(--surface) shadow-lg overflow-hidden p-4 space-y-2.5">
                  {[
                    { v: 'v3', t: 'Now', note: 'A relation is in 3NF if it is in 2NF and has no transitive dependency…', active: true },
                    { v: 'v2', t: '2h ago', note: '3NF = no transitive dep. Fix the example for partial dependency too.', active: false },
                    { v: 'v1', t: 'Yesterday', note: '3NF kya hai? transitive dependency explain karo.', active: false },
                  ].map(({ v, t, note, active }) => (
                    <div
                      key={v}
                      className={`rounded-xl border p-3 ${active ? 'border-(--accent-ring) bg-(--accent-soft)' : 'border-(--border-subtle) bg-(--bg)'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-mono font-semibold ${active ? 'text-(--accent-text)' : 'text-(--text-faint)'}`}>{v}</span>
                        <span className="text-[10.5px] text-(--text-faint)">{t}</span>
                      </div>
                      <p className="text-[12px] text-(--text-dim) leading-5">{note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <SectionLabel>Version history</SectionLabel>
              <SectionTitle>
                Every save is a <em>rollback point.</em>
              </SectionTitle>
              <SectionBody>
                A bad AI rewrite? Undo it. Notes got mangled by an import? Restore the
                version that worked. Diff between versions shows exactly what changed.
              </SectionBody>
              <ul className="mt-6 space-y-2.5">
                {[
                  'Automatic versioning on every save',
                  'Visual diff between versions',
                  'One-click rollback',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-(--text-dim)">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-(--accent-text)" />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ================= FEATURE GRID ================= */}
        <section className="border-y border-(--border-subtle) bg-(--bg-subtle)/60 px-4 sm:px-6 py-16 md:py-24">
          <div className="w-full max-w-[1180px] mx-auto">
            <Reveal className="max-w-[560px]">
              <SectionLabel>Everything you need</SectionLabel>
              <SectionTitle>Built for students who <em>write fast.</em></SectionTitle>
            </Reveal>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {features.map(({ icon, title, copy }, i) => (
                <Reveal key={title} delay={(i % 4) * 0.07}>
                  <div className="group h-full rounded-2xl border border-(--border-subtle) bg-(--surface) p-5 transition-all hover:-translate-y-1 hover:shadow-md">
                    <div className="w-9 h-9 rounded-xl bg-(--accent-soft) flex items-center justify-center text-(--text) mb-3 group-hover:bg-(--accent) group-hover:text-(--accent-fg) transition-colors">
                      {icon}
                    </div>
                    <h3 className="text-[14.5px] font-semibold tracking-tight text-(--text)">{title}</h3>
                    <p className="mt-1 text-[12.5px] leading-5 text-(--text-dim)">{copy}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= TESTIMONIALS ================= */}
        <section id="why" className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-16 md:py-24">
          <Reveal className="max-w-[560px]">
            <SectionLabel>Loved by students</SectionLabel>
            <SectionTitle>Don't take our word for it.</SectionTitle>
          </Reveal>
          <div className="mt-10 grid md:grid-cols-3 gap-3.5">
            {testimonials.map(({ quote, name, role }, i) => (
              <Reveal key={name} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-(--border-subtle) bg-(--surface) p-5 flex flex-col shadow-sm">
                  <Quote size={18} className="text-(--text-faint) mb-3" />
                  <p className="text-[13.5px] leading-6 text-(--text-dim)">"{quote}"</p>
                  <div className="mt-4 pt-4 border-t border-(--border-subtle) flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-(--accent-fg) text-[12px] font-bold">
                      {name[0]}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-semibold text-(--text)">{name}</p>
                      <p className="text-[11px] text-(--text-faint)">{role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="relative px-4 sm:px-6 py-8 border-t border-(--border-subtle) text-[12.5px] text-(--text-faint)">
        {/* Happy Dog sitting on the border */}
        <div className="absolute -top-[85px] left-1/2 -translate-x-1/2 pointer-events-none" aria-hidden>
          <DotLottieReact
            src="/animations/happy-dog.lottie"
            loop
            autoplay
            style={{ width: 130, height: 130 }}
          />
        </div>
        <div className="w-full max-w-[1180px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-5">
            {[
              ['How it works', '#how'],
              ['Features', '#features'],
              ['Ask', '#ask'],
              ['Why NotesSync', '#why'],
            ].map(([label, href]) => (
              <a key={label} href={href} className="hover:text-(--text-dim) transition-colors">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5">
              <LayoutTemplate size={13} />
              Made for students
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={13} />
              NotesSync
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;