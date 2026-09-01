import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SubjectCard from '../components/SubjectCard';
import { getSubjects, createSubject, deleteSubject } from '../services/subjectService';
import { getLectures } from '../services/lectureService';
import { useAuth } from '../context/AuthContext';
import { toErrorMessage } from '../utils/errors';
import { SOURCES } from '../utils/inputSources';
import {
  ArrowRight,
  Plus,
  X,
  BookOpen,
  Loader2,
  Trash2,
  FileText,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const EMOJI_POOL = ['📚', '☕', '💡', '🧩', '🔬', '📊', '🎨', '⚡', '🌟', '🎯', '📐', '🧠', '🔧', '🚀', '📖'];
const emojiFor = (name = '') => {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return EMOJI_POOL[hash % EMOJI_POOL.length];
};

const QuickImportModal = ({ source, subjects, onPick, onCreate, onClose }) => {
  const src = SOURCES.find((s) => s.id === source);
  if (!src) return null;
  const Icon = src.icon;

  return (
    <div className="modal-overlay z-[9999]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-scale-in max-w-md">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-(--border-subtle) shadow-sm"
              style={{ background: src.bg }}
            >
              <Icon size={20} color={src.color} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-(--text)">Add {src.title}</h2>
              <p className="text-[12.5px] text-(--text-dim) mt-0.5">{src.description}</p>
              {src.todo && (
                <span className="mt-1.5 inline-block px-1.5 py-0.5 rounded bg-(--surface-hover) text-[9.5px] font-bold uppercase tracking-wide text-(--text-faint)">
                  Soon
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 shrink-0" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wider text-(--text-faint) mb-2">
          Where should it go?
        </p>

        {subjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-(--border-subtle) p-6 text-center">
            <p className="text-[13px] text-(--text-dim)">
              Create a subject first — it gives your material a home.
            </p>
            <button onClick={onCreate} className="btn-primary mt-3 flex items-center gap-1.5 mx-auto">
              <Plus size={14} /> Create subject
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[45vh] overflow-y-auto">
            {subjects.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => onPick(s)}
                className="group flex items-center gap-3 rounded-xl border border-(--border-subtle) bg-(--surface) px-3.5 py-3 text-left hover:border-(--accent-ring) hover:bg-(--surface-hover) transition-colors"
              >
                <span className="text-[17px] shrink-0">{emojiFor(s.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-(--text) truncate">{s.name}</span>
                  <span className="text-[11px] text-(--text-faint)">
                    {s.lectureCount} {s.lectureCount === 1 ? 'lecture' : 'lectures'}
                  </span>
                </span>
                <ChevronRight size={15} className="text-(--text-faint) group-hover:text-(--text-dim) transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { dbUser } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState(() => localStorage.getItem('dashboard-view') || 'grid');
  const [quickImportSource, setQuickImportSource] = useState(null);

  const loadSubjectsWithStats = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getSubjects();
      const withStats = await Promise.all(
        list.map(async (s) => {
          try {
            const { lectures } = await getLectures(s._id);
            const total = s.lectureCount || lectures.length || 1;
            const processed = lectures.filter((l) => l.processedNotes?.trim()).length;
            let concepts = 0;
            for (const l of lectures) {
              const m = (l.processedNotes || '').match(/^#{1,4}\s/gm);
              concepts += m ? m.length : 0;
            }
            const recent = [...lectures].sort(
              (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
            )[0];
            return {
              ...s,
              progress: total ? Math.round((processed / total) * 100) : 0,
              processedCount: processed,
              conceptCount: concepts,
              lastUpdated: recent?.updatedAt || s.updatedAt,
            };
          } catch {
            return { ...s, progress: 0, processedCount: 0, conceptCount: 0, lastUpdated: s.updatedAt };
          }
        })
      );
      setSubjects(withStats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSubjectsWithStats(); }, [loadSubjectsWithStats]);

  useEffect(() => { localStorage.setItem('dashboard-view', view); }, [view]);

  const stats = useMemo(() => {
    const totalLectures = subjects.reduce((sum, s) => sum + (s.lectureCount || 0), 0);
    return { subjects: subjects.length, lectures: totalLectures };
  }, [subjects]);

  const openModal = () => { setForm({ name: '' }); setFormError(''); setShowModal(true); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Subject name is required.'); return; }
    try {
      setCreating(true);
      setFormError('');
      await createSubject(form.name.trim(), 1);
      setShowModal(false);
      loadSubjectsWithStats();
    } catch (err) {
      setFormError(toErrorMessage(err, 'Failed to create subject.'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSubject(deleteTarget.id);
      setDeleteTarget(null);
      loadSubjectsWithStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickImportPick = async (subject) => {
    const source = quickImportSource;
    setQuickImportSource(null);
    try {
      const { lectures } = await getLectures(subject._id);
      const target = lectures?.[0];
      if (target) {
        navigate(`/editor/${target._id}?add=${source}`);
      } else {
        navigate(`/lectures/${subject._id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const fullName = dbUser?.name || '';
  // Extract first name: if name is "User" (literal) or empty, don't show it;
  // otherwise split and take first part
  const firstName = fullName !== 'User' && fullName ? fullName.split(' ')[0] : '';

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onNewSubject={openModal}
      />

      <div className="main-content">
        <Topbar breadcrumb="Dashboard" sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed(c => !c)} />

        <div className="page-scroll">
          <div className="page-container">
            {/* Hero */}
            <div className="mb-12">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-(--accent-text) mb-3">
                    {greeting}{firstName ? `, ${firstName}` : ''}.
                  </p>
                  <h1 className="font-display text-[34px] sm:text-[44px] text-(--text) tracking-tight leading-[1.05]">
                    Your knowledge <em className="text-(--accent-text)">workspace.</em>
                  </h1>
                  <p className="mt-3 text-[14.5px] text-(--text-dim) max-w-xl leading-relaxed">
                    Turn lectures, documents, videos and rough notes into connected, searchable knowledge.
                  </p>
                </div>
                <div className="hidden md:block shrink-0" aria-hidden>
                  <DotLottieReact
                    src="/animations/study-discussion.lottie"
                    loop
                    autoplay
                    style={{ width: 200, height: 200 }}
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-10 gap-y-3 border-y border-(--border-subtle) py-4">
                {[
                  { n: String(stats.subjects).padStart(2, '0'), label: 'Subjects' },
                  { n: String(stats.lectures).padStart(2, '0'), label: 'Lectures' },
                ].map((s) => (
                  <div key={s.label} className="flex items-baseline gap-2">
                    <span className="font-display text-[22px] text-(--text) tabular-nums">{s.n}</span>
                    <span className="text-[10.5px] font-semibold uppercase tracking-wider text-(--text-faint)">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Input system */}
            <div className="mb-14">
              <h2 className="font-display text-[24px] sm:text-[28px] text-(--text) tracking-tight">
                Turn anything into knowledge.
              </h2>
              <p className="mt-1.5 text-[13px] text-(--text-dim)">
                Bring your material in. NotesSync structures the rest.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {SOURCES.map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setQuickImportSource(s.id)}
                      className="group flex items-center gap-3 rounded-xl border border-(--border-subtle) bg-(--surface) px-4 py-3.5 text-left hover:-translate-y-0.5 hover:border-(--accent-ring) hover:shadow-sm transition-all"
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-(--border-subtle) shadow-sm"
                        style={{ background: s.bg }}
                      >
                        <Icon size={17} color={s.color} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-(--text)">{s.title}</span>
                        <span className="block text-[11.5px] text-(--text-faint) truncate">{s.flow}</span>
                      </span>
                      <ArrowRight size={14} className="text-(--text-faint) opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent subjects */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[15px] font-semibold text-(--text)">Recent Subjects</h2>
                <p className="text-[12.5px] text-(--text-dim) mt-0.5">
                  {stats.subjects === 0
                    ? 'Create a subject to start organizing'
                    : `${stats.subjects} subject${stats.subjects === 1 ? '' : 's'} · processing progress`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="pill-tabs">
                  <button onClick={() => setView('grid')} className={`pill-tab ${view === 'grid' ? 'active' : ''}`} aria-label="Grid view">
                    <LayoutGrid size={15} />
                  </button>
                  <button onClick={() => setView('list')} className={`pill-tab ${view === 'list' ? 'active' : ''}`} aria-label="List view">
                    <List size={15} />
                  </button>
                </div>
                <button onClick={openModal} className="btn-primary flex items-center gap-1.5">
                  <Plus size={16} />
                  <span>New Subject</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className={view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-2"}>
                {[...Array(view === 'grid' ? 6 : 4)].map((_, i) => (
                  <div key={i} className="skeleton rounded-lg" style={{ height: view === 'grid' ? '150px' : '52px' }} />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4 border border-dashed border-(--border-subtle) rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-(--surface-hover) flex items-center justify-center">
                  <BookOpen size={22} className="text-(--text-dim)" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-(--text) mb-1">No subjects yet</h3>
                  <p className="text-[13.5px] text-(--text-dim) max-w-sm mx-auto">
                    Create your first subject and turn any lecture material into searchable knowledge.
                  </p>
                </div>
                <button onClick={openModal} className="btn-primary flex items-center gap-1.5">
                  <Plus size={16} />
                  <span>Create Subject</span>
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map(s => (
                  <SubjectCard
                    key={s._id}
                    subject={s}
                    progress={s.progress}
                    processedCount={s.processedCount}
                    conceptCount={s.conceptCount}
                    lastUpdated={s.lastUpdated}
                    onDelete={(id, name) => setDeleteTarget({ id, name })}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {subjects.map(s => (
                  <SubjectCard
                    key={s._id}
                    subject={s}
                    variant="list"
                    progress={s.progress}
                    processedCount={s.processedCount}
                    conceptCount={s.conceptCount}
                    lastUpdated={s.lastUpdated}
                    onDelete={(id, name) => setDeleteTarget({ id, name })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {quickImportSource && (
        <QuickImportModal
          source={quickImportSource}
          subjects={subjects}
          onPick={handleQuickImportPick}
          onCreate={() => { setQuickImportSource(null); openModal(); }}
          onClose={() => setQuickImportSource(null)}
        />
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal animate-scale-in">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-[16px] font-semibold text-(--text)">New subject</h2>
                <p className="text-[13px] text-(--text-dim) mt-1">Organize lectures in a subject.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="mb-6">
                <label className="block text-[13px] font-medium text-(--text-dim) mb-1.5">
                  Subject name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="input"
                  autoFocus
                />
                <p className="text-[12px] text-(--text-faint) mt-2 flex items-center gap-1.5">
                  <FileText size={12} />
                  A subject starts with 1 lecture — add more anytime.
                </p>
              </div>

              {formError && (
                <div className="mb-5 p-3 rounded-md bg-(--danger-soft) border border-(--danger-border) flex items-center gap-2">
                  <p className="text-[13px] text-(--danger) font-medium">{formError}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-(--border-subtle)">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? 'Creating...' : 'Create subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal animate-scale-in max-w-sm">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-(--danger-soft) flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-(--danger)" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-(--text) mb-1">Delete subject?</h3>
                <p className="text-[13px] text-(--text-dim)">
                  This will permanently delete "{deleteTarget.name}" and all its lectures. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger flex items-center gap-1.5">
                <Trash2 size={14} />
                Delete Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
