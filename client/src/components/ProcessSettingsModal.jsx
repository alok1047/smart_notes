import { useState } from 'react';
import { X, Settings2, Sparkles, Languages } from 'lucide-react';

const ProcessSettingsModal = ({ onClose, onConfirm }) => {
  const [language, setLanguage] = useState('English');
  const [strictness, setStrictness] = useState('strict');
  const [includeKeyPoints, setIncludeKeyPoints] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      language,
      strictness,
      includeKeyPoints,
      includeSummary,
    });
  };

  return (
    <div className="modal-overlay z-[9999]" onClick={onClose}>
      <div
        className="modal max-w-md w-full bg-(--surface) border border-(--border-subtle) rounded-xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[16px] font-semibold flex items-center gap-2 text-(--text)">
            <Settings2 size={18} className="text-(--accent-text)" />
            AI Processing Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-(--surface-hover) text-(--text-dim) transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-(--text) flex items-center gap-1.5">
              <Languages size={14} /> Output Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input w-full bg-(--bg) cursor-pointer"
            >
              <option value="English">English</option>
              <option value="Hinglish">Hinglish</option>
              <option value="Hindi">Hindi</option>
            </select>
            <p className="text-[11.5px] text-(--text-dim)">
              The AI will translate and format your notes into this language.
            </p>
          </div>

          {/* Strictness Level */}
          <div className="space-y-2 pt-2">
            <label className="text-[13px] font-medium text-(--text)">
              AI Strictness
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg border border-(--border-subtle) hover:bg-(--surface-hover) transition-colors">
                <input
                  type="radio"
                  name="strictness"
                  value="strict"
                  checked={strictness === 'strict'}
                  onChange={() => setStrictness('strict')}
                  className="mt-1"
                />
                <div>
                  <div className="text-[13px] font-medium text-(--text)">Strictly structure given notes only</div>
                  <div className="text-[11.5px] text-(--text-dim)">Prevents AI from adding external information.</div>
                </div>
              </label>
              
              <label className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg border border-(--border-subtle) hover:bg-(--surface-hover) transition-colors">
                <input
                  type="radio"
                  name="strictness"
                  value="loose"
                  checked={strictness === 'loose'}
                  onChange={() => setStrictness('loose')}
                  className="mt-1"
                />
                <div>
                  <div className="text-[13px] font-medium text-(--text)">Add extra educational context</div>
                  <div className="text-[11.5px] text-(--text-dim)">Allows AI to add helpful definitions and explanations.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-3 pt-2">
            <label className="text-[13px] font-medium text-(--text)">
              Structure Options
            </label>
            
            <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-(--text-dim) hover:text-(--text) transition-colors">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="w-4 h-4 rounded border-(--border) text-(--accent) focus:ring-(--accent)"
              />
              Include a brief summary at the top
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-[13px] text-(--text-dim) hover:text-(--text) transition-colors">
              <input
                type="checkbox"
                checked={includeKeyPoints}
                onChange={(e) => setIncludeKeyPoints(e.target.checked)}
                className="w-4 h-4 rounded border-(--border) text-(--accent) focus:ring-(--accent)"
              />
              Include "Key Points" section at the bottom (Required for Revision Mode)
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-(--border-subtle)">
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
              <Sparkles size={14} />
              Process Notes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProcessSettingsModal;
