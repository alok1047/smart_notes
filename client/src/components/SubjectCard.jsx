import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Trash2 } from 'lucide-react';

const ACCENTS = [
  { solid: 'var(--accent-lavender)', soft: 'rgba(169,142,216,0.13)' },
  { solid: 'var(--accent-teal)', soft: 'rgba(42,191,171,0.12)' },
  { solid: 'var(--accent-amber)', soft: 'rgba(216,166,87,0.13)' },
  { solid: '#7A92D4', soft: 'rgba(122,146,212,0.13)' },
];

const accentFor = (name = '') => {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return ACCENTS[hash % ACCENTS.length];
};

const SubjectCard = ({ subject, onDelete, variant = 'grid', progress, processedCount, conceptCount, lastUpdated }) => {
  const navigate = useNavigate();
  const accent = accentFor(subject.name);

  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  if (variant === 'list') {
    return (
      <div
        onClick={() => navigate(`/lectures/${subject._id}`)}
        className="group flex items-center gap-3 rounded-xl border border-(--border-subtle) bg-(--surface) px-4 py-3 cursor-pointer hover:border-(--border) hover:bg-(--surface-hover) transition-colors"
      >
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent.soft, color: accent.solid }}>
          <BookOpen size={13} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-(--text) truncate">{subject.name}</p>
          <p className="text-[11px] text-(--text-faint) truncate">
            {subject.lectureCount} {subject.lectureCount === 1 ? 'lecture' : 'lectures'}
            {typeof progress === 'number' ? ` · ${progress}% structured` : ''}
            {lastUpdated ? ` · ${fmt(lastUpdated)}` : ''}
          </p>
        </div>
        {typeof progress === 'number' && (
          <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: accent.solid }} />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(subject._id, subject.name); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-(--text-faint) hover:text-(--danger) hover:bg-(--danger-soft) transition-all"
          aria-label="Delete subject"
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
      className="group flex flex-col gap-3 rounded-2xl border border-(--border-subtle) bg-(--surface) p-5 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-(--border) hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: accent.soft, color: accent.solid }}
        >
          <BookOpen size={16} />
        </span>
        <span className="text-[11px] text-(--text-faint)">{fmt(subject.createdAt)}</span>
      </div>

      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-(--text) leading-tight truncate">{subject.name}</h3>
        <p className="mt-1 text-[12.5px] text-(--text-dim) line-clamp-1">
          {subject.description?.trim() || `${subject.lectureCount} lectures to organize`}
        </p>
        <p className="mt-0.5 text-[11px] text-(--text-faint)">
          {subject.lectureCount} {subject.lectureCount === 1 ? 'lecture' : 'lectures'}
          {conceptCount > 0 ? ` · ${conceptCount} ${conceptCount === 1 ? 'concept' : 'concepts'}` : ''}
        </p>
      </div>

      {typeof progress === 'number' && (
        <div className="mt-auto pt-1">
          <div className="h-1 rounded-full bg-(--bg-subtle) overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%`, background: accent.solid }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-(--text-faint)">
              {processedCount} of {subject.lectureCount} structured
            </span>
            <ChevronRight
              size={14}
              className="text-(--text-faint) group-hover:text-(--accent-text) group-hover:translate-x-0.5 transition-all"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectCard;
