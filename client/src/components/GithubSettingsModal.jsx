import { useState, useEffect } from 'react';
import { X, CloudUpload, Save } from 'lucide-react';
import { getGithubSettings, saveGithubSettings } from '../utils/githubSettings';

const GithubSettingsModal = ({ isOpen, onClose }) => {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState('');

  useEffect(() => {
    if (isOpen) {
      const settings = getGithubSettings();
      setToken(settings.token || '');
      setRepo(settings.repo || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveGithubSettings({ token, repo });
    onClose();
  };

  return (
    <div className="modal flex text-left">
      <div className="w-[450px] p-6 text-[#e5e5e5]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-[15px] font-semibold flex items-center gap-2">
            <CloudUpload size={18} style={{ color: '#a78bfa' }} />
            GitHub Integrations
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5" style={{ background: 'transparent' }}>
            <X size={15} />
          </button>
        </div>

        <p className="text-[12px] leading-relaxed mb-6" style={{ color: '#a3a3a3' }}>
          Connect your GitHub account to automatically push your processed notes directly to a repository as Markdown files. 
        </p>

        <div className="mb-5 space-y-2">
          <label className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: '#737373' }}>
            Personal Access Token (PAT)
          </label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="input"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          />
          <p className="text-[11px] mt-1" style={{ color: '#525252' }}>
            Requires "repo" scope to push files. Token is stored securely in your browser's local storage.
          </p>
        </div>

        <div className="mb-6 space-y-2">
          <label className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: '#737373' }}>
            Repository Path
          </label>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="input"
            placeholder="username/repo-name"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="btn-ghost flex-1 py-2">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1 py-2 justify-center">
            <Save size={14} className="mr-1.5" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default GithubSettingsModal;
