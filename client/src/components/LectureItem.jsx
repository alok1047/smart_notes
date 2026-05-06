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
    ? { label: 'Done', cls: 'badge-green', icon: CheckCircle2 }
    : hasRaw
    ? { label: 'Draft', cls: 'badge-amber', icon: Edit3 }
    : { label: 'Empty', cls: 'badge-gray', icon: Circle };

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

  const preview = (lecture.rawNotes || '').trim().substring(0, 100).replace(/\s+/g, ' ');

  return (
    <div
      onClick={() => navigate(`/editor/${lecture._id}`)}
      className="group lecture-item flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-md bg-(--bg-subtle) border border-(--border-subtle) flex items-center justify-center shrink-0 text-[12px] font-medium text-(--text-dim)">
        {lecture.lectureNumber}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-0.5">
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
              className="bg-(--surface-hover) text-(--text) px-2 py-0.5 rounded-md outline-none border border-(--accent) text-[13.5px] font-medium min-w-50"
              placeholder={`Lecture ${lecture.lectureNumber}`}
            />
          ) : (
            <>
              <h3 className="text-[13.5px] font-medium text-(--text) truncate leading-tight">
                {lecture.title?.trim() || `Lecture ${lecture.lectureNumber}`}
              </h3>
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                className="text-(--text-faint) hover:text-(--text-dim) opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                title="Rename"
              >
                <PenLine size={11} />
              </button>
            </>
          )}
          <span className={`badge ${status.cls}`}>
            <StatusIcon size={10} />
            {status.label}
          </span>
        </div>

        {preview ? (
          <p className="text-[12px] text-(--text-faint) truncate leading-relaxed">{preview}</p>
        ) : (
          <p className="text-[12px] text-(--text-faint) leading-relaxed">No notes yet</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {lecture.updatedAt && (
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-(--text-faint)">
            <Clock size={10} />
            {relTime(lecture.updatedAt)}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onDelete) onDelete();
          }}
          className="text-(--text-faint) hover:text-(--danger) opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-md hover:bg-(--surface-hover)"
          title="Delete lecture"
        >
          <Trash2 size={12} />
        </button>
        <ChevronRight size={14} className="text-(--text-faint) group-hover:text-(--text-dim) transition-colors" />
      </div>
    </div>
  );
};

export default LectureItem;
