import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import heroAsset from '../assets/hero.png';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  CloudUpload,
  FileText,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Wand2,
  Zap,
} from 'lucide-react';

const GoogleIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    className="shrink-0"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const LandingPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      setBusy(true);
      setError('');
      await login();
      navigate('/dashboard');
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg) flex items-center justify-center">
        <div className="w-8 h-8 rounded-md bg-[#2383e2] animate-pulse" />
      </div>
    );
  }

  const navItems = [
    ['Workflow', '#workflow'],
    ['AI tools', '#ai-tools'],
    ['Revision', '#revision'],
  ];

  const featureBlocks = [
    {
      icon: <Wand2 size={18} />,
      title: 'Clean up lecture chaos',
      copy: 'Paste class scribbles, Hinglish, formulas, and half-written bullets. SmartNotes turns them into readable Markdown.',
    },
    {
      icon: <Zap size={18} />,
      title: 'Use inline AI commands',
      copy: 'Run commands like //ai make table or //ai simplify inside the editor while you are still thinking.',
    },
    {
      icon: <Search size={18} />,
      title: 'Find things before exams',
      copy: 'Search subjects and lectures quickly, then jump into compact revision notes when time is tight.',
    },
  ];

  const workflow = [
    ['01', 'Write freely', 'Type the way notes actually happen in class.'],
    ['02', 'Ask AI', 'Clean, simplify, format, or extract key points.'],
    ['03', 'Revise', 'Switch to focused summaries before tests.'],
  ];

  const Logo = () => (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="flex items-center gap-2.5 text-left"
      aria-label="Go to SmartNotes home"
    >
      <span className="w-8 h-8 rounded-lg bg-[#2383e2] flex items-center justify-center text-white shadow-sm">
        <BookOpen size={17} />
      </span>
      <span className="text-[15px] font-semibold text-(--text) tracking-normal">
        SmartNotes
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-(--bg) text-(--text) font-sans selection:bg-[#2383e2]/25 overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-(--bg)/90 backdrop-blur-xl border-b border-(--border-subtle)">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Logo />

          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium text-(--text-dim)">
            {navItems.map(([label, href]) => (
              <a
                key={label}
                href={href}
                className="px-3 py-1.5 rounded-md hover:bg-(--surface-hover) hover:text-(--text) transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="h-8 w-8 rounded-md border border-(--border-subtle) hover:bg-(--surface-hover) transition-colors text-(--text-dim) flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={handleLogin}
              disabled={busy}
              className="h-8.5 px-3 sm:px-4 rounded-md bg-[#2383e2] hover:bg-[#1b6ec2] text-white text-[13px] font-semibold transition-colors flex items-center gap-2 disabled:opacity-60 shadow-sm"
            >
              <span>Sign in</span>
              <ArrowRight size={14} className="hidden sm:block text-white/80" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 pt-6 md:pt-10 pb-6">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-8 items-center">
            <div className="max-w-[620px]">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#2383e2]/10 border border-[#2383e2]/25 text-[12px] font-semibold text-[#529CCA] mb-3">
                <Sparkles size={13} />
                AI notes for real student chaos
              </div>

              <h1 className="text-[30px] md:text-[42px] lg:text-[52px] font-bold leading-[1.08] tracking-normal text-(--text)">
                Turn rough lectures into notes you can actually revise.
              </h1>

              <p className="mt-3 text-[14px] md:text-[16px] leading-normal text-(--text-dim) max-w-[540px]">
                Write messy class notes in English, Hinglish, bullets, code, or fragments.
                SmartNotes cleans them into structured Markdown with key points ready before exams.
              </p>

              <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={busy}
                  className="h-10.5 px-5 rounded-md bg-[#2383e2] hover:bg-[#1b6ec2] text-white font-semibold text-[14px] flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 shadow-sm"
                >
                  {busy ? (
                    <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span>{busy ? 'Connecting...' : 'Start with Google'}</span>
                </button>

                <a
                  href="#workflow"
                  className="h-10.5 px-4 rounded-md border border-(--border) bg-(--surface) hover:bg-(--surface-hover) text-(--text) font-semibold text-[13.5px] flex items-center justify-center gap-2 transition-colors"
                >
                  See workflow
                  <ArrowRight size={15} />
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-(--text-dim)">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#2383e2]" />
                  Google login
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-[#2383e2]" />
                  Markdown export
                </span>
                <span className="flex items-center gap-1.5">
                  <CloudUpload size={14} className="text-[#2383e2]" />
                  GitHub push
                </span>
              </div>

              {error && (
                <div className="mt-4 p-2.5 rounded-md bg-red-500/10 border border-red-500/20 max-w-sm">
                  <p className="text-[13px] text-red-400 font-medium">{error}</p>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute -top-5 right-6 hidden sm:block">
                <img
                  src={heroAsset}
                  alt=""
                  className="w-20 h-20 object-contain opacity-80"
                />
              </div>

              <div className="rounded-lg border border-(--border) bg-(--surface-elevated) shadow-xl overflow-hidden">
                <div className="h-9 px-3.5 border-b border-(--border-subtle) bg-(--bg-subtle) flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80" />
                  </div>
                  <span className="min-w-0 truncate text-[11px] font-mono text-(--text-faint)">
                    DSA / Binary Search
                  </span>
                </div>

                <div className="grid md:grid-cols-[0.82fr_1.18fr] md:min-h-[360px]">
                  <aside className="border-b md:border-b-0 md:border-r border-(--border-subtle) bg-(--bg-subtle) p-3">
                    <div className="flex items-center gap-2 text-[11.5px] text-(--text-dim) mb-3">
                      <ClipboardList size={13} />
                      Today
                    </div>
                    {['Arrays basics', 'Binary search', 'Recursion tree'].map((item, index) => (
                      <div
                        key={item}
                        className={`p-2.5 rounded-md text-[12.5px] mb-1.5 border ${
                          index === 1
                            ? 'bg-[#2383e2]/12 border-[#2383e2]/30 text-(--text)'
                            : 'bg-(--surface) border-(--border-subtle) text-(--text-dim)'
                        }`}
                      >
                        <div className="font-semibold">{item}</div>
                        <div className="mt-0.5 text-[11px] text-(--text-faint)">
                          Lecture {index + 4}
                        </div>
                      </div>
                    ))}
                  </aside>

                  <div className="p-3.5 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="text-[11px] text-(--text-faint)">AI formatted notes</p>
                        <h2 className="text-[16px] font-semibold tracking-normal text-(--text)">
                          Binary Search
                        </h2>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2383e2]/10 border border-[#2383e2]/20 text-[#529CCA] text-[11.5px] font-semibold">
                        <Check size={12} />
                        Revision ready
                      </span>
                    </div>

                    <div className="rounded-md border border-(--border-subtle) bg-(--bg) p-3 mb-3">
                      <div className="flex items-center gap-2 text-[11.5px] font-semibold text-[#529CCA] mb-2">
                        <Sparkles size={13} />
                        //ai simplify + make table
                      </div>
                      <pre className="text-[12px] leading-5 font-mono text-(--text-dim) whitespace-pre-wrap">
{`aaj binary search padha.
sorted arr mandatory.
mid = low + (high-low)/2
worst case log n hai.`}
                      </pre>
                    </div>

                    <div className="space-y-2.5 text-[12.5px] leading-5 text-(--text-dim)">
                      <div>
                        <h3 className="text-[13px] font-semibold text-(--text) mb-0.5">
                          Key idea
                        </h3>
                        <p>
                          Repeatedly divide a sorted search space in half until the target is found.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md border border-(--border-subtle) bg-(--surface) p-2.5">
                          <p className="text-[10.5px] text-(--text-faint)">Time</p>
                          <p className="font-mono text-[#529CCA] font-semibold">O(log n)</p>
                        </div>
                        <div className="rounded-md border border-(--border-subtle) bg-(--surface) p-2.5">
                          <p className="text-[10.5px] text-(--text-faint)">Space</p>
                          <p className="font-mono text-[#529CCA] font-semibold">O(1)</p>
                        </div>
                      </div>

                      <div className="rounded-md border border-[#F59E0B]/20 bg-[#F59E0B]/10 p-2.5 text-(--text)">
                        <p className="text-[11.5px] font-semibold text-[#F59E0B] mb-0.5">Exam trigger</p>
                        <p className="text-[12px] text-(--text-dim)">
                          Binary search only works when search space is sorted.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="border-y border-(--border-subtle) bg-(--bg-subtle)/50 px-4 sm:px-6 py-8"
        >
          <div className="w-full max-w-[1180px] mx-auto grid md:grid-cols-3 gap-3">
            {workflow.map(([step, title, copy]) => (
              <div
                key={step}
                className="rounded-lg border border-(--border-subtle) bg-(--surface) p-4"
              >
                <span className="text-[12px] font-mono text-[#529CCA] font-semibold">{step}</span>
                <h2 className="mt-2 text-[16px] font-semibold tracking-normal text-(--text)">
                  {title}
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-(--text-dim)">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="ai-tools" className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-10">
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-6 items-start">
            <div>
              <p className="text-[12px] font-semibold text-[#529CCA] uppercase tracking-[0.1em]">
                Built for studying
              </p>
              <h2 className="mt-2 text-[26px] sm:text-[32px] font-bold tracking-normal leading-snug text-(--text)">
                Less formatting. More understanding.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-(--text-dim)">
                The landing page should feel like the product: direct, fast, and made for people who need to revise under pressure.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {featureBlocks.map(({ icon, title, copy }) => (
                <div
                  key={title}
                  className="rounded-lg border border-(--border-subtle) bg-(--surface) p-4"
                >
                  <div className="w-8 h-8 rounded-md bg-[#2383e2]/10 border border-[#2383e2]/25 flex items-center justify-center text-[#529CCA] mb-3">
                    {icon}
                  </div>
                  <h3 className="text-[14.5px] font-semibold tracking-normal text-(--text)">
                    {title}
                  </h3>
                  <p className="mt-1 text-[12.5px] leading-5 text-(--text-dim)">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="revision"
          className="border-t border-(--border-subtle) bg-(--bg-subtle)/50 px-4 sm:px-6 py-10"
        >
          <div className="w-full max-w-[1180px] mx-auto grid lg:grid-cols-[1fr_0.9fr] gap-6 items-center">
            <div className="rounded-lg border border-(--border) bg-(--surface-elevated) p-4 sm:p-5">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#529CCA] mb-3">
                <FileText size={14} />
                Revision mode preview
              </div>
              <div className="space-y-2">
                {[
                  'Sorted input is required for classic binary search.',
                  'Use low + (high - low) / 2 to avoid overflow.',
                  'Each comparison removes half the remaining range.',
                  'Worst-case time complexity is O(log n).',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2.5 rounded-md border border-(--border-subtle) bg-(--bg) p-2.5 text-[12.5px] text-(--text-dim)"
                  >
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2383e2]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[12px] font-semibold text-[#529CCA] uppercase tracking-[0.1em]">
                Exam week friendly
              </p>
              <h2 className="mt-2 text-[26px] sm:text-[32px] font-bold tracking-normal leading-snug text-(--text)">
                Jump from full lectures to only what matters.
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-(--text-dim)">
                Revision mode pulls the high-yield points out of your processed notes so you can scan quickly without losing context.
              </p>

              <div className="mt-5 flex flex-col md:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={busy}
                  className="h-10 px-5 rounded-md bg-[#2383e2] hover:bg-[#1b6ec2] text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
                >
                  <GoogleIcon />
                  <span>Start taking notes</span>
                </button>
                <span className="h-10 px-3.5 rounded-md border border-(--border-subtle) text-[12.5px] text-(--text-dim) flex items-center justify-center gap-2">
                  <CloudUpload size={14} />
                  Export PDF or push to GitHub
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-4 sm:px-6 py-5 border-t border-(--border-subtle) text-[12.5px] text-(--text-faint)">
        <div className="w-full max-w-[1180px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo />
          <p>SmartNotes for lecture notes, revision, and markdown exports.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
