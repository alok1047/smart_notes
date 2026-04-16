import { useNavigate } from 'react-router-dom';
import { BookOpen, Trash2, FileText, Clock } from 'lucide-react';

const COLORS = [
  { dot: '#8b5cf6', bg: 'rgba(124, 58, 237, 0.08)' },
  { dot: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' },
  { dot: '#22c55e', bg: 'rgba(34, 197, 94, 0.08)' },
  { dot: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
  { dot: '#f43f5e', bg: 'rgba(244, 63, 94, 0.08)' },
  { dot: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
];

const SubjectCard = ({ subject, onDelete }) => {
  const navigate = useNavigate();
  const color = COLORS[subject.name.length % COLORS.length];

  const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      onClick={() => navigate(`/lectures/${subject._id}`)}
      className="card group relative cursor-pointer"
    >
      {/* Color dot + icon */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ background: color.bg }}
        >
          <BookOpen size={20} style={{ color: color.dot }} />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(subject._id, subject.name); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-[#404040] hover:text-[#f43f5e] hover:bg-[#1f1f1f] transition-all duration-150"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Name */}
      <h3 className="text-[16px] font-semibold text-[#e5e5e5] mb-2 leading-snug pr-2">
        {subject.name}
      </h3>

      {/* Meta */}
      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5 text-[#525252]">
          <FileText size={12} />
          <span className="text-[12px]">{subject.lectureCount} lectures</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#525252]">
          <Clock size={12} />
          <span className="text-[12px]">{fmt(subject.createdAt)}</span>
        </div>
      </div>

      {/* Active indicator */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: color.dot }}
      />
    </div>
  );
};

export default SubjectCard;
