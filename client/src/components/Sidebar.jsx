import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCommandPalette } from '../context/CommandPaletteContext';
import {
  LayoutDashboard, BookOpen, Lightbulb, Plus, ChevronLeft,
  ChevronRight, LogOut, Sparkles, CloudUpload, Sun, Moon, Search, Home
} from 'lucide-react';
import AISettingsModal from './AISettingsModal';
import GithubSettingsModal from './GithubSettingsModal';

const Sidebar = ({ collapsed, onToggle, onNewSubject }) => {
  const { user, dbUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toggle: toggleCmdk } = useCommandPalette();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showGithubSettings, setShowGithubSettings] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, path: '/dashboard' },
    { id: 'revision', label: 'Revision Mode', icon: Lightbulb, path: '/revision' },
  ];

  const isActive = (path, id) => {
    if (id === 'revision') return location.pathname === '/revision';
    if (id === 'subjects') return location.pathname.startsWith('/lectures') || location.pathname.startsWith('/editor');
    return location.pathname === path;
  };

  const displayName = dbUser?.name || user?.displayName || 'Student';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo header */}
      <div className="flex items-center gap-2.5 px-4 h-13 border-b border-(--border-subtle) shrink-0">
        <div className="w-7 h-7 rounded-md bg-(--accent) flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-[13.5px] font-semibold text-(--text) tracking-tight flex-1 truncate">
            SmartNotes
          </span>
        )}
        <button
          onClick={onToggle}
          className="btn-ghost p-1 shrink-0"
          data-tooltip={collapsed ? 'Expand' : undefined}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-4 pb-2 shrink-0">
        {!collapsed ? (
          <button onClick={toggleCmdk} className="sidebar-search flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <Search size={14} className="text-(--text-faint) group-hover:text-(--text-dim) transition-colors" />
              <span className="text-[13px]">Search...</span>
            </div>
            <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-all">
              <kbd className="kbd">⌘</kbd>
              <kbd className="kbd">K</kbd>
            </div>
          </button>
        ) : (
          <button
            onClick={toggleCmdk}
            className="btn-ghost w-full justify-center p-2 rounded-lg"
            data-tooltip="Search (⌘K)"
          >
            <Search size={15} />
          </button>
        )}
      </div>

      {/* New Subject CTA */}
      <div className="px-3 pt-1.5 pb-2 shrink-0">
        <button
          onClick={onNewSubject}
          className={`sidebar-cta ${collapsed ? 'sidebar-cta-collapsed' : ''}`}
          data-tooltip={collapsed ? 'New Subject' : undefined}
        >
          <Plus size={14} strokeWidth={2} className="shrink-0" />
          {!collapsed && <span>New Subject</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-2 pb-3 flex flex-col gap-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 pt-4 pb-2 text-[10px] font-bold text-(--text-faint) uppercase tracking-[0.1em]">
            Workspace
          </p>
        )}
        {navItems.map(({ id, label, icon: Icon, path }) => {
          const active = isActive(path, id);
          return (
            <Link
              key={id}
              to={path}
              className={`nav-item ${active ? 'active' : ''} h-9 px-3 rounded-lg flex items-center gap-2.5 transition-all duration-200`}
              data-tooltip={collapsed ? label : undefined}
            >
              <Icon size={16} className="shrink-0" strokeWidth={active ? 2.25 : 1.75} />
              {!collapsed && <span className="truncate text-[13.5px] font-medium">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="mt-auto border-t border-(--border-subtle) p-3 shrink-0">
        {!collapsed ? (
          <div className="rounded-xl bg-(--bg-subtle) border border-(--border-subtle) p-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-8 h-8 rounded-full shrink-0 object-cover border border-(--border-subtle)"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center shrink-0 text-white text-[11px] font-bold">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-(--bg-subtle) rounded-full" title="Online" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-(--text) truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-(--text-faint) truncate mt-0.5 font-medium">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <button onClick={toggleTheme} className="btn-ghost h-8 p-0 flex items-center justify-center rounded-md" title="Theme">
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button onClick={() => setShowSettings(true)} className="btn-ghost h-8 p-0 flex items-center justify-center rounded-md" title="Settings">
                <Sparkles size={14} />
              </button>
              <button onClick={() => setShowGithubSettings(true)} className="btn-ghost h-8 p-0 flex items-center justify-center rounded-md" title="Sync">
                <CloudUpload size={14} />
              </button>
              <button onClick={handleLogout} className="btn-ghost h-8 p-0 flex items-center justify-center rounded-md text-(--danger)" title="Logout">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover border border-(--border-subtle)" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-(--accent) flex items-center justify-center text-white text-[11px] font-bold">
                {initials}
              </div>
            )}
            <div className="w-full h-px bg-(--border-subtle) my-1" />
            <button onClick={handleLogout} className="btn-ghost p-2 rounded-lg text-(--danger)" data-tooltip="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>

      {showSettings && <AISettingsModal onClose={() => setShowSettings(false)} />}
      <GithubSettingsModal isOpen={showGithubSettings} onClose={() => setShowGithubSettings(false)} />
    </aside>
  );
};

export default Sidebar;
