import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, FileText, BookOpen, X, Menu, Command } from 'lucide-react';
import { searchAll } from '../services/lectureService';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '../context/CommandPaletteContext';

const Topbar = ({ onMenuToggle, rightContent, breadcrumb }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { toggle: toggleCmdk } = useCommandPalette();
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.trim().length < 2) { setResults(null); setOpen(false); return; }
    try {
      setLoading(true);
      const data = await searchAll(val);
      setResults(data);
      setOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const go = (path) => {
    setQuery(''); setResults(null); setOpen(false);
    navigate(path);
  };

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-search-container]')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="topbar">
      <button
        onClick={onMenuToggle}
        className="btn-ghost md:hidden shrink-0 p-1.5"
      >
        <Menu size={16} />
      </button>

      {breadcrumb && (
        <div className="hidden md:flex items-center gap-2 text-[14px] font-bold text-(--text) tracking-tight shrink-0">
          {breadcrumb}
        </div>
      )}

      <div className="flex-1 flex justify-end" data-search-container>
        <div className="relative w-full max-w-xl">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
            {loading
              ? <Loader2 size={13} className="text-(--text) animate-spin" />
              : <Search size={13} className="text-(--text)" />
            }
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results && setOpen(true)}
            placeholder="Search notes, lectures..."
            className="search-input !pl-9"
          />
          {query ? (
            <button
              onClick={() => { setQuery(''); setResults(null); setOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-faint) hover:text-(--text) transition-colors p-1 rounded-md"
            >
              <X size={12} />
            </button>
          ) : (
            <div
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 select-none pointer-events-none"
            >
              <kbd className="kbd">{isMac ? '⌘' : 'Ctrl'}</kbd>
              <kbd className="kbd">K</kbd>
            </div>
          )}

          {open && results && (
            <div className="absolute top-full mt-2 w-full bg-(--surface-elevated) border border-(--border) rounded-lg shadow-lg z-50 overflow-hidden animate-scale-in">
              {results.totalResults === 0 ? (
                <p className="text-center text-(--text-faint) text-[13px] py-6">
                  No results for "{query}"
                </p>
              ) : (
                <div className="p-1.5">
                  {results.subjects?.length > 0 && (
                    <div className="mb-1">
                      <p className="px-3 py-1.5 text-[10.5px] font-semibold text-(--text-faint) uppercase tracking-wider">Subjects</p>
                      {results.subjects.map(s => (
                        <button
                          key={s._id}
                          onClick={() => go(`/lectures/${s._id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-(--surface-hover) transition-colors text-left"
                        >
                          <BookOpen size={14} className="text-(--text-dim) shrink-0" />
                          <span className="text-[13px] text-(--text) truncate">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.lectures?.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[10.5px] font-semibold text-(--text-faint) uppercase tracking-wider">Lectures</p>
                      {results.lectures.slice(0, 6).map(l => (
                        <button
                          key={l._id}
                          onClick={() => go(`/editor/${l._id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-(--surface-hover) transition-colors text-left"
                        >
                          <FileText size={14} className="text-(--text-dim) shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] text-(--text) truncate">{l.title?.trim() || `Lecture ${l.lectureNumber}`}</p>
                            <p className="text-[11px] text-(--text-faint) truncate">{l.subjectName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {rightContent && <div className="flex items-center gap-2 shrink-0">{rightContent}</div>}
    </header>
  );
};

export default Topbar;
