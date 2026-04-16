import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import SubjectCard from '../components/SubjectCard';
import { getSubjects, createSubject, deleteSubject } from '../services/subjectService';
import { Plus, X, BookOpen, Loader2, Trash2 } from 'lucide-react';

const DashboardPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', lectureCount: 5 });
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

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
          breadcrumb={<span className="text-[#e5e5e5] font-semibold">Dashboard</span>}
        />

        <div className="page-scroll">
          <div className="max-w-6xl mx-auto px-8 py-10 md:px-10 lg:px-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-10 animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold text-[#f5f5f5] tracking-tight">My Subjects</h1>
                <p className="text-[14px] text-[#525252] mt-2">
                  {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}
                </p>
              </div>
              <button onClick={openModal} className="btn-primary">
                <Plus size={16} />
                New Subject
              </button>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton h-44 rounded-xl" />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#1f1f1f] flex items-center justify-center mb-5">
                  <BookOpen size={28} className="text-[#404040]" />
                </div>
                <h2 className="text-[18px] font-bold text-[#525252] mb-2">No subjects yet</h2>
                <p className="text-[13px] text-[#404040] mb-6 max-w-xs">
                  Create your first subject to start organizing your lecture notes with AI.
                </p>
                <button onClick={openModal} className="btn-primary">
                  <Plus size={16} />
                  Create First Subject
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 stagger">
                {subjects.map(s => (
                  <SubjectCard key={s._id} subject={s} onDelete={(id, name) => setDeleteTarget({ id, name })} />
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[16px] font-bold text-[#f5f5f5]">Create Subject</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1.5">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-[12px] font-semibold text-[#737373] mb-1.5 uppercase tracking-wide">
                  Subject Name
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
                <label className="block text-[12px] font-semibold text-[#737373] mb-1.5 uppercase tracking-wide">
                  Number of Lectures
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
                <p className="text-[11px] text-[#404040] mt-1.5">
                  {form.lectureCount} empty lecture slots will be created
                </p>
              </div>

              {formError && (
                <p className="text-[13px] text-[#f43f5e] mb-4 animate-fade-in">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 justify-center"
                >
                  {creating && <Loader2 size={14} className="animate-spin" />}
                  {creating ? 'Creating…' : 'Create Subject'}
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
            <div className="w-10 h-10 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/20 flex items-center justify-center mb-4">
              <Trash2 size={18} className="text-[#f43f5e]" />
            </div>
            <h3 className="text-[15px] font-bold text-[#f5f5f5] mb-2">Delete Subject?</h3>
            <p className="text-[13px] text-[#737373] mb-6">
              This will permanently delete <span className="text-[#d4d4d4] font-medium">"{deleteTarget.name}"</span> and all its lectures. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center">
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger flex-1 justify-center">
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
