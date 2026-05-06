import { useState, useEffect } from 'react';
import { X, KeySquare, Sparkles } from 'lucide-react';
import { getAISettings, saveAISettings } from '../utils/aiSettings';

const AISettingsModal = ({ onClose }) => {
  const [form, setForm] = useState({ provider: 'gemini', apiKey: '' });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setForm(getAISettings());
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    saveAISettings(form);
    setSuccessMsg('Settings saved.');
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale-in max-w-sm">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-(--text) leading-tight flex items-center gap-2">
              <Sparkles size={14} className="text-(--accent-text)" />
              AI Provider
            </h2>
            <p className="text-[12px] text-(--text-dim) mt-1">Choose a model and add an API key.</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
              Provider
            </label>
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
              className="input appearance-none w-full cursor-pointer"
            >
              <option value="gemini">Gemini (default)</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="groq">Groq (LLaMA / Mixtral)</option>
            </select>
            {form.provider === 'gemini' && (
              <p className="text-[11.5px] text-(--text-faint) mt-1.5 leading-relaxed">
                If no key is provided, the server's default Gemini key will be used.
              </p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
              API Key <span className="text-(--text-faint) font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-(--text-faint)">
                <KeySquare size={14} />
              </div>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder={`Your ${form.provider === 'openai' ? 'OpenAI' : form.provider === 'groq' ? 'Groq' : 'Gemini'} key`}
                className="input pl-9"
              />
            </div>
          </div>

          {successMsg && (
            <div className="mb-4 px-3 py-2 rounded-md bg-(--success-soft) text-(--success) text-[12.5px] font-medium animate-fade-in text-center">
              {successMsg}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AISettingsModal;
