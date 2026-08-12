import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCommandPalette } from '../context/CommandPaletteContext';
import { getSubjects } from '../services/subjectService';
import { getRecentLectures } from '../services/lectureService';
import {
  Folder,
  FileText,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  Home,
  ChevronDown,
  BookOpen,
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
  const { user } = useAuth();
  const { toggle: toggleCmdk } = useCommandPalette();
  const navigate = useNavigate();
  const location = useLocation();

  const [subjects, setSubjects] = useState([]);
  const [recentLectures, setRecentLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subData, recData] = await Promise.all([
        getSubjects().catch(() => []),
        getRecentLectures().catch(() => []),
      ]);
      setSubjects(subData);
      setRecentLectures(recData);
    } catch (e) {
      console.error('Sidebar fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [location.pathname]);

  useEffect(() => {
    const handleRefresh = () => fetchData();
    window.addEventListener('refreshSidebar', handleRefresh);
    return () => window.removeEventListener('refreshSidebar', handleRefresh);
  }, []);

  const toggleExpand = (subId, e) => {
    e.stopPropagation();
    setExpandedSubjects(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3.5 h-13 border-b border-(--border-subtle) shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#2383e2] flex items-center justify-center shrink-0 text-white shadow-sm">
            <BookOpen size={15} />
          </div>
          {!collapsed && (
            <span className="text-[14 font-semibold text-(--text) tracking-tight truncate">
              SmartNotes
            </span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="btn-ghost p-1 shrink-0 text-(--text-dim) hover:text-(--text)"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="px-3 pt-3 pb-2 shrink-0 flex flex-col gap-1.5">
        {!collapsed ? (
          <>
            <button
              onClick={onNewSubject}
              className="w-full h-9 flex items-center gap-2 px-3 bg-[#2383e2] hover:bg-[#1b6ec2] text-white font-medium text-[13px] rounded-lg transition-colors shadow-sm"
            >
              <Plus size={15} />
              <span>New Subject</span>
            </button>

            <button
              onClick={toggleCmdk}
              className="w-full h-8.5 flex items-center justify-between px-3 bg-(--surface) hover:bg-(--surface-hover) border border-(--border-subtle) rounded-lg text-[12.5px] text-(--text-dim) transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Search size={13} className="text-(--text-faint) group-hover:text-(--text-dim)" />
                <span>Search notes...</span>
              </div>
              <kbd className="kbd text-[10px]">⌘K</kbd>
            </button>
          </>
        ) : (
          <button
            onClick={onNewSubject}
            className="w-full h-9 flex items-center justify-center bg-[#2383e2] hover:bg-[#1b6ec2] text-white rounded-lg"
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
            <p className="px-2 pb-1.5 text-[10px] font-bold text-(--text-faint) uppercase tracking-wider">
              Navigation
            </p>
          )}
          <Link
            to="/dashboard"
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
              location.pathname === '/dashboard'
                ? 'bg-[#2383e2]/15 text-[#529CCA]'
                : 'text-(--text-dim) hover:bg-(--surface-hover) hover:text-(--text)'
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
              <span className="text-[10px] font-bold text-(--text-faint) uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={11} className="text-[#2383e2]" />
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
                  onClick={() => navigate(`/editor/${lec._id}`)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    active
                      ? 'bg-[#2383e2]/20 text-[#529CCA] font-semibold'
                      : 'text-(--text-dim) hover:bg-(--surface-hover) hover:text-(--text)'
                  }`}
                  title={collapsed ? (lec.title || `Lecture ${lec.lectureNumber}`) : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isProcessed ? (
                      <Sparkles size={13} className="shrink-0 text-blue-400" />
                    ) : (
                      <FileText size={13} className="shrink-0 text-(--text-faint)" />
                    )}
                    {!collapsed && (
                      <span className="text-[12.5px] truncate">
                        {lec.title?.trim() || `Lecture ${lec.lectureNumber}`}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <span className="text-[10.5px] text-(--text-faint) shrink-0">
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
              <span className="text-[10px] font-bold text-(--text-faint) uppercase tracking-wider flex items-center gap-1.5">
                <Folder size={11} className="text-(--text-faint)" />
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
                    onClick={() => navigate(`/lectures/${s._id}`)}
                    className={`group w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#2383e2]/15 text-[#529CCA] font-semibold'
                        : 'text-(--text-dim) hover:bg-(--surface-hover) hover:text-(--text)'
                    }`}
                    title={collapsed ? s.name : undefined}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder size={13.5} className="shrink-0 text-(--text-faint) group-hover:text-[#529CCA]" />
                      {!collapsed && (
                        <span className="text-[12.5px] truncate">
                          {s.name}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <span className="text-[10.5px] text-(--text-faint) shrink-0">
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
  );
};

export default Sidebar;
