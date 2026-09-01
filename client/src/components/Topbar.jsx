import { useState, useRef, useEffect } from 'react';
import { Search, Loader2, FileText, X, Sun, Moon, KeySquare, CloudUpload, LogOut, User } from 'lucide-react';
import { BrandLockup } from './Brand';
import { searchAll } from '../services/lectureService';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AISettingsModal from './AISettingsModal';
import GithubSettingsModal from './GithubSettingsModal';

const Topbar = ({ breadcrumb, rightContent, sidebarCollapsed, onToggleSidebar }) => {
  const { user, dbUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [showGithubSettings, setShowGithubSettings] = useState(false);

  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const displayName = dbUser?.name || user?.displayName || 'Student';
  const email = user?.email || dbUser?.email || '';
  const photo = user?.photoURL || dbUser?.avatar || '';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.trim().length < 2) { setResults(null); setOpenSearch(false); return; }
    try {
      setLoading(true);
      const data = await searchAll(val);
      setResults(data);
      setOpenSearch(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const go = (path) => {
    setQuery(''); setResults(null); setOpenSearch(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setOpenSearch(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuClick = () => {
    // On mobile (<1024px) toggle mobile overlay; on desktop toggle collapse
    if (window.innerWidth < 1024) {
      window.dispatchEvent(new Event('toggleMobileSidebar'));
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <>
      <header className="topbar">
        {/* Left: Brand Logo & Nav */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <button
            onClick={handleMenuClick}
            className={`${sidebarCollapsed ? '' : 'lg:hidden '}btn-ghost p-1.5 rounded-md text-(--text-dim)`}
            aria-label="Toggle navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity">
            <BrandLockup size={26} />
          </Link>

          {breadcrumb && (
            <div className="hidden sm:flex items-center gap-2 text-[13.5px] text-(--text-dim) font-medium border-l border-(--border-subtle) pl-4">
              {breadcrumb}
            </div>
          )}
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center max-w-md mx-4" ref={searchRef}>
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              {loading
                ? <Loader2 size={13} className="text-(--text) animate-spin" />
                : <Search size={13} className="text-(--text)" />
              }
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => results && setOpenSearch(true)}
              placeholder="Search notes, lectures..."
              className="search-input !pl-9"
            />
            {query ? (
              <button
                onClick={() => { setQuery(''); setResults(null); setOpenSearch(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-faint) hover:text-(--text) transition-colors p-1 rounded-md"
              >
                <X size={12} />
              </button>
            ) : (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-40 select-none pointer-events-none">
                <kbd className="kbd">{isMac ? '⌘' : 'Ctrl'}</kbd>
                <kbd className="kbd">K</kbd>
              </div>
            )}

            {/* Search Dropdown Results */}
            {openSearch && results && (
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

        {/* Right: Extra Content & Profile Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          {rightContent}

          {/* Profile Button */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(prev => !prev)}
              className="rounded-full hover:ring-2 hover:ring-(--border) transition-all"
              aria-label="User Menu"
            >
              {photo ? (
                <img
                  src={photo}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-white text-[11px] font-bold">
                  {initials}
                </div>
              )}
            </button>            {/* Profile Dropdown Menu */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-64 bg-(--surface-elevated) border border-(--border-strong) rounded-xl shadow-xl z-[100] p-2 animate-scale-in">
                {/* User Info Header */}
                <div className="flex items-center gap-2.5 p-2.5 border border-(--border-subtle) mb-1.5 bg-(--surface-hover)/60 rounded-lg">
                  {photo ? (
                    <img
                      src={photo}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-(--border)"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-(--text) truncate leading-tight">{displayName}</p>
                    <p className="text-[11px] text-(--text-dim) truncate mt-0.5">{email}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="flex flex-col gap-0.5">
                  {/* Option 1: Light / Dark Mode */}
                  <button
                    onClick={() => { toggleTheme(); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-(--text) hover:bg-(--surface-hover) rounded-lg transition-colors text-left"
                  >
                    {theme === 'dark' ? (
                      <Sun size={15} className="text-(--accent-text) shrink-0" />
                    ) : (
                      <Moon size={15} className="text-(--accent-text) shrink-0" />
                    )}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  {/* Option 1b: Profile */}
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-(--text) hover:bg-(--surface-hover) rounded-lg transition-colors text-left"
                  >
                    <User size={15} className="text-(--text-dim) shrink-0" />
                    <span>Profile & AI Settings</span>
                  </button>

                  {/* Option 2: API Key Settings */}
                  <button
                    onClick={() => { setShowAiSettings(true); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-(--text) hover:bg-(--surface-hover) rounded-lg transition-colors text-left"
                  >
                    <KeySquare size={15} className="text-(--text-dim) shrink-0" />
                    <span>API Key Settings</span>
                  </button>

                  {/* Option 3: Push to GitHub */}
                  <button
                    onClick={() => { setShowGithubSettings(true); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-(--text) hover:bg-(--surface-hover) rounded-lg transition-colors text-left"
                  >
                    <CloudUpload size={15} className="text-(--text-dim) shrink-0" />
                    <span>Push to GitHub</span>
                  </button>
                </div>

                <div className="h-px bg-(--border-subtle) my-1" />

                {/* Option 4: Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                >
                  <LogOut size={15} className="shrink-0 text-(--danger)" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      {showAiSettings && <AISettingsModal onClose={() => setShowAiSettings(false)} />}
      <GithubSettingsModal isOpen={showGithubSettings} onClose={() => setShowGithubSettings(false)} />
    </>
  );
};

export default Topbar;
