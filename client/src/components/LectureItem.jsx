import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Edit3, Clock, ChevronRight, PenLine, Trash2 } from 'lucide-react';

const LectureItem = ({ lecture, onDelete, onUpdateTitle }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(lecture.title || '');

  const hasRaw = lecture.rawNotes?.trim().length > 0;
  const hasProcessed = lecture.processedNotes?.trim().length > 0;

  const status = hasProcessed
    ? { label: 'Processed', dotColor: '#22c55e', cls: 'badge-green', icon: CheckCircle2 }
    : hasRaw
    ? { label: 'In Progress', dotColor: '#f59e0b', cls: 'badge-amber', icon: Edit3 }
    : { label: 'Not Started', dotColor: '#404040', cls: 'badge-gray', icon: Circle };

  const StatusIcon = status.icon;

  const relTime = (d) => {
    if (!d) return '';
    const diff = Date.now() - new Date(d);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return Math.floor(h / 24) + 'd ago';
  };

  const preview = (lecture.rawNotes || '').trim().substring(0, 100).replace(/\n/g, ' ');

  return (
    <div
      onClick={() => navigate(`/editor/${lecture._id}`)}
      className="group lecture-item relative flex items-start gap-5"
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#2a2a2a';
        e.currentTarget.style.transform = 'translateY(-1px) scale(1.003)';
        e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,0,0,0.45)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#1f1f1f';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Status dot line */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0 mt-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: status.dotColor }}
        />
      </div>

      {/* Number + content */}
      <div className="flex-1 min-w-0" style={{ paddingTop: '2px' }}>
        {/* Top row */}
        <div className="flex items-center flex-wrap gap-4 mb-3">
          <span
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold flex-shrink-0"
            style={{ background: '#1f1f1f', border: '1px solid #2a2a2a', color: '#737373' }}
          >
            {lecture.lectureNumber}
          </span>
          <div className="flex items-center gap-2 group/title relative">
            {isEditing ? (
              <input
                autoFocus
                type="text"
                value={editTitle}
                onClick={e => e.stopPropagation()}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    setIsEditing(false);
                    onUpdateTitle && onUpdateTitle(editTitle.trim());
                  }
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setEditTitle(lecture.title || '');
                    setIsEditing(false);
                  }
                }}
                onBlur={() => {
                  setIsEditing(false);
                  const trimmed = editTitle.trim();
                  if (trimmed !== (lecture.title || '')) {
                    onUpdateTitle && onUpdateTitle(trimmed);
                  }
                }}
                className="bg-[#1f1f1f] text-[#f5f5f5] px-2 py-0.5 rounded outline-none border border-[#3f3f46] text-[15px] font-semibold w-[200px]"
                placeholder={`Lecture ${lecture.lectureNumber}`}
              />
            ) : (
              <span className="text-[15px] font-semibold text-[#d4d4d4]">
                {lecture.title?.trim() || `Lecture ${lecture.lectureNumber}`}
              </span>
            )}
            
            {!isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="text-[#525252] hover:text-[#d4d4d4] opacity-0 group-hover/title:opacity-100 transition-opacity"
              >
                <PenLine size={12} />
              </button>
            )}
          </div>
          <span className={`badge ${status.cls}`}>
            <StatusIcon size={10} />
            {status.label}
          </span>
        </div>

        {/* Preview text */}
        {preview ? (
          <p className="text-[13px] text-[#525252] truncate pl-[52px] leading-relaxed">{preview}</p>
        ) : (
          <p className="text-[13px] text-[#3a3a3a] pl-[52px] italic leading-relaxed">No notes yet — click to start writing</p>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 flex-shrink-0 self-center">
        {lecture.updatedAt && (
          <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#404040]">
            <Clock size={11} />
            {relTime(lecture.updatedAt)}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onDelete) onDelete();
          }}
          className="text-[#525252] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded"
          title="Delete Lecture"
        >
          <Trash2 size={14} />
        </button>
        <ChevronRight size={16} className="text-[#3a3a3a] group-hover:text-[#a78bfa] transition-colors" />
      </div>
    </div>
  );
};

export default LectureItem;
