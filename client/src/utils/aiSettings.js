/**
 * Utility functions for managing AI provider settings in localStorage
 */

const STORAGE_KEY = 'smart_notes_ai_settings';

const DEFAULT_SETTINGS = {
  provider: 'gemini', // 'gemini', 'openai', or 'groq'
  apiKey: '',
};

export const getAISettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
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
