import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithGoogle,
  logOut,
  getIdToken,
  storeIdToken,
  clearIdToken,
} from '../services/googleAuth';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const sessionKey = 'notesync_session';

const persistSession = (token, user) => {
  if (token) storeIdToken(token);
  if (user) localStorage.setItem(sessionKey, JSON.stringify(user));
};

const readSessionUser = () => {
  try {
    const raw = localStorage.getItem(sessionKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readSessionUser());
  const [dbUser, setDbUser] = useState(() => readSessionUser());
  const [loading, setLoading] = useState(true);

  // Restore session on mount. Only Google sessions can be re-validated against
  // /auth/google; email/password sessions carry the app's own JWT, which that
  // endpoint always rejects (401) — so never send those tokens to it.
  useEffect(() => {
    (async () => {
      try {
        const token = await getIdToken();
        const cached = readSessionUser();

        if (!token || !cached) {
          if (token && !cached) clearIdToken();
          return;
        }

        setUser(cached);
        setDbUser(cached);

        if (cached.provider === 'google') {
          try {
            const res = await api.post('/auth/google', { token });
            setDbUser(res.data.user);
            persistSession(token, res.data.user);
          } catch {
            // Google ID token may be expired — the API interceptor /
            // subsequent 401 handling takes care of the sign-out flow.
          }
        }
      } catch {
        clearIdToken();
        localStorage.removeItem(sessionKey);
        setUser(null);
        setDbUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applyAuth = (token, profile) => {
    persistSession(token, profile);
    setUser(profile);
    setDbUser(profile);
    setLoading(false);
    return profile;
  };

  const login = async () => {
    try {
      // Note: we don't toggle `loading` here — the Google popup is an
      // interactive flow and the LoginPage keeps its own `busy` state, so the
      // user should keep seeing the page (and any inline errors) instead of a
      // full-screen loader while the account chooser is open.
      const { idToken } = await signInWithGoogle();
      storeIdToken(idToken);

      const res = await api.post('/auth/google', { token: idToken });
      return applyAuth(idToken, res.data.user);
    } catch (error) {
      clearIdToken();
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      const profile = res.data.user;
      return applyAuth(res.data.token, { ...profile, provider: 'email' });
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const registerWithEmail = async (name, email, password) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', { name, email, password });
      const profile = res.data.user;
      return applyAuth(res.data.token, { ...profile, provider: 'email' });
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    clearIdToken();
    localStorage.removeItem(sessionKey);
    setUser(null);
    setDbUser(null);
  };

  const updateUser = (profile) => {
    if (!profile) return;
    setDbUser(profile);
    setUser(profile);
    const token = localStorage.getItem('google_id_token') || localStorage.getItem('notesync_token');
    persistSession(token, profile);
    return profile;
  };

  const value = {
    user,
    dbUser,
    loading,
    login,
    loginWithEmail,
    registerWithEmail,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};