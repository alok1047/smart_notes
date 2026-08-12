import { useNavigate } from 'react-router-dom';
import { BookOpen, Trash2, ChevronRight } from 'lucide-react';

const EMOJI_POOL = ['📚', '☕', '💡', '🧩', '🔬', '📊', '🎨', '⚡', '🌟', '🎯', '📐', '🧠', '🔧', '🚀', '📖'];

const emojiFor = (name = '') => {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return EMOJI_POOL[hash % EMOJI_POOL.length];
};

const SubjectCard = ({ subject, onDelete, variant = 'grid' }) => {
  const navigate = useNavigate();

  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (variant === 'list') {
    return (
      <div
        onClick={() => navigate(`/lectures/${subject._id}`)}
        className="group lecture-item flex items-center gap-3 cursor-pointer"
      >
        <div className="w-7 h-7 rounded bg-(--surface-hover) flex items-center justify-center shrink-0 text-[14px]">
          {emojiFor(subject.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-(--text) truncate">{subject.name}</p>
          <p className="text-[11px] text-(--text-faint) truncate">
            {subject.lectureCount} {subject.lectureCount === 1 ? 'lecture' : 'lectures'} · {fmt(subject.createdAt)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(subject._id, subject.name); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-(--text-faint) hover:text-(--danger) hover:bg-(--danger-soft) transition-all"
        >
          <Trash2 size={13} />
        </button>
        <ChevronRight size={15} className="text-(--text-faint) group-hover:text-(--text-dim) shrink-0 transition-colors" />
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/lectures/${subject._id}`)}
      className="card group cursor-pointer flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg bg-(--surface-hover) flex items-center justify-center text-[18px]">
          {emojiFor(subject.name)}
        </div>
        <div className="flex flex-col items-end gap-1.5 pt-1">
          <span className="text-[11px] text-(--text-faint)">{fmt(subject.createdAt)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(subject._id, subject.name); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-(--text-faint) hover:text-(--danger) hover:bg-(--danger-soft) transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-1">
        <h3 className="text-[14px] font-semibold text-(--text) leading-tight line-clamp-2">{subject.name}</h3>
        <p className="mt-1 text-[12px] text-(--text-dim)">
          {subject.lectureCount} {subject.lectureCount === 1 ? 'lecture' : 'lectures'}
        </p>
      </div>
    </div>
  );
};

export default SubjectCard;
