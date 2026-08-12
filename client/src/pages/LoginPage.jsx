import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ClipboardList,
  Lightbulb,
  Folder,
  Sun,
  Moon,
} from 'lucide-react';

const LoginPage = () => {
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
        <div className="w-8 h-8 rounded-md bg-(--accent) animate-pulse" />
      </div>
    );
  }

  const features = [
    {
      icon: ClipboardList,
      title: 'AI structuring',
      desc: 'Messy notes become clean, formatted markdown.',
    },
    {
      icon: Lightbulb,
      title: 'Revision mode',
      desc: 'Surfaces only the key points before exams.',
    },
    {
      icon: Folder,
      title: 'Hinglish friendly',
      desc: 'Write how you think — AI handles the rest.',
    },
  ];

  const Logo = () => (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-(--accent) flex items-center justify-center">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 0 0-5H20" />
        </svg>
      </div>

      <span className="text-[15px] font-semibold text-(--text) tracking-tight">
        SmartNotes
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-(--bg) lg:grid lg:grid-cols-[minmax(0,1fr)_480px]">

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-6 z-10 p-2 rounded-full border border-(--border-subtle) hover:bg-(--surface-hover) transition-colors text-(--text-dim)"
        title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      >
        {theme === 'dark' ? (
          <Sun size={15} />
        ) : (
          <Moon size={15} />
        )}
      </button>

      {/* LEFT SIDE */}
      <div className="hidden lg:flex min-h-screen flex-col border-r border-(--border-subtle)">

        {/* Logo */}
        <div className="shrink-0 border-b border-(--border-subtle)">
          <div className="px-10 xl:px-16 py-5 flex items-center">
            <Logo />
          </div>
        </div>

        {/* Hero */}
        <div className="flex-1 flex items-center justify-center px-10 xl:px-16 py-16">
          <div className="w-full max-w-[560px]">


            {/* Heading */}
            <h1 className="text-[40px] xl:text-[48px] font-bold leading-[1.1] tracking-[-0.03em] mb-4">
              <span className="text-(--text)">
                Lecture notes
              </span>

              <br />

              <span className="text-(--text-dim)">
                structured instantly.
              </span>
            </h1>

            {/* Description */}
            <p className="text-[15px] text-(--text-dim) leading-relaxed max-w-[400px] mb-10">
              Write messy notes during class .
              AI converts them into clean, revision-ready markdown
              in seconds.
            </p>
            <br></br>
            {/* Features */}
            <div className="flex flex-col gap-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-(--accent-soft) flex items-center justify-center shrink-0 mt-0.5">
                    <Icon
                      size={16}
                      className="text-(--accent-text)"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14px] font-semibold text-(--text) leading-snug">
                      {title}
                    </p>

                    <p className="text-[13px] text-(--text-dim) leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="min-h-screen flex flex-col bg-(--bg-subtle)">

        {/* Mobile Logo */}
        <div className="lg:hidden shrink-0 border-b border-(--border-subtle)">
          <div className="px-6 py-5 flex items-center">
            <Logo />
          </div>
        </div>

        {/* Login */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-16 py-16 gap-4">
          <div className="w-full max-w-[360px] gap-4">

            <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-(--text)">
              Sign in
            </h2>
              
            <p className="text-[14px] text-(--text-dim) mt-2.5 mb-7 leading-relaxed">
              Continue to your notes workspace.
            </p>
            <br></br>
            {/* Google Login */}
            <button
              onClick={handleLogin}
              disabled={busy}
              className="w-full h-11 flex items-center justify-center gap-3 px-4 bg-(--surface) hover:bg-(--surface-hover) text-(--text) font-medium text-[14px] rounded-lg border border-(--border) transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <div className="w-4 h-4 border-2 border-(--text-faint) border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
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
              )}

              <span>
                {busy
                  ? 'Signing in...'
                  : 'Continue with Google'}
              </span>
            </button>

            {/* Error */}
            {error && (
              <div className="mt-4 px-3 py-2.5 rounded-md bg-(--danger-soft)">
                <p className="text-[13px] text-(--danger) font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Footer Information */}
            <div className="mt-7 flex flex-col gap-5 border-t border-(--border-subtle) pt-5">

              <p className="text-[12px] text-(--text-faint) text-center leading-relaxed">
                By signing in you agree to the{' '}
                <a
                  href="#"
                  className="underline underline-offset-2 hover:text-(--text-dim) transition-colors"
                >
                  Terms
                </a>

                {' '}and{' '}

                <a
                  href="#"
                  className="underline underline-offset-2 hover:text-(--text-dim) transition-colors"
                >
                  Privacy Policy
                </a>.
              </p>

              <p className="text-center text-[12px] text-(--text-faint)">
                New here? Just sign in — your account is created automatically.
              </p>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;