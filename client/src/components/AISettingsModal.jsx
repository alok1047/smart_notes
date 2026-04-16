import { useState, useEffect } from 'react';
import { X, KeySquare, Sparkles } from 'lucide-react';
import { getAISettings, saveAISettings } from '../utils/aiSettings';

const AISettingsModal = ({ onClose }) => {
  const [form, setForm] = useState({ provider: 'gemini', apiKey: '' });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Load existing settings
    setForm(getAISettings());
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    saveAISettings(form);
    
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale-in max-w-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#a78bfa]" />
            <h2 className="text-[16px] font-bold text-[#f5f5f5]">AI Provider Settings</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className="block text-[12px] font-semibold text-[#737373] mb-1.5 uppercase tracking-wide">
              Selected Provider
            </label>
            <div className="relative">
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="input appearance-none w-full"
                style={{ cursor: 'pointer' }}
              >
                <option value="gemini">Gemini (Default)</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="groq">Groq (LLaMA/Mixtral)</option>
              </select>
            </div>
            {form.provider === 'gemini' && (
              <p className="text-[11px] text-[#525252] mt-1.5 leading-relaxed">
                If no key is provided, the server's default Gemini key will be used automatically.
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-[12px] font-semibold text-[#737373] mb-1.5 uppercase tracking-wide">
              Custom API Key <span className="text-[#525252] font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#525252]">
                <KeySquare size={15} />
              </div>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder={`Enter your ${form.provider === 'openai' ? 'OpenAI' : form.provider === 'groq' ? 'Groq' : 'Gemini'} API key`}
                className="input pl-10"
              />
            </div>
          </div>

          {successMsg && (
            <div className="mb-4 text-[13px] text-[#10b981] font-medium animate-fade-in flex items-center justify-center bg-[#10b981]/10 py-2 rounded-lg">
              {successMsg}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 justify-center"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AISettingsModal;
