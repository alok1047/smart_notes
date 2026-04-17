import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Zap, Plus, ChevronLeft,
  ChevronRight, GraduationCap, LogOut, Settings, Sparkles, CloudUpload
} from 'lucide-react';
import AISettingsModal from './AISettingsModal';
import GithubSettingsModal from './GithubSettingsModal';

const Sidebar = ({ collapsed, onToggle, onNewSubject }) => {
  const { user, dbUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [showGithubSettings, setShowGithubSettings] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'revision', label: 'Revision Mode', icon: Zap, path: '/revision' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const displayName = dbUser?.name || user?.displayName || 'Student';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-5 mt-2 border-b border-[#1f1f1f]">
        <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
          <GraduationCap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-[14px] font-bold text-white tracking-tight">SmartNotes</span>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-md text-[#525252] hover:text-[#d4d4d4] hover:bg-[#1f1f1f] transition-colors flex-shrink-0"
          data-tooltip={collapsed ? 'Expand' : undefined}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 flex flex-col gap-2 overflow-hidden">
        {navItems.map(({ id, label, icon: Icon, path }) => (
          <Link
            key={id}
            to={path}
            className={`nav-item ${isActive(path) ? 'active' : ''}`}
            data-tooltip={collapsed ? label : undefined}
          >
            <Icon size={16} className="nav-icon" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        <div className="divider mt-2" />

        {/* New Subject Button */}
        <button
          onClick={onNewSubject}
          className={`nav-item w-full text-left ${collapsed ? 'justify-center' : ''}`}
          data-tooltip={collapsed ? 'New Subject' : undefined}
          style={{ color: '#a78bfa' }}
        >
          <Plus size={16} className="nav-icon flex-shrink-0" style={{ color: '#a78bfa' }} />
          {!collapsed && <span>New Subject</span>}
        </button>

        {/* Subjects label */}
        {!collapsed && (
          <div className="px-3 pt-4 pb-2">
            <p className="text-[10px] font-semibold text-[#404040] uppercase tracking-widest">
              Navigation
            </p>
          </div>
        )}

        <Link
          to="/dashboard"
          className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
          data-tooltip={collapsed ? 'Subjects' : undefined}
          style={{ paddingLeft: '18px' }}
        >
          <BookOpen size={16} className="nav-icon" />
          {!collapsed && <span>Subjects</span>}
        </Link>
      </nav>

      {/* User section */}
      <div className="border-t border-[#1f1f1f] p-2">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${!collapsed ? 'hover:bg-[#1f1f1f]' : ''} transition-colors`}>
          {/* Avatar */}
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-7 h-7 rounded-full flex-shrink-0 border border-[#2a2a2a]"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#7c3aed] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              {initials}
            </div>
          )}
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-[#d4d4d4] truncate">{displayName}</p>
              <p className="text-[10px] text-[#525252] truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-md text-[#525252] hover:text-[#d4d4d4] hover:bg-[#1f1f1f] transition-colors"
                title="AI Settings"
              >
                <Sparkles size={14} />
              </button>
              <button
                onClick={() => setShowGithubSettings(true)}
                className="p-1.5 rounded-md text-[#525252] hover:text-[#d4d4d4] hover:bg-[#1f1f1f] transition-colors"
                title="GitHub Settings"
              >
                <CloudUpload size={14} />
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[#525252] hover:text-[#f43f5e] hover:bg-[#1f1f1f] transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
        {collapsed && (
          <div className="flex flex-col gap-1 mt-1">
            <button
              onClick={() => setShowSettings(true)}
              className="btn-ghost w-full justify-center text-[#525252] hover:text-[#d4d4d4]"
              data-tooltip="AI Settings"
            >
              <Sparkles size={14} />
            </button>
            <button
              onClick={() => setShowGithubSettings(true)}
              className="btn-ghost w-full justify-center text-[#525252] hover:text-[#d4d4d4]"
              data-tooltip="GitHub Settings"
            >
              <CloudUpload size={14} />
            </button>
            <button
              onClick={handleLogout}
              className="btn-ghost w-full justify-center text-[#525252] hover:text-[#f43f5e]"
              data-tooltip="Sign out"
            >
              <LogOut size={14} />
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
