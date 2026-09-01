import { useState } from 'react';
import { X, Sparkles, KeySquare, Check, Eye, EyeOff, Zap, RefreshCw } from 'lucide-react';
import { getAISettings, saveAISettings, resetAISettings } from '../utils/aiSettings';
import { PROVIDERS, FREE_MODELS } from '../utils/aiModels';

const AISettingsModal = ({ onClose }) => {
  const initial = getAISettings();
  const [tier, setTier] = useState(initial.tier || 'free');
  const [provider, setProvider] = useState(initial.provider || 'groq');
  const [model, setModel] = useState(initial.model || '');
  const [apiKey, setApiKey] = useState(initial.apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const providerMeta = PROVIDERS[provider] || PROVIDERS.groq;
  const providerModels = providerMeta.models || [];
  const selectedModel = model || providerModels[0] || '';

  const pickFree = (p, m) => {
    setProvider(p);
    setModel(m);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const settings =
      tier === 'free'
        ? { tier, provider, model, apiKey: '' }
        : { tier, provider, model: selectedModel, apiKey: apiKey.trim() };
    saveAISettings(settings);
    setSuccessMsg('Settings saved.');
    setTimeout(() => onClose(), 1100);
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const defaults = resetAISettings();
    setTier(defaults.tier);
    setProvider(defaults.provider);
    setModel(defaults.model);
    setApiKey(defaults.apiKey);
    setConfirmReset(false);
    setSuccessMsg('Reset to defaults.');
    setTimeout(() => onClose(), 1100);
  };

  const tierCard = (id, icon, title, sub) => (
    <button
      type="button"
      onClick={() => setTier(id)}
      className={`relative rounded-xl border p-3.5 text-left transition-colors ${
        tier === id
          ? 'border-(--accent-ring) bg-(--accent-soft)'
          : 'border-(--border-subtle) bg-(--surface) hover:border-(--border)'
      }`}
    >
      {tier === id && (
        <span className="absolute top-2.5 right-2.5 text-(--accent-text)">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
      <span className="flex items-center gap-2 text-[13px] font-semibold text-(--text)">{icon}{title}</span>
      <span className="mt-1 block text-[11.5px] text-(--text-faint) leading-snug">{sub}</span>
    </button>
  );

  return (
    <div className="modal-overlay z-[9999]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale-in max-w-lg">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-(--text) leading-tight flex items-center gap-2">
              <Sparkles size={14} className="text-(--accent-text)" />
              AI Settings
            </h2>
            <p className="text-[12px] text-(--text-dim) mt-1">
              Choose how NotesSync powers your notes.
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Tier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            {tierCard('free',
              <Zap size={14} className="text-(--accent-teal)" />,
              'Free · included',
              'Runs on NotesSync’s built-in models. No API key needed.'
            )}
            {tierCard('byok',
              <KeySquare size={14} className="text-(--accent-amber)" />,
              'Bring your own key',
              'Pick any model and paste your own API key.'
            )}
          </div>

          {tier === 'free' ? (
            <div>
              <p className="text-[12.5px] text-(--text-dim) leading-relaxed">
                Everything runs on NotesSync’s built-in AI — no setup, no card. Select the model you’d like to use.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {FREE_MODELS.map((m) => {
                  const selected = provider === m.provider && (model === m.model || (!model && provider === m.provider));
                  return (
                    <button
                      key={`${m.provider}-${m.model}`}
                      type="button"
                      onClick={() => pickFree(m.provider, m.model)}
                      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                        selected
                          ? 'border-(--accent-ring) bg-(--accent-soft)'
                          : 'border-(--border-subtle) bg-(--surface) hover:border-(--border)'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-(--text)">{m.label}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-(--surface-hover) text-[10px] font-semibold uppercase tracking-wide text-(--text-faint)">
                        {m.tag}
                      </span>
                      {selected && <Check size={14} className="text-(--accent-text) shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => { setProvider(e.target.value); setModel(''); }}
                  className="input appearance-none w-full cursor-pointer"
                >
                  {Object.entries(PROVIDERS).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
                  Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setModel(e.target.value)}
                  className="input appearance-none w-full cursor-pointer"
                >
                  {providerModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
                  API Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-(--text-faint)">
                    <KeySquare size={14} />
                  </div>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Paste your ${providerMeta.label} key`}
                    className="input pl-9 pr-10"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute inset-y-0 right-2 flex items-center text-(--text-faint) hover:text-(--text) transition-colors"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11.5px] text-(--text-faint) leading-relaxed">
                  {providerMeta.env
                    ? 'Leave blank to fall back to NotesSync’s server key for this provider.'
                    : 'Required — this provider is only available with your own key.'}
                </p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 px-3 py-2 rounded-md bg-(--success-soft) text-(--success) text-[12.5px] font-medium animate-fade-in text-center">
              {successMsg}
            </div>
          )}

          <div className="flex gap-2 justify-between items-center mt-5 pt-4 border-t border-(--border-subtle)">
            <button
              type="button"
              onClick={handleReset}
              className="btn-ghost text-[12px] text-(--text-faint) hover:text-(--danger)"
              title={confirmReset ? 'Click again to confirm' : 'Reset to defaults'}
            >
              <RefreshCw size={13} />
              {confirmReset ? 'Confirm reset' : 'Reset'}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AISettingsModal;
