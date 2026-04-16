import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GraduationCap, Sparkles, Brain, Zap } from 'lucide-react';

const LoginPage = () => {
  const { login, isAuthenticated, loading } = useAuth();
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 rounded-xl bg-[#7c3aed] flex items-center justify-center animate-pulse">
          <GraduationCap size={20} className="text-white" />
        </div>
      </div>
    );
  }

  const features = [
    { icon: Sparkles, label: 'AI-powered note structuring' },
    { icon: Brain, label: 'Smart revision mode' },
    { icon: Zap, label: 'Supports Hinglish & mixed languages' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left: hero panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 border-r border-[#1f1f1f] relative overflow-hidden">
        {/* Subtle gradient blob */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#7c3aed] opacity-[0.04] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-[16px] font-bold text-white">SmartNotes</span>
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight tracking-tight mb-6">
            Turn messy notes<br />into structured<br />
            <span className="text-[#a78bfa]">study material.</span>
          </h1>

          <p className="text-[16px] text-[#737373] leading-relaxed mb-10">
            Write your raw lecture notes — even in Hinglish — and let AI transform them into clean, structured, revision-ready content.
          </p>

          <div className="space-y-4">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#1f1f1f] border border-[#2a2a2a] flex items-center justify-center">
                  <Icon size={13} className="text-[#a78bfa]" />
                </div>
                <span className="text-[13px] font-medium text-[#a3a3a3]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: sign-in card */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-white">SmartNotes</span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Sign in</h2>
          <p className="text-[13px] text-[#525252] mb-8">
            Continue with your Google account to get started.
          </p>

          {/* Google button */}
          <button
            onClick={handleLogin}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-[#f5f5f5] text-[#111111] font-semibold text-[14px] rounded-xl transition-all duration-150 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {busy ? (
              <div className="w-5 h-5 border-2 border-[#d4d4d4] border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {busy ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && (
            <p className="mt-4 text-center text-[13px] text-[#f43f5e] animate-fade-in">{error}</p>
          )}

          <p className="mt-8 text-center text-[11px] text-[#404040]">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
