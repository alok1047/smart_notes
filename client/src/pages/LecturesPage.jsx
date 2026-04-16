import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import LectureItem from '../components/LectureItem';
import { getLectures } from '../services/lectureService';
import { ArrowLeft, BookOpen, CheckCircle2, Edit3, Circle } from 'lucide-react';

const LecturesPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const processed = lectures.filter(l => l.processedNotes?.trim()).length;
  const inProgress = lectures.filter(l => l.rawNotes?.trim() && !l.processedNotes?.trim()).length;
  const pct = lectures.length > 0 ? Math.round((processed / lectures.length) * 100) : 0;

  const breadcrumb = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate('/dashboard')}
        className="btn-ghost px-2 py-1"
      >
        <ArrowLeft size={14} />
        Subjects
      </button>
      <span className="text-[#404040]">/</span>
      <span className="text-[#d4d4d4] font-semibold text-[13px] truncate max-w-[160px]">
        {subject?.name || '…'}
      </span>
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onNewSubject={() => navigate('/dashboard')}
      />

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar
          onMenuToggle={() => setSidebarCollapsed(c => !c)}
          breadcrumb={breadcrumb}
        />

        <div className="page-scroll">
          <div className="page-container">
            {loading ? (
              <div className="space-y-4">
                <div className="skeleton h-9 w-48 rounded-xl mb-6" />
                <div className="skeleton h-5 w-64 rounded mb-10" />
                {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl mb-3" />)}
              </div>
            ) : (
              <div className="animate-fade-in">
                {/* Subject header */}
                <div className="mb-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center">
                      <BookOpen size={20} className="text-[#a78bfa]" />
                    </div>
                    <h1 className="text-3xl font-bold text-[#f5f5f5] tracking-tight">{subject?.name}</h1>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-6 ml-[60px] mb-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#22c55e]" />
                      <span className="text-[13px] text-[#737373]">{processed} processed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Edit3 size={14} className="text-[#f59e0b]" />
                      <span className="text-[13px] text-[#737373]">{inProgress} in progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Circle size={14} className="text-[#404040]" />
                      <span className="text-[13px] text-[#737373]">{lectures.length - processed - inProgress} not started</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="ml-[60px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-[#404040]">Progress</span>
                      <span className="text-[12px] font-semibold text-[#a78bfa]">{pct}%</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Lectures list */}
                <div className="lecture-list">
                  {lectures.map(l => (
                    <LectureItem key={l._id} lecture={l} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturesPage;
