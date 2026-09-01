import axios from 'axios';
import { getIdToken, clearIdToken } from './googleAuth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const SESSION_KEY = 'notesync_session';

/**
 * Auth endpoints legitimately return 401 (wrong credentials, invalid Google
 * ID token). A 401 there is an *outcome the page is already handling* and
 * shows an inline error — it must never hijack the whole app with a redirect.
 */
const isAuthAttempt = (url = '') => /^\/?(api\/)?auth\/(login|register|google)\b/.test(url);

// Request interceptor: attach the session/ID token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthAttempt(error.config?.url)) {
      // Session expired / invalid on a protected request: clear the cached
      // session so the reload doesn't restore it, then send the user to the
      // login page (never to the auth endpoints, and never a hard redirect
      // while the user is already there).
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        // noop — storage may be unavailable
      }
      clearIdToken();
      const { pathname } = window.location;
      if (!pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
