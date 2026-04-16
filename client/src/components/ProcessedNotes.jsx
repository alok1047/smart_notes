import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Edit2, Check, Eye, Loader2 } from 'lucide-react';
import HighlightedEditor from './HighlightedEditor';

const ProcessedNotes = ({ content, lectureId, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync initial content
  useEffect(() => {
    if (!editing) {
      setDraft(content || '');
    }
  }, [content, editing]);

  // Auto-save logic just like raw notes
  useEffect(() => {
    if (!editing) return;
    if (draft === content) return;

    const timer = setTimeout(async () => {
      try {
        setSaving(true);
        await onSave(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (e) {
        console.error('Auto-save failed:', e);
      } finally {
        setSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [draft, editing, content, onSave]);

  if (!content?.trim() && !editing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 px-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: '#1f1f1f', border: '1px solid #2a2a2a' }}
        >
          <Sparkles size={24} style={{ color: '#404040' }} />
        </div>
        <h3 className="text-[14px] font-semibold mb-2" style={{ color: '#525252' }}>No processed notes yet</h3>
        <p className="text-[12px] leading-relaxed max-w-xs" style={{ color: '#404040' }}>
          Write your raw notes in the editor and click "Process with AI" to generate structured notes.
        </p>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden animate-fade-in"
      style={{ transition: 'opacity 0.2s ease' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-8 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #1f1f1f' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#404040' }}>
            Processed Notes
          </span>
          {saving && (
             <span className="flex items-center gap-1 text-[11px]" style={{ color: '#525252' }}>
               <Loader2 size={11} className="animate-spin" /> Saving…
             </span>
          )}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: '#22c55e' }}>
              <Check size={11} /> Saved
            </span>
          )}
        </div>
        
        {/* Toggle Mode */}
        <div className="flex bg-[#111] p-1 rounded-lg border border-[#2a2a2a] items-center">
          <button
            onClick={() => setEditing(false)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${!editing ? 'bg-[#2a2a2a] text-[#f5f5f5]' : 'text-[#737373] hover:text-[#d4d4d4]'}`}
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            onClick={() => setEditing(true)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${editing ? 'bg-[#2a2a2a] text-[#f5f5f5]' : 'text-[#737373] hover:text-[#d4d4d4]'}`}
          >
            <Edit2 size={13} />
            Edit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {editing ? (
          <div className="flex-1 flex flex-col w-full px-10" style={{ maxWidth: '980px', minHeight: 0 }}>
            <HighlightedEditor
              value={draft}
              onChange={setDraft}
              placeholder="Edit your processed markdown notes directly here..."
              autoFocus
            />
          </div>
        ) : (
          <div className="markdown-body" style={{ maxWidth: '980px' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessedNotes;
