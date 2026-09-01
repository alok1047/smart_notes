import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sun, Moon, ArrowRight, BookOpen, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import AuthIllustration from '../components/AuthIllustration';
import { AppLoader } from '../components/NotesLoader';
import { toErrorMessage } from '../utils/errors';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const Logo = () => (
  <Link to="/" className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-[10px] bg-(--accent) flex items-center justify-center text-(--accent-fg)">
      <BookOpen size={16} />
    </div>
    <span className="font-display text-[18px] font-semibold text-(--text) tracking-tight">
      NotesSync
    </span>
  </Link>
);

const validate = (mode, form) => {
  const errors = {};
  if (mode === 'signup' && form.name.trim().length < 2) {
    errors.name = 'Please enter your name';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (mode === 'signup' && form.confirm !== form.password) {
    errors.confirm = 'Passwords do not match';
  }
  return errors;
};

const LoginPage = () => {
  const { login, loginWithEmail, registerWithEmail, isAuthenticated, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  const [mode, setMode] = useState('login'); // login | signup
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setError('');
  };

  const handleGoogle = async () => {
    try {
      setBusy(true);
      setError('');
      await login();
      navigate('/dashboard');
    } catch (e) {
      setError(toErrorMessage(e, 'Google sign-in failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(mode, form);
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      setBusy(true);
      setError('');
      if (mode === 'login') {
        await loginWithEmail(form.email, form.password);
      } else {
        await registerWithEmail(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(toErrorMessage(err, mode === 'login' ? 'Sign-in failed.' : 'Sign-up failed.'));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setError('');
    setInfo('');
    // Preserve typed values so fields stay "alive" across the morph; only
    // clear the signup-only confirmation field which isn't used in login.
    setForm((f) => ({ ...f, confirm: '' }));
    // Focus the first input for the target mode after the layout settles.
    requestAnimationFrame(() => {
      const sel = m === 'signup' ? 'input[name="name"]' : 'input[name="email"]';
      document.querySelector(sel)?.focus();
    });
  };

  if (loading) return <AppLoader />;

  const inputCls =
    'w-full h-11 pl-10 pr-10 rounded-xl bg-(--surface) border border-(--border) text-[14px] text-(--text) placeholder:text-(--text-faint) focus:outline-none focus:border-(--accent) focus:ring-2 focus:ring-(--accent-ring) transition-all';

  return (
    <div className="h-screen overflow-hidden bg-(--bg) lg:grid lg:grid-cols-[minmax(0,1fr)_480px]">

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-6 z-10 p-2 rounded-full border border-(--border-subtle) hover:bg-(--surface-hover) transition-colors text-(--text-dim)"
        title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      {/* RIGHT — animated illustration panel (desktop) */}
      <div className="hidden lg:flex min-h-screen flex-col border-l border-(--border-subtle) relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(700px circle at 85% 0%, var(--pastel-lavender), transparent 55%), radial-gradient(600px circle at 10% 80%, var(--pastel-yellow), transparent 55%), radial-gradient(700px circle at 90% 100%, var(--pastel-mint), transparent 55%)',
          }}
        />

        <div className="relative shrink-0">
          <div className="px-10 xl:px-16 py-5 flex items-center">
            <Logo />
          </div>
        </div>

        <div className="relative flex-1 flex items-center justify-center px-10 xl:px-16 py-10">
          <div className="w-full max-w-[560px] flex flex-col items-center">
            <motion.h1
              className="text-center font-display text-[40px] xl:text-[46px] leading-[1.06] tracking-tight text-(--text)"
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              Messy material in.
              <br />
              <em className="text-(--accent-text)">Organized knowledge</em> out.
            </motion.h1>

            <motion.p
              className="mt-4 text-[14.5px] text-(--text-dim) leading-relaxed max-w-[360px] text-center"
              initial={prefersReduced ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              NotesSync turns your lecture notes, slide PDFs and whiteboard photos into
              clean, revision-ready knowledge.
            </motion.p>

            <AuthIllustration className="mt-2 w-full max-w-[460px]" />

            <motion.div
              className="mt-2 flex items-center gap-2 text-[12px] text-(--text-faint)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <SparkleDot />
              <SparkleDot delay={0.4} />
              <span>Your notes, actually useful</span>
              <SparkleDot delay={0.8} />
              <SparkleDot delay={1.2} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* LEFT — form panel */}
      <div className="h-screen flex flex-col bg-(--bg-subtle) overflow-hidden">
        {/* Mobile logo */}
        <div className="lg:hidden shrink-0 border-b border-(--border-subtle)">
          <div className="px-6 py-5 flex items-center justify-between">
            <Logo />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-(--border-subtle) text-(--text-dim)"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 py-14 gap-4 overflow-y-auto">
          <div className="w-full max-w-[400px] my-auto">
              <h2 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-(--text)">
                <MorphText value={mode === 'login' ? 'Welcome back' : 'Create your account'} />
              </h2>
              <p className="text-[14px] text-(--text-dim) mt-2 mb-7 leading-relaxed">
                <MorphText
                  value={
                    mode === 'login'
                      ? 'Continue to your notes workspace.'
                      : 'Start turning messy lectures into organized knowledge — free for students.'
                  }
                />
              </p>

              {/* Mode tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-(--surface-hover) border border-(--border-subtle) mb-6">
                {(['login', 'signup']).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={`h-9 rounded-lg text-[13px] font-semibold transition-all ${
                      mode === m
                        ? 'bg-(--surface) text-(--text) shadow-sm border border-(--border-subtle)'
                        : 'text-(--text-faint) hover:text-(--text-dim)'
                    }`}
                  >
                    {m === 'login' ? 'Log in' : 'Sign up'}
                  </button>
                ))}
              </div>

              {/* Email/password form */}
              <motion.form
                layout
                onSubmit={handleSubmit}
                noValidate
                transition={prefersReduced ? { duration: 0.2 } : heightTween}
              >
                <AnimatePresence initial={false}>
                  {mode === 'signup' && (
                    <GrowField key="name-field" reduced={prefersReduced}>
                      <div>
                        <label className="block text-[12.5px] font-medium text-(--text-dim) mb-1.5">
                          Name
                        </label>
                        <div className="relative">
                          <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-faint)" />
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={setField('name')}
                            placeholder="Your full name"
                            className={inputCls}
                            autoComplete="name"
                          />
                        </div>
                        {errors.name && <FieldError msg={errors.name} />}
                      </div>
                    </GrowField>
                  )}

                  <FieldLayout key="email-field">
                    <div>
                      <label className="block text-[12.5px] font-medium text-(--text-dim) mb-1.5">
                        Email
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-faint)" />
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={setField('email')}
                          placeholder="you@university.edu"
                          className={inputCls}
                          autoComplete="email"
                        />
                      </div>
                      {errors.email && <FieldError msg={errors.email} />}
                    </div>
                  </FieldLayout>

                  <FieldLayout key="password-field">
                    <div>
                      <label className="block text-[12.5px] font-medium text-(--text-dim) mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-faint)" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={setField('password')}
                          placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                          className={inputCls}
                          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--text-faint) hover:text-(--text-dim) transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {errors.password && <FieldError msg={errors.password} />}
                    </div>
                  </FieldLayout>

                  {mode === 'signup' && (
                    <GrowField key="confirm-field" reduced={prefersReduced}>
                      <div>
                        <label className="block text-[12.5px] font-medium text-(--text-dim) mb-1.5">
                          Confirm password
                        </label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-faint)" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={form.confirm}
                            onChange={setField('confirm')}
                            placeholder="Re-enter your password"
                            className={inputCls}
                            autoComplete="new-password"
                          />
                        </div>
                        {errors.confirm && <FieldError msg={errors.confirm} />}
                      </div>
                    </GrowField>
                  )}

                  {mode === 'login' && (
                    <GrowField key="forgot-field" reduced={prefersReduced} pad={0}>
                      <div className="flex justify-end -mt-1">
                        <button
                          type="button"
                          onClick={() => setInfo('Password reset is coming soon. Meanwhile, try signing in with Google.')}
                          className="text-[12.5px] font-medium text-(--accent-text) hover:text-(--text) transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </GrowField>
                  )}

                  {(error || info) && (
                    <FieldLayout key="message-field" pad={0}>
                      {error && (
                        <div className="px-3 py-2.5 rounded-xl bg-(--danger-soft) border border-(--danger-border)">
                          <p className="text-[13px] text-(--danger) font-medium">{error}</p>
                        </div>
                      )}
                      {info && (
                        <div className="px-3 py-2.5 rounded-xl bg-(--info)/10 border border-(--info)/25">
                          <p className="text-[13px] text-(--info) font-medium">{info}</p>
                        </div>
                      )}
                    </FieldLayout>
                  )}
                </AnimatePresence>

                {/* Submit button — anchored, label morphs */}
                <motion.div
                  layout
                  style={{ paddingTop: mode === 'signup' ? 10 : 0 }}
                  transition={prefersReduced ? { duration: 0.2 } : heightTween}
                >
                  <motion.button
                    type="submit"
                    disabled={busy}
                    className="w-full h-11 rounded-xl bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) font-semibold text-[14px] transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {busy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-(--accent-fg) border-t-transparent rounded-full animate-spin" />
                        {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      <>
                        <MorphText value={mode === 'login' ? 'Log in' : 'Create account'} />
                        <ArrowRight size={15} />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </motion.form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3 text-[11px] font-semibold text-(--text-faint) uppercase tracking-wider">
                <span className="flex-1 h-px bg-(--border-subtle)" />
                or continue with
                <span className="flex-1 h-px bg-(--border-subtle)" />
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="w-full h-11 flex items-center justify-center gap-3 px-4 bg-(--surface) hover:bg-(--surface-hover) text-(--text) font-semibold text-[14px] rounded-xl border border-(--border) transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Switch mode */}
              <p className="mt-6 text-center text-[13px] text-(--text-dim)">
                {mode === 'login' ? (
                  <>
                    <MorphText value="New to NotesSync?" />{' '}
                    <button onClick={() => switchMode('signup')} className="font-semibold text-(--accent-text) hover:text-(--text) transition-colors">
                      <MorphText value="Create an account" />
                    </button>
                  </>
                ) : (
                  <>
                    <MorphText value="Already have an account?" />{' '}
                    <button onClick={() => switchMode('login')} className="font-semibold text-(--accent-text) hover:text-(--text) transition-colors">
                      <MorphText value="Log in" />
                    </button>
                  </>
                )}
              </p>

            {/* Footer */}
            <div className="mt-8 flex flex-col gap-4 border-t border-(--border-subtle) pt-6">
              <Link
                to="/"
                className="mx-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-(--accent-text) hover:text-(--text) transition-colors"
              >
                Back to home
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile illustration below form */}
        <div className="lg:hidden px-6 pb-10">
          <AuthIllustration className="mx-auto w-full max-w-[340px] opacity-80" />
        </div>
      </div>
    </div>
  );
};

const FieldError = ({ msg }) => (
  <p className="mt-1 text-[12px] text-(--danger)">{msg}</p>
);

/**
 * MorphText — smoothly transforms one string into another via a blur+opacity
 * fade-in. New text fades in over the position of the old (no "wait" gap),
 * so the title/subtitle/button label morph rather than being hard-replaced.
 */
const MorphText = ({ value, className = '', as = 'span' }) => {
  const reduced = useReducedMotion();
  const Tag = as;
  return (
    <Tag className={className} style={{ position: 'relative', display: 'inline-block' }}>
      <motion.span
        key={value}
        className="inline-block"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={
          reduced
            ? { duration: 0.12 }
            : { duration: 0.22, ease: [0.25, 0.8, 0.35, 1] }
        }
      >
        {value}
      </motion.span>
    </Tag>
  );
};

const fieldSpring = { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 };
const heightTween = { duration: 0.32, ease: [0.25, 0.8, 0.35, 1] };
const GAP = 14; // px bottom spacing per field (matches original space-y-3.5)

/** Persistent field wrapper — animates position via layout as siblings grow. */
const FieldLayout = ({ children, pad = GAP, className = '', ...rest }) => (
  <motion.div
    layout
    className={`overflow-hidden ${className}`}
    style={{ paddingBottom: pad }}
    transition={heightTween}
    {...rest}
  >
    {children}
  </motion.div>
);

/**
 * Signup-only field that grows/collapses smoothly. framer-motion cannot tween
 * `height: auto` (it snaps), so we measure the inner content and animate to an
 * explicit pixel height — this gives a buttery expand/collapse with no jump.
 * Padding lives inside the measured content so it collapses with the height
 * instead of causing a snap at the very end.
 */
const GrowField = ({ children, pad = GAP, reduced }) => {
  const innerRef = useRef(null);
  const [h, setH] = useState(0);

  useEffect(() => {
    if (innerRef.current) setH(innerRef.current.offsetHeight);
  }, []);

  return (
    <motion.div
      className="overflow-hidden"
      initial={reduced ? { height: 0, opacity: 0 } : { height: 0, opacity: 0, scale: 0.985 }}
      animate={reduced ? { height: h, opacity: 1 } : { height: h, opacity: 1, scale: 1 }}
      exit={reduced ? { height: 0, opacity: 0 } : { height: 0, opacity: 0, scale: 0.985 }}
      transition={{ height: heightTween, opacity: { duration: 0.18 }, scale: fieldSpring }}
    >
      <div ref={innerRef} style={{ paddingBottom: pad }}>{children}</div>
    </motion.div>
  );
};

const SparkleDot = ({ delay = 0 }) => {
  const reduced = useReducedMotion();
  return (
    <motion.span
      className="inline-block w-1.5 h-1.5 rounded-full bg-(--accent-text)"
      animate={reduced ? {} : { opacity: [0.2, 1, 0.2] }}
      transition={{ duration: 1.6, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
};

export default LoginPage;