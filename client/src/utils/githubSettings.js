const STORAGE_KEY = 'smart_notes_github_settings';

export const getGithubSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: '', repo: '' };
    return JSON.parse(raw);
  } catch {
    return { token: '', repo: '' };
  }
};

export const saveGithubSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Dispatch an event so the rest of the app updates if needed
    window.dispatchEvent(new CustomEvent('githubSettingsChanged', { detail: settings }));
  } catch (err) {
    console.error('Failed to save Github settings', err);
  }
};
