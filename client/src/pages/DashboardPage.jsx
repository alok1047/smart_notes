import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SubjectCard from '../components/SubjectCard';
import { getSubjects, createSubject, deleteSubject } from '../services/subjectService';
import { Plus, X, BookOpen, Loader2, Trash2, FileText, LayoutGrid, List } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', lectureCount: 5 });
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [view, setView] = useState(() => localStorage.getItem('dashboard-view') || 'grid');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setSubjects(await getSubjects());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

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
      fetchDashboardData();
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
      fetchDashboardData();
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

      <div className="main-content">
        <Topbar breadcrumb="Dashboard" />

        <div className="page-scroll">
          <div className="page-container">
            {/* Header Greeting */}
            <div className="mb-6">
              <h1 className="text-[26px] font-bold text-(--text) tracking-tight">{greeting}</h1>
              <p className="text-[13px] text-(--text-dim) mt-1">
                {stats.subjects} {stats.subjects === 1 ? 'subject' : 'subjects'} · {stats.lectures} {stats.lectures === 1 ? 'lecture' : 'lectures'}
              </p>
            </div>

            {/* My Workspace Section */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[15px] font-semibold text-(--text)">My Workspace</h2>
                <p className="text-[13px] text-(--text-dim) mt-0.5">
                  Manage your subjects and lecture notes
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="pill-tabs">
                  <button onClick={() => setView('grid')} className={`pill-tab ${view === 'grid' ? 'active' : ''}`}>
                    <LayoutGrid size={15} />
                  </button>
                  <button onClick={() => setView('list')} className={`pill-tab ${view === 'list' ? 'active' : ''}`}>
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
                      <div key={i} className="skeleton rounded-lg" style={{ height: view === 'grid' ? '120px' : '52px' }} />
                    ))}
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-(--border-subtle) rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-(--surface-hover) flex items-center justify-center mb-2">
                      <BookOpen size={24} className="text-(--text-dim)" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-(--text) mb-1">No subjects yet</h3>
                    <p className="text-[14px] text-(--text-dim) mb-4 max-w-sm">Create your first subject to start organizing your lectures.</p>
                    <button onClick={openModal} className="btn-primary flex items-center gap-1.5">
                      <Plus size={16} />
                      <span>Create Subject</span>
                    </button>
                  </div>
                ) : view === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map(s => (
                      <SubjectCard key={s._id} subject={s} onDelete={(id, name) => setDeleteTarget({ id, name })} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {subjects.map(s => (
                      <SubjectCard key={s._id} subject={s} variant="list" onDelete={(id, name) => setDeleteTarget({ id, name })} />
                    ))}
                  </div>
                )}
          </div>
        </div>
      </div>

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
              <div className="mb-4">
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
              </div>

              <div className="mb-6">
                <label className="block text-[13px] font-medium text-(--text-dim) mb-1.5">
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
                <p className="text-[12px] text-(--text-faint) mt-2 flex items-center gap-1.5">
                  <FileText size={12} />
                  {form.lectureCount} empty lecture {form.lectureCount === 1 ? 'slot' : 'slots'} will be created.
                </p>
              </div>

              {formError && (
                <div className="mb-5 p-3 rounded-md bg-(--danger-soft) border border-(--danger-border) flex items-center gap-2">
                  <p className="text-[13px] text-(--danger) font-medium">{formError}</p>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-(--border-subtle)">
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
                  className="btn-primary flex items-center gap-2"
                >
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
