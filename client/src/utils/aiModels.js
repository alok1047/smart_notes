/* AI model catalog — single source of truth for the settings UI. */

export const PROVIDERS = {
  gemini: {
    label: 'Google · Gemini',
    env: true,
    models: ['gemini-3.6-flash', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  openai: {
    label: 'OpenAI',
    env: true,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4-turbo', 'o3-mini'],
  },
  groq: {
    label: 'Groq',
    env: true,
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  deepseek: {
    label: 'DeepSeek',
    env: false,
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  mistral: {
    label: 'Mistral',
    env: false,
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
  },
  anthropic: {
    label: 'Anthropic · Claude',
    env: false,
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-opus-latest',
    ],
  },
};

/* Free models — run on NotesSync's built-in server keys. */
export const FREE_MODELS = [
  { provider: 'gemini', model: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', tag: 'Fast' },
  { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Groq · Llama 3.3 70B', tag: 'Popular' },
  { provider: 'openai', model: 'gpt-4o-mini', label: 'OpenAI · GPT-4o mini', tag: 'Smart' },
];
