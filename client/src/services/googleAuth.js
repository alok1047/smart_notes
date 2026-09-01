// Google OAuth 2.0 (Google Identity Services) — replaces Firebase Auth
// Client obtains an ID token via the GIS token-client popup flow; the server
// verifies it with google-auth-library. No Firebase dependency.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let gsiScriptLoaded = false;
let gsiScriptLoading = null;

const loadGsiScript = () => {
  if (gsiScriptLoaded || window.google?.accounts) {
    gsiScriptLoaded = true;
    return Promise.resolve();
  }
  if (gsiScriptLoading) return gsiScriptLoading;

  gsiScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gsiScriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });

  return gsiScriptLoading;
};

/**
 * Sign in with Google via the OAuth 2.0 **token client** popup flow.
 *
 * Why not `google.accounts.id.prompt()` (One Tap)? One Tap is suppressed in
 * browsers where FedCM / third-party cookies are blocked (`gsi/status` 403)
 * and when it is suppressed the prompt never fires a callback, leaving the
 * login button spinning forever with no error.
 *
 * The token-client popup opens a real account-chooser window that works under
 * those restrictions. Google's popup response usually carries an `id_token`;
 * when it doesn't (a GSI implicit-grant quirk) it still returns an
 * `access_token`. The backend accepts either one — ID tokens are verified as
 * JWTs and access tokens via the tokeninfo endpoint — so this helper always
 * hands the server a non-empty credential.
 */
export const signInWithGoogle = async () => {
  if (!CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID is not configured');
  }

  await loadGsiScript();

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      if (timer) window.clearTimeout(timer);
      fn(value);
    };

    // Safety net: if the popup is blocked, closed without completing, or the
    // network is flaky, the callback may never fire. Never leave a spinner
    // running forever — reject with a helpful message instead.
    timer = window.setTimeout(() => {
      settle(
        reject,
        new Error(
          'Google sign-in timed out. If a popup was blocked, allow popups for this site and try again.'
        )
      );
    }, 120000);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'openid email profile', // `openid` ⇒ the callback carries an id_token when available
        ux_mode: 'popup',
        callback: (response) => {
          if (settled) return;

          if (response?.error) {
            settle(
              reject,
              new Error(`Google sign-in failed: ${response.error_description || response.error}`)
            );
            return;
          }

          // Prefer the ID token; accept the access token as a fallback —
          // the backend verifies either one.
          const credential = response?.id_token || response?.access_token;
          if (!credential) {
            settle(
              reject,
              new Error("Google sign-in didn't return an ID token or access token. Please try again.")
            );
            return;
          }

          // Cache the access token so logout can revoke it (best effort).
          const accessToken = response?.access_token;
          if (accessToken) {
            try {
              window.localStorage.setItem('google_access_token', accessToken);
            } catch {
              // noop — non-persistent storage unavailable
            }
          }

          settle(resolve, { user: { idToken: credential }, idToken: credential, accessToken });
        },
      });

      // Opens the Google account chooser / consent popup.
      tokenClient.requestAccessToken();
    } catch (error) {
      settle(reject, error instanceof Error ? error : new Error(String(error)));
    }
  });
};

export const logOut = async () => {
  // Revoke the popup access token (best effort) before clearing storage.
  const accessToken = window.localStorage.getItem('google_access_token');
  if (accessToken && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(accessToken, () => {});
    } catch {
      // noop — revocation is best-effort
    }
  }
  try {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.cancel();
    }
  } catch {
    // noop — GIS may not be loaded
  }
  clearIdToken();
};

export const getIdToken = async () => {
  return window.localStorage.getItem('google_id_token');
};

export const storeIdToken = (token) => {
  window.localStorage.setItem('google_id_token', token);
};

export const clearIdToken = () => {
  window.localStorage.removeItem('google_id_token');
  window.localStorage.removeItem('google_access_token');
};