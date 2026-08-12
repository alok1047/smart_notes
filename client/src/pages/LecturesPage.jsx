import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import LectureItem from '../components/LectureItem';
import { getLectures, addLecture, deleteLecture, updateLectureTitle } from '../services/lectureService';
import { ArrowLeft, BookOpen, CheckCircle2, Edit3, Circle, Plus, Loader2, MessageCircle } from 'lucide-react';
import NotesChat from '../components/NotesChat';

const LecturesPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingLecture, setAddingLecture] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getLectures(subjectId);
        setSubject(data.subject);
        setLectures(data.lectures);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 404) navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [subjectId, navigate]);

  const handleAddLecture = async () => {
    try {
      setAddingLecture(true);
      const newLec = await addLecture(subjectId);
      setLectures(prev => [...prev, newLec]);
    } catch (e) {
      console.error(e);
      alert('Failed to add blank lecture.');
    } finally {
      setAddingLecture(false);
    }
  };

  const handleDeleteLecture = async (lecId) => {
    if (!window.confirm("Delete this lecture? Any AI-generated notes will be lost forever.")) return;
    try {
      await deleteLecture(lecId);
      setLectures(prev => prev.filter(l => l._id !== lecId));
    } catch (e) {
      console.error(e);
      alert('Failed to delete lecture.');
    }
  };

  const handleUpdateTitle = async (lecId, newTitle) => {
    try {
      await updateLectureTitle(lecId, newTitle);
      setLectures(prev => prev.map(l => l._id === lecId ? { ...l, title: newTitle } : l));
    } catch (e) {
      console.error(e);
      alert('Failed to save title update.');
    }
  };

  const processed = lectures.filter(l => l.processedNotes?.trim()).length;
  const inProgress = lectures.filter(l => l.rawNotes?.trim() && !l.processedNotes?.trim()).length;
  const notStarted = lectures.length - processed - inProgress;
  const pct = lectures.length > 0 ? Math.round((processed / lectures.length) * 100) : 0;

  const breadcrumb = (
    <div className="flex items-center gap-2 min-w-0">
      <button
        onClick={() => navigate('/dashboard')}
        className="btn-ghost px-2 py-1 shrink-0"
      >
        <ArrowLeft size={13} />
        <span className="text-[13px]">Subjects</span>
      </button>
      <span className="text-(--text-faint)">/</span>
      <span className="text-(--text) font-medium text-[13px] truncate max-w-50">
        {subject?.name || '...'}
      </span>
    </div>
  );

  return (
    <div className="app-layout">
      <div className="main-content">
        <Topbar breadcrumb={breadcrumb} />

        <div className="page-scroll">
          <div className="page-container max-w-4xl">
            {loading ? (
              <div className="space-y-4">
                <div className="skeleton h-8 w-64 rounded-md mb-6" />
                <div className="grid grid-cols-4 gap-3 mb-8">
                  {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
                </div>
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-14 rounded-lg mb-2" />)}
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Subject header */}
                <div className="mb-7">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-md bg-(--bg-subtle) border border-(--border-subtle) flex items-center justify-center shrink-0">
                      <BookOpen size={16} className="text-(--text-dim)" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="page-title truncate">{subject?.name}</h1>
                      <p className="page-subtitle">
                        {lectures.length} {lectures.length === 1 ? 'lecture' : 'lectures'} · {pct}% complete
                      </p>
                    </div>
                    <button
                      onClick={() => setIsChatOpen(true)}
                      className="btn-primary"
                    >
                      <MessageCircle size={16} />
                      <span className="hidden sm:inline">Chat with Notes</span>
                    </button>
                  </div>
                </div>
           <br></br>
                {/* Stats strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <div className="stat-card">
                    <div className="stat-card-label flex items-center gap-1.5">
                      <CheckCircle2 size={11} className="text-(--success)" />
                      Processed
                    </div>
                    <div className="stat-card-value">{processed}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label flex items-center gap-1.5">
                      <Edit3 size={11} className="text-(--warning)" />
                      Draft
                    </div>
                    <div className="stat-card-value">{inProgress}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label flex items-center gap-1.5">
                      <Circle size={11} className="text-(--text-faint)" />
                      Empty
                    </div>
                    <div className="stat-card-value">{notStarted}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-card-label">Completion</div>
                    <div className="stat-card-value">{pct}%</div>
                  </div>
                </div>

                <br></br>
                {/* Lectures list */}
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-[12px] font-semibold text-(--text-dim) uppercase tracking-wider">
                    Lectures
                  </h2>
                </div>

          <div className="lecture-list flex flex-col gap-4">
  {lectures.map(l => (
    <LectureItem
      key={l._id}
      lecture={l}
      onDelete={() => handleDeleteLecture(l._id)}
      onUpdateTitle={(title) => handleUpdateTitle(l._id, title)}
    />
  ))}

  <button
    onClick={handleAddLecture}
    disabled={addingLecture}
    className="btn-dashed"
  >
    {addingLecture ? (
      <Loader2 size={14} className="animate-spin" />
    ) : (
      <Plus size={14} />
    )}

    <span>
      {addingLecture
        ? 'Adding lecture...'
        : 'Add blank lecture'}
    </span>
  </button>
</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <NotesChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        subjectId={subjectId} 
      />
    </div>
  );
};

export default LecturesPage;
