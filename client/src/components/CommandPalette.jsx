import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, BookOpen, FileText, Plus, LayoutDashboard, Zap,
  Sun, Moon, LogOut, Sparkles, CloudUpload, CornerDownLeft
} from 'lucide-react';
import { useCommandPalette } from '../context/CommandPaletteContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { searchAll } from '../services/lectureService';

const CommandPalette = () => {
  const { open, close } = useCommandPalette();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const data = await searchAll(query);
        setResults(data);
      } catch (e) {
        console.error(e);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  const actions = useMemo(() => [
    { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, run: () => navigate('/dashboard') },
    { id: 'revision', label: 'Open Revision Mode', icon: Zap, run: () => navigate('/revision') },
    {
      id: 'theme',
      label: theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode',
      icon: theme === 'dark' ? Sun : Moon,
      run: () => toggleTheme(),
    },
    { id: 'logout', label: 'Sign out', icon: LogOut, run: async () => { await logout(); navigate('/'); } },
  ], [theme, toggleTheme, logout, navigate]);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(a => a.label.toLowerCase().includes(q));
  }, [query, actions]);

  const subjectResults = results?.subjects?.slice(0, 5) || [];
  const lectureResults = results?.lectures?.slice(0, 6) || [];

  const flatItems = useMemo(() => {
    const items = [];
    filteredActions.forEach((a) => items.push({ kind: 'action', data: a }));
    subjectResults.forEach((s) => items.push({ kind: 'subject', data: s }));
    lectureResults.forEach((l) => items.push({ kind: 'lecture', data: l }));
    return items;
  }, [filteredActions, subjectResults, lectureResults]);

  useEffect(() => { setSelected(0); }, [query, results]);

  const runItem = (item) => {
    if (!item) return;
    if (item.kind === 'action') item.data.run();
    else if (item.kind === 'subject') navigate(`/lectures/${item.data._id}`);
    else if (item.kind === 'lecture') navigate(`/editor/${item.data._id}`);
    close();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      runItem(flatItems[selected]);
    }
  };

  if (!open) return null;

  let itemIdx = -1;
  const itemProps = (i) => ({
    'data-selected': i === selected,
    onMouseEnter: () => setSelected(i),
  });

  return (
    <div className="cmdk-overlay" onClick={close}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-header">
          <Search size={16} style={{ color: 'var(--text-dim)' }} />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Search or run a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="kbd">esc</kbd>
        </div>

        <div className="cmdk-list">
          {flatItems.length === 0 ? (
            <div className="cmdk-empty">No results for "{query}"</div>
          ) : (
            <>
              {filteredActions.length > 0 && (
                <>
                  <div className="cmdk-group-label">Actions</div>
                  {filteredActions.map((a) => {
                    itemIdx++;
                    const Icon = a.icon;
                    return (
                      <button
                        key={a.id}
                        className="cmdk-item"
                        {...itemProps(itemIdx)}
                        onClick={() => runItem({ kind: 'action', data: a })}
                      >
                        <Icon size={15} className="cmdk-item-icon" />
                        <span className="cmdk-item-label">{a.label}</span>
                      </button>
                    );
                  })}
                </>
              )}

              {subjectResults.length > 0 && (
                <>
                  <div className="cmdk-group-label">Subjects</div>
                  {subjectResults.map((s) => {
                    itemIdx++;
                    return (
                      <button
                        key={s._id}
                        className="cmdk-item"
                        {...itemProps(itemIdx)}
                        onClick={() => runItem({ kind: 'subject', data: s })}
                      >
                        <BookOpen size={15} className="cmdk-item-icon" />
                        <span className="cmdk-item-label">{s.name}</span>
                        <span className="cmdk-item-sub">Subject</span>
                      </button>
                    );
                  })}
                </>
              )}

              {lectureResults.length > 0 && (
                <>
                  <div className="cmdk-group-label">Lectures</div>
                  {lectureResults.map((l) => {
                    itemIdx++;
                    return (
                      <button
                        key={l._id}
                        className="cmdk-item"
                        {...itemProps(itemIdx)}
                        onClick={() => runItem({ kind: 'lecture', data: l })}
                      >
                        <FileText size={15} className="cmdk-item-icon" />
                        <span className="cmdk-item-label">
                          {l.title?.trim() || `Lecture ${l.lectureNumber}`}
                        </span>
                        <span className="cmdk-item-sub">{l.subjectName}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        <div className="cmdk-footer">
          <span className="flex items-center gap-1.5">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="kbd"><CornerDownLeft size={10} /></kbd>
            select
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <kbd className="kbd">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
