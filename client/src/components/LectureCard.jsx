import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, Clock, Edit3 } from 'lucide-react';

const LectureCard = ({ lecture }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/editor/${lecture._id}`);
  };

  const hasRawNotes = lecture.rawNotes && lecture.rawNotes.trim().length > 0;
  const hasProcessedNotes = lecture.processedNotes && lecture.processedNotes.trim().length > 0;

  const getStatus = () => {
    if (hasProcessedNotes) return { label: 'Processed', color: 'text-accent-emerald', bg: 'bg-emerald-500/10', icon: CheckCircle2 };
    if (hasRawNotes) return { label: 'Has Notes', color: 'text-accent-amber', bg: 'bg-amber-500/10', icon: Edit3 };
    return { label: 'Empty', color: 'text-surface-700', bg: 'bg-surface-800', icon: FileText };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPreview = () => {
    const text = lecture.rawNotes || '';
    if (!text.trim()) return 'No notes yet. Click to start writing...';
    return text.substring(0, 100).replace(/\n/g, ' ') + (text.length > 100 ? '...' : '');
  };

  return (
    <div
      onClick={handleClick}
      className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-surface-900 hover:border-surface-600 border border-surface-800 cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-xl hover:shadow-black/50"
    >
      {/* Lecture number */}
      <div className="w-10 h-10 rounded-lg bg-surface-800 flex items-center justify-center shrink-0 border border-surface-800 transition-colors group-hover:border-surface-700">
        <span className="text-sm font-semibold text-surface-200">{lecture.lectureNumber}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-semibold text-surface-100">
            Lecture {lecture.lectureNumber}
          </h4>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium ${status.color} ${status.bg} border border-current/10`}>
            <StatusIcon size={12} />
            {status.label}
          </span>
        </div>
        <p className="text-xs text-surface-700 truncate">
          {getPreview()}
        </p>
      </div>

      {/* Time */}
      <div className="hidden sm:flex items-center gap-1 text-surface-700 shrink-0">
        <Clock size={12} />
        <span className="text-xs">{formatDate(lecture.updatedAt)}</span>
      </div>

      {/* Arrow */}
      <div className="text-surface-700 group-hover:text-primary-400 transition-colors shrink-0">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

export default LectureCard;
