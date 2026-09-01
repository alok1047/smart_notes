/**
 * Utility functions for managing AI provider settings in localStorage.
 *
 * `tier`:
 *   'free' — NotesSync's built-in models (server-side keys, no setup needed).
 *   'byok' — bring your own API key; pick any provider + model and paste a key.
 *
 * `provider` / `model` / `apiKey` describe the active selection.
 */

const STORAGE_KEY = 'smart_notes_ai_settings';

const DEFAULT_SETTINGS = {
  tier: 'free', // 'free' | 'byok'
  provider: 'groq', // gemini | openai | groq | deepseek | mistral | anthropic
  model: '',
  apiKey: '',
};

export const getAISettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);
    const settings = { ...DEFAULT_SETTINGS, ...parsed };

    // Backwards compatibility: a stored key with no explicit tier means BYO key.
    if (parsed.tier === undefined && settings.apiKey) {
      settings.tier = 'byok';
    }
    return settings;
  } catch (error) {
    console.error('Failed to parse AI settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveAISettings = (settings) => {
  try {
    const current = getAISettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch a custom event so other components can know it changed
    window.dispatchEvent(new Event('aiSettingsChanged'));
    return updated;
  } catch (error) {
    console.error('Failed to save AI settings:', error);
    throw error;
  }
};

export const resetAISettings = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('aiSettingsChanged'));
  return DEFAULT_SETTINGS;
};
