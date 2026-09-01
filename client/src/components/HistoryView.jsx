import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { History, Trash2, ChevronDown, Clock, FileText, Hash } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getLectureVersions, deleteLectureVersion } from '../services/lectureService';

const HistoryView = ({ lectureId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getLectureVersions(lectureId);
        setVersions(data.versions || data);
      } catch (err) {
        console.error('Failed to fetch versions', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [lectureId]);

  const handleDelete = async (e, versionId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this version?')) return;
    try {
      await deleteLectureVersion(versionId);
      setVersions((prev) => prev.filter((v) => v._id !== versionId));
      if (expandedId === versionId) setExpandedId(null);
    } catch (err) {
      console.error('Failed to delete version', err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const countWords = (text) => {
    return text ? text.trim().split(/\s+/).length : 0;
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="animate-spin text-(--accent-text)">
          <History size={24} />
        </div>
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16 bg-(--bg) overflow-y-auto">
        <div className="w-12 h-12 rounded-xl bg-(--surface-hover) border border-(--border-subtle) flex items-center justify-center mb-4">
          <History size={20} className="text-(--text-faint)" strokeWidth={1.75} />
        </div>
        <h3 className="text-[15px] font-semibold text-(--text) mb-1.5">No version history yet</h3>
        <p className="text-[13px] text-(--text-dim) max-w-sm leading-relaxed">
          Process your notes with AI to create your first version.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-(--bg)">
      <div className="max-w-4xl mx-auto py-8 px-5">
        <div className="flex flex-col gap-4">
          {versions.map((version) => {
            const isExpanded = expandedId === version._id;
            return (
              <div key={version._id} className="bg-(--surface) border border-(--border-subtle) rounded-xl overflow-hidden">
                <div 
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-(--surface-hover) transition-colors"
                  onClick={() => toggleExpand(version._id)}
                >
                  <div className="w-8 h-8 rounded-full bg-(--accent-soft) text-(--accent-text) flex items-center justify-center shrink-0">
                    <Hash size={14} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-semibold text-(--text) tracking-tight">
                      Version {version.version}
                    </h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-(--text-dim)">
                        <Clock size={12} />
                        {formatDate(version.createdAt)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-(--text-dim)">
                        <FileText size={12} />
                        {countWords(version.processedNotes)} words
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, version._id)}
                      className="p-2 text-(--text-faint) hover:text-(--danger) hover:bg-(--danger-soft) rounded-lg transition-colors"
                      title="Delete version"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className={`p-2 text-(--text-faint) transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={reduced ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={reduced ? undefined : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 border-t border-(--border-subtle) bg-(--bg-subtle)">
                        <div className="markdown-body">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {version.processedNotes}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
