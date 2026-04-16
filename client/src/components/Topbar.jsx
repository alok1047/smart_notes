import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, FileText, BookOpen, X, Menu } from 'lucide-react';
import { searchAll } from '../services/lectureService';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ onMenuToggle, rightContent, breadcrumb }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

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

  // Close on outside click
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
      {/* Mobile menu */}
      <button
        onClick={onMenuToggle}
        className="btn-ghost md:hidden flex-shrink-0 p-1.5"
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb (left side) */}
      {breadcrumb && (
        <div className="hidden md:flex items-center gap-2 text-[13px] text-[#525252] flex-shrink-0">
          {breadcrumb}
        </div>
      )}

      {/* Search (center) */}
      <div className="flex-1 flex justify-center" data-search-container>
        <div className="relative w-full max-w-md">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {loading
              ? <Loader2 size={14} className="text-[#525252] animate-spin" />
              : <Search size={14} className="text-[#525252]" />
            }
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results && setOpen(true)}
            placeholder="Search notes, lectures…"
            className="search-input"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults(null); setOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#525252] hover:text-[#d4d4d4] transition-colors"
            >
              <X size={12} />
            </button>
          )}

          {/* Dropdown */}
          {open && results && (
            <div className="absolute top-full mt-2 w-full bg-[#151515] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
              {results.totalResults === 0 ? (
                <p className="text-center text-[#525252] text-[13px] py-6">
                  No results for "{query}"
                </p>
              ) : (
                <div className="p-1.5">
                  {results.subjects?.length > 0 && (
                    <div className="mb-1">
                      <p className="px-3 py-1.5 text-[10px] font-semibold text-[#404040] uppercase tracking-widest">Subjects</p>
                      {results.subjects.map(s => (
                        <button
                          key={s._id}
                          onClick={() => go(`/lectures/${s._id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1f1f1f] transition-colors text-left"
                        >
                          <BookOpen size={14} className="text-[#7c3aed] flex-shrink-0" />
                          <span className="text-[13px] text-[#d4d4d4] truncate">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.lectures?.length > 0 && (
                    <div>
                      <p className="px-3 py-1.5 text-[10px] font-semibold text-[#404040] uppercase tracking-widest">Lectures</p>
                      {results.lectures.slice(0, 6).map(l => (
                        <button
                          key={l._id}
                          onClick={() => go(`/editor/${l._id}`)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1f1f1f] transition-colors text-left"
                        >
                          <FileText size={14} className="text-[#525252] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] text-[#d4d4d4] truncate">Lecture {l.lectureNumber}</p>
                            <p className="text-[11px] text-[#525252] truncate">{l.subjectName}</p>
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

      {/* Right slot */}
      {rightContent && <div className="flex items-center gap-2 flex-shrink-0">{rightContent}</div>}
    </header>
  );
};

export default Topbar;
