import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCommandPalette } from '../context/CommandPaletteContext';
import { getSubjects } from '../services/subjectService';
import { getRecentLectures } from '../services/lectureService';
import { BrandLockup } from './Brand';
import {
  Clock,
  Folder,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Home,
} from 'lucide-react';

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24 && date.getDate() === now.getDate()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Sidebar = ({ collapsed, onToggle, onNewSubject }) => {
  const { toggle: toggleCmdk } = useCommandPalette();
  const navigate = useNavigate();
  const location = useLocation();

  const [subjects, setSubjects] = useState([]);
  const [recentLectures, setRecentLectures] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const fetchData = async () => {
    try {
      const [subData, recData] = await Promise.all([
        getSubjects().catch(() => []),
        getRecentLectures().catch(() => []),
      ]);
      setSubjects(subData);
      setRecentLectures(recData);
    } catch (e) {
      console.error('Sidebar fetch error:', e);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [subData, recData] = await Promise.all([
          getSubjects().catch(() => []),
          getRecentLectures().catch(() => []),
        ]);
        if (!active) return;
        setSubjects(subData);
        setRecentLectures(recData);
      } catch (e) {
        console.error('Sidebar fetch error:', e);
      }
    })();
    return () => { active = false; };
  }, [location.pathname]);

  useEffect(() => {
    const handleRefresh = () => fetchData();
    const handleMobileToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('refreshSidebar', handleRefresh);
    window.addEventListener('toggleMobileSidebar', handleMobileToggle);
    return () => {
      window.removeEventListener('refreshSidebar', handleRefresh);
      window.removeEventListener('toggleMobileSidebar', handleMobileToggle);
    };
  }, []);

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-backdrop" onClick={closeMobile} aria-hidden="true" />
      )}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-13 border-b border-(--sidebar-border) shrink-0">
        <Link to="/dashboard" className="min-w-0" aria-label="NotesSync dashboard" onClick={closeMobile}>
          <BrandLockup size={26} wordmarkClassName="text-(--sidebar-text)" />
        </Link>
        <button
          onClick={onToggle}
          className="btn-ghost p-1 shrink-0 text-(--sidebar-text-faint) hover:text-(--sidebar-text)"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Actions */}
      <div className="px-3.5 pt-4 pb-3 shrink-0 flex flex-col gap-2">
        {!collapsed ? (
          <>
            <button
              onClick={onNewSubject}
              className="w-full h-9.5 flex items-center justify-center gap-2 rounded-xl bg-(--sidebar-accent) hover:bg-[var(--sidebar-accent-text)] text-(--sidebar-bg) font-semibold text-[13px] shadow-sm transition-colors"
            >
              <Plus size={15} />
              <span>New Subject</span>
            </button>

            <button
              onClick={toggleCmdk}
              className="w-full h-8 flex items-center justify-between px-3 bg-transparent hover:bg-(--sidebar-surface-hover) border border-(--sidebar-border) rounded-lg text-[12.5px] text-(--sidebar-text-dim) transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="text-(--sidebar-text-faint) group-hover:text-(--sidebar-text-dim)" />
                <span>Search notes…</span>
              </div>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-(--sidebar-surface-hover) border border-(--sidebar-border) text-(--sidebar-text-faint)">⌘K</kbd>
            </button>
          </>
        ) : (
          <button
            onClick={onNewSubject}
            className="w-full h-9 flex items-center justify-center bg-(--sidebar-accent) hover:bg-[var(--sidebar-accent-text)] text-(--sidebar-bg) rounded-xl"
            title="New Subject"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Main Scrollable Nav */}
      <div className="flex-1 px-2.5 py-2 overflow-y-auto flex flex-col gap-4">
        {/* Navigation Section */}
        <div>
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[10px] font-bold text-(--sidebar-text-faint) uppercase tracking-wider">
              Navigation
            </p>
          )}
          <Link
            to="/dashboard"
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              location.pathname === '/dashboard'
                ? 'bg-(--sidebar-accent-soft) text-(--sidebar-accent-text)'
                : 'text-(--sidebar-text-dim) hover:bg-(--sidebar-surface-hover) hover:text-(--sidebar-text)'
            }`}
            title={collapsed ? 'Dashboard' : undefined}
          >
            <Home size={15} className="shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Section 1: RECENTLY MODIFIED */}
        <div>
          {!collapsed && (
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[10px] font-bold text-(--sidebar-text-faint) uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={11} className="text-(--sidebar-accent-text)" />
                Recent Notes
              </span>
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            {recentLectures.slice(0, 5).map(lec => {
              const active = location.pathname === `/editor/${lec._id}`;
              const isProcessed = !!lec.processedNotes?.trim();
              return (
                <button
                  key={lec._id}
                  onClick={() => { closeMobile(); navigate(`/editor/${lec._id}`); }}
                  className={`group w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors ${
                    active
                      ? 'bg-(--sidebar-accent-soft) text-(--sidebar-accent-text) font-medium'
                      : 'text-(--sidebar-text-dim) hover:bg-(--sidebar-surface-hover) hover:text-(--sidebar-text)'
                  }`}
                  title={collapsed ? (lec.title || `Lecture ${lec.lectureNumber}`) : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isProcessed ? 'bg-(--sidebar-accent-text)' : 'bg-(--sidebar-text-faint)'
                      }`}
                    />
                    {!collapsed && (
                      <span className="text-[12.5px] truncate">
                        {lec.title?.trim() || `Lecture ${lec.lectureNumber}`}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <span className="text-[10px] text-(--sidebar-text-faint) shrink-0">
                      {formatRelativeDate(lec.updatedAt)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: PROJECTS / WORKSPACE (Subjects) */}
        <div>
          {!collapsed && (
            <div className="flex items-center justify-between px-2 pb-1.5">
              <span className="text-[10px] font-bold text-(--sidebar-text-faint) uppercase tracking-wider flex items-center gap-1.5">
                <Folder size={11} className="text-(--sidebar-text-faint)" />
                Workspace
              </span>
            </div>
          )}

          <div className="flex flex-col gap-0.5">
            {subjects.map(s => {
              const active = location.pathname === `/lectures/${s._id}`;
              return (
                <div key={s._id} className="flex flex-col">
                  <div
                    onClick={() => { closeMobile(); navigate(`/lectures/${s._id}`); }}
                    className={`group w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-left cursor-pointer transition-colors ${
                      active
                        ? 'bg-(--sidebar-accent-soft) text-(--sidebar-accent-text) font-medium'
                        : 'text-(--sidebar-text-dim) hover:bg-(--sidebar-surface-hover) hover:text-(--sidebar-text)'
                    }`}
                    title={collapsed ? s.name : undefined}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md border border-(--sidebar-border) bg-(--sidebar-surface-hover) flex items-center justify-center text-[10px] font-semibold text-(--sidebar-text-dim) shrink-0 group-hover:text-(--sidebar-accent-text)">
                        {s.name?.[0]?.toUpperCase() || '·'}
                      </span>
                      {!collapsed && (
                        <span className="text-[12.5px] truncate">
                          {s.name}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <span className="text-[10px] text-(--sidebar-text-faint) shrink-0">
                        {s.lectureCount || 0}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;