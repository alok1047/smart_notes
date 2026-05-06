import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SubjectCard from '../components/SubjectCard';
import { getSubjects, createSubject, deleteSubject } from '../services/subjectService';
import { Plus, X, BookOpen, Loader2, Trash2, FileText, LayoutGrid, List } from 'lucide-react';

const DashboardPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', lectureCount: 5 });
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState(() => localStorage.getItem('dashboard-view') || 'grid');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setSubjects(await getSubjects());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  useEffect(() => { localStorage.setItem('dashboard-view', view); }, [view]);

  const stats = useMemo(() => {
    const totalLectures = subjects.reduce((sum, s) => sum + (s.lectureCount || 0), 0);
    return { subjects: subjects.length, lectures: totalLectures };
  }, [subjects]);

  const openModal = () => { setForm({ name: '', lectureCount: 5 }); setFormError(''); setShowModal(true); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Subject name is required.'); return; }
    try {
      setCreating(true);
      setFormError('');
      await createSubject(form.name.trim(), form.lectureCount);
      setShowModal(false);
      fetchSubjects();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create subject.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSubject(deleteTarget.id);
      setDeleteTarget(null);
      fetchSubjects();
    } catch (e) {
      console.error(e);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onNewSubject={openModal}
      />

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar
          onMenuToggle={() => setSidebarCollapsed(c => !c)}
          breadcrumb="Dashboard"
        />

        <div className="page-scroll">
          <div className="page-container">
            {/* Greeting */}
            <div className="pt-2">
              <h1 className="greeting-hero animate-fade-in">{greeting}</h1>
            </div>

            {/* Header */}
            <div className="animate-fade-in mb-8">
              <div className="flex items-end justify-between gap-6 flex-wrap">
                <div>
                  <h2 className="page-title !font-bold">Subjects</h2>
                  <p className="page-subtitle font-medium">
                    <span className="text-(--text-dim)">{stats.subjects} {stats.subjects === 1 ? 'subject' : 'subjects'}</span>
                    <span className="mx-2 text-(--text-faint)">·</span>
                    <span className="text-(--text-dim)">{stats.lectures} {stats.lectures === 1 ? 'lecture' : 'lectures'}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="pill-tabs shadow-sm">
                    <button
                      onClick={() => setView('grid')}
                      className={`pill-tab ${view === 'grid' ? 'active' : ''} p-2`}
                      title="Grid view"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      onClick={() => setView('list')}
                      className={`pill-tab ${view === 'list' ? 'active' : ''} p-2`}
                      title="List view"
                    >
                      <List size={15} />
                    </button>
                  </div>
                  <button onClick={openModal} className="btn-primary !py-2 !px-4 h-10 shadow-lg shadow-teal-500/10 active:scale-95 transition-all">
                    <Plus size={16} strokeWidth={2.5} />
                    <span className="font-bold">New Subject</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className={view === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "flex flex-col gap-2"
              }>
                {[...Array(view === 'grid' ? 8 : 5)].map((_, i) => (
                  <div key={i} className={`skeleton ${view === 'grid' ? 'h-36' : 'h-16'} rounded-lg`} />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up">
                <div className="w-12 h-12 rounded-xl bg-(--bg-subtle) border border-(--border-subtle) flex items-center justify-center mb-5">
                  <BookOpen size={20} className="text-(--text-dim)" strokeWidth={1.75} />
                </div>
                <h2 className="text-[16px] font-semibold text-(--text) mb-2">No subjects yet</h2>
                <p className="text-[13.5px] text-(--text-dim) mb-6 max-w-sm leading-relaxed">
                  Create a subject to organize your lectures and start writing notes.
                </p>
                <button onClick={openModal} className="btn-primary">
                  <Plus size={14} strokeWidth={2} />
                  Create Subject
                </button>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger">
                {subjects.map(s => (
                  <SubjectCard key={s._id} subject={s} onDelete={(id, name) => setDeleteTarget({ id, name })} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 stagger">
                {subjects.map(s => (
                  <SubjectCard key={s._id} subject={s} variant="list" onDelete={(id, name) => setDeleteTarget({ id, name })} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal animate-scale-in">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold text-(--text) leading-tight">Create new subject</h2>
                <p className="text-[12.5px] text-(--text-dim) mt-1">Group related lectures together.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5" aria-label="Close">
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
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
              </div>

              <div className="mb-5">
                <label className="block text-[12px] font-medium text-(--text-dim) mb-1.5">
                  Number of lectures
                </label>
                <input
                  type="number"
                  value={form.lectureCount}
                  onChange={(e) => setForm(f => ({
                    ...f,
                    lectureCount: Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                  }))}
                  min="1" max="100"
                  className="input"
                />
                <p className="text-[11.5px] text-(--text-faint) mt-1.5">
                  {form.lectureCount} empty lecture {form.lectureCount === 1 ? 'slot' : 'slots'} will be created.
                </p>
              </div>

              {formError && (
                <div className="mb-4 px-3 py-2 rounded-md bg-(--danger-soft) border border-transparent animate-fade-in">
                  <p className="text-[12.5px] text-(--danger) font-medium">{formError}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary"
                >
                  {creating && <Loader2 size={13} className="animate-spin" />}
                  {creating ? 'Creating...' : 'Create subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal animate-scale-in max-w-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-(--danger-soft) flex items-center justify-center shrink-0">
                <Trash2 size={16} className="text-(--danger)" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14.5px] font-semibold text-(--text) mb-1">Delete subject?</h3>
                <p className="text-[12.5px] text-(--text-dim) leading-relaxed">
                  This will permanently delete "{deleteTarget.name}" and all its lectures. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger">
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
