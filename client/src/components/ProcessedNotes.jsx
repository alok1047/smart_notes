import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, Edit2, Check, Eye, Loader2, Download, CloudUpload } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import HighlightedEditor from './HighlightedEditor';
import { getGithubSettings } from '../utils/githubSettings';
import CodeBlock from './CodeBlock';
import { parseCustomSyntax, parseCustomSyntaxBlocks } from '../utils/markdownUtils';

const ProcessedNotes = ({ content, isPendingMode, onAccept, onDiscard, lectureId, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
    }, 1000);

    return () => clearTimeout(timer);
  }, [draft, editing, content, onSave]);

  const exportToPDF = async () => {
    if (!draft) return;
    try {
      setIsExporting(true);
      const element = document.getElementById('processed-markdown-content');
      if (!element) return;
      
      const opt = {
        margin:       10,
        filename:     'structured_notes.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const pushToGithub = async () => {
    if (!draft) return;
    const { token, repo } = getGithubSettings();
    if (!token || !repo) {
      alert('Please configure your GitHub Personal Access Token and Repository in the Settings (Sidebar).');
      return;
    }

    try {
      setIsPushing(true);
      const filename = `notes_${lectureId}.md`;
      const path = `notes/${filename}`;

      // 1. Get current file sha if exists (to update)
      const getFileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        headers: { Authorization: `token ${token}` }
      });
      const fileData = getFileRes.ok ? await getFileRes.json() : null;

      // 2. Base64 encode the markdown
      const contentBase64 = btoa(unescape(encodeURIComponent(parseCustomSyntax(draft))));

      // 3. Put the file
      const body = {
        message: `docs: syncing structured lecture notes ${lectureId}`,
        content: contentBase64,
        ...(fileData && fileData.sha ? { sha: fileData.sha } : {})
      };

      const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!putRes.ok) {
        throw new Error(await putRes.text());
      }
      alert('Successfully pushed to GitHub!');
    } catch (err) {
      console.error(err);
      alert('Failed to push to GitHub. Check your token and repo name.');
    } finally {
      setIsPushing(false);
    }
  };

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
      {/* Pending Note Action Banner */}
      {isPendingMode && (
        <div className="flex items-center justify-between px-8 py-3 bg-[#3b0764] border-b border-[#9333ea] flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={14} className="text-[#d8b4fe]" />
            <span className="text-[12px] font-medium tracking-wide">AI Notes Generated! Review the structure below.</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDiscard} className="btn-ghost text-[11px] px-3 font-semibold text-[#fca5a5] hover:text-white hover:bg-[#b91c1c] py-1 border border-[#b91c1c]">
              Discard
            </button>
            <button onClick={onAccept} className="btn-primary text-[11px] px-3 font-semibold bg-[#9333ea] hover:bg-[#a855f7] border border-[#a855f7] py-1">
              Save & Overwrite
            </button>
          </div>
        </div>
      )}

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
          {/* Export & GitHub Actions */}
          <div className="flex items-center gap-2">
            {!editing && !isPendingMode && (
              <>
                <button
                  onClick={exportToPDF}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[#737373] hover:text-[#d4d4d4]"
                >
                  {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  PDF
                </button>
                <button
                  onClick={pushToGithub}
                  disabled={isPushing}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-[#737373] hover:text-[#a78bfa]"
                >
                  {isPushing ? <Loader2 size={12} className="animate-spin" /> : <CloudUpload size={12} />}
                  Push
                </button>
                <div className="w-px h-3 bg-[#2a2a2a] mx-1"></div>
              </>
            )}

            <button
              onClick={() => !isPendingMode && setEditing(!editing)}
              disabled={isPendingMode}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-colors ${editing ? 'bg-[#2a2a2a] text-[#f5f5f5]' : 'text-[#737373] hover:text-[#d4d4d4]'} ${isPendingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {editing ? (
                <><Eye size={12} /> Preview</>
              ) : (
                <><Edit2 size={12} /> Edit</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto px-10 py-6" 
        id="processed-markdown-content"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {editing ? (
          <div className="flex-1 flex flex-col w-full" style={{ maxWidth: '980px', minHeight: 0 }}>
            <HighlightedEditor
              value={draft}
              onChange={setDraft}
              placeholder="Edit your processed markdown notes directly here..."
              autoFocus
            />
          </div>
        ) : (
          <div className="markdown-body" style={{ maxWidth: '980px' }}>
            {parseCustomSyntaxBlocks(content).map((block, i) => (
              block.type === 'code' ? (
                <CodeBlock key={i} content={block.content} language={block.language} />
              ) : (
                <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessedNotes;
