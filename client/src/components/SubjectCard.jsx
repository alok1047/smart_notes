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
        className="group lecture-item flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-md bg-(--bg-subtle) border border-(--border-subtle) flex items-center justify-center shrink-0">
          <BookOpen size={14} className="text-(--text-dim)" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13.5px] font-medium text-(--text) truncate">{subject.name}</p>
          <p className="text-[11.5px] text-(--text-faint) truncate mt-0.5">
            {subject.lectureCount} {subject.lectureCount === 1 ? 'lecture' : 'lectures'} · created {fmt(subject.createdAt)}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(subject._id, subject.name); }}
          className="text-(--text-faint) hover:text-(--danger) opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-md hover:bg-(--surface-hover)"
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
      className="card group cursor-pointer flex flex-col gap-6 relative overflow-hidden !p-5"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-(--surface-hover) border border-(--border-subtle) flex items-center justify-center text-[20px] shadow-inner">
          {emojiFor(subject.name)}
        </div>
        <div className="flex flex-col items-end gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-(--text-faint) tracking-wide">
            {fmt(subject.createdAt)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(subject._id, subject.name); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-(--text-faint) hover:text-(--danger) hover:bg-red-500/10 transition-all"
            title="Delete subject"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="mt-1">
        <h3 className="text-[15px] font-bold text-(--text) leading-tight mb-1 group-hover:text-(--accent-text) transition-colors line-clamp-2">
          {subject.name}
        </h3>
        <p className="text-[12px] font-medium text-(--text-dim)">
          {subject.lectureCount} <span className="opacity-70">{subject.lectureCount === 1 ? 'lecture' : 'lectures'}</span>
        </p>
      </div>
    </div>
  );
};

export default SubjectCard;
