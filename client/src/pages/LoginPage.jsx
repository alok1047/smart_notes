import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ClipboardList, Lightbulb, Folder, Sun, Moon } from 'lucide-react';

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
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
        <div className="w-8 h-8 rounded-md bg-(--accent) animate-pulse" />
      </div>
    );
  }

  const features = [
    { icon: ClipboardList, title: 'AI structuring', desc: 'Messy notes become clean, formatted markdown.' },
    { icon: Lightbulb, title: 'Revision mode', desc: 'Surfaces only the key points before exams.' },
    { icon: Folder, title: 'Hinglish friendly', desc: 'Write how you think — AI handles the rest.' },
  ];

  const Logo = () => (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-[10px] bg-(--accent) flex items-center justify-center shrink-0">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </div>
      <span className="text-[16px] font-semibold text-(--text) tracking-tight">SmartNotes</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-(--bg) lg:grid lg:grid-cols-2 relative">
      {/* Floating theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn-ghost p-2 absolute top-5 right-6 z-10"
        title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* LEFT column: hero */}
      <div className="hidden lg:flex flex-col lg:border-r lg:border-(--border-subtle) min-h-screen">
        <div className="border-b border-(--border-subtle)">
          <div className="mx-auto w-full max-w-140 px-10 py-6">
            <Logo />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="mx-auto w-full max-w-140 px-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-(--bg-subtle) border border-(--border-subtle) text-[11px] mb-12">
              <span className="text-(--accent-text) font-semibold tracking-[0.08em]">BETA</span>
              <span className="text-(--text-faint)">·</span>
              <span className="text-(--text-dim) font-medium">invite friends</span>
            </span>

            <h1 className="text-[56px] xl:text-[64px] font-bold text-(--text) leading-[1.1] tracking-[-0.04em] mb-8">
              Lecture notes,<br />
              structured <span className="text-(--text-dim)">instantly.</span>
            </h1>

            <p className="text-[16px] text-(--text-dim) leading-relaxed mb-16 max-w-md">
              Write messy notes during class — even in Hinglish. AI converts them into clean, revision-ready markdown in seconds.
            </p>

            <div className="space-y-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-6 mb-10">
                  <div className="w-10 h-10 mb-3 rounded-2xl bg-(--accent) flex items-center justify-center shrink-0 text-(--bg) flex-none">
                    <Icon size={25} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[15.5px] font-semibold text-(--text) leading-snug">{title}</p>
                    <p className="text-[14px] text-(--text-dim) mt-7 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT column: sign-in */}
      <div className="flex flex-col min-h-screen">
        {/* Mobile-only logo */}
        <div className="lg:hidden border-b border-(--border-subtle)">
          <div className="px-6 py-5">
            <Logo />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-16 lg:p-12">
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-10 md:p-12">
              <h2 className="text-[32px] font-semibold text-(--text) mb-2 tracking-tight">Sign in</h2>
              <p className="text-[15px] text-(--text-dim) mb-8 leading-relaxed">
                Continue to your notes workspace.
              </p>

              <button
                onClick={handleLogin}
                disabled={busy}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-(--bg) hover:bg-(--surface-hover) text-(--text) font-medium text-[15px] rounded-lg border border-(--border) transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <div className="w-4 h-4 border-2 border-(--text-faint) border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                <span>{busy ? 'Signing in...' : 'Continue with Google'}</span>
              </button>

              {error && (
                <div className="mt-6 px-4 py-3 rounded-md bg-(--danger-soft) animate-fade-in">
                  <p className="text-[13px] text-(--danger) font-medium">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3 my-8">
                <div className="h-px flex-1 bg-(--border-subtle)" />
                <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-(--text-faint)">OR</span>
                <div className="h-px flex-1 bg-(--border-subtle)" />
              </div>

              <p className="text-[13.5px] text-(--text-dim) text-center leading-relaxed mb-8">
                By signing in you agree to the{' '}
                <a href="#" className="text-(--text-dim) hover:text-(--text) transition-colors underline underline-offset-2">Terms</a>
                {' '}and{' '}
                <a href="#" className="text-(--text-dim) hover:text-(--text) transition-colors underline underline-offset-2">Privacy Policy</a>.
              </p>

              <div className="my-8 h-px bg-(--border-subtle)" />

              <p className="text-center text-[13.5px] text-(--text-dim) leading-relaxed">
                New here? Just sign in — your workspace is created automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
