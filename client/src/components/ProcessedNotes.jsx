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

  useEffect(() => {
    if (!editing) {
      setDraft(content || '');
    }
  }, [content, editing]);

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

      const getFileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        headers: { Authorization: `token ${token}` }
      });
      const fileData = getFileRes.ok ? await getFileRes.json() : null;

      const contentBase64 = btoa(unescape(encodeURIComponent(parseCustomSyntax(draft))));

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
        <div className="w-12 h-12 rounded-xl bg-(--bg-subtle) border border-(--border-subtle) flex items-center justify-center mb-4">
          <Sparkles size={20} className="text-(--text-faint)" strokeWidth={1.75} />
        </div>
        <h3 className="text-[14px] font-medium mb-1.5 text-(--text)">No processed notes yet</h3>
        <p className="text-[12.5px] leading-relaxed max-w-xs text-(--text-dim)">
          Write your raw notes in the editor and click "Process" to generate structured notes.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in">
      {/* Pending banner */}
      {isPendingMode && (
        <div className="flex items-center justify-between gap-4 px-8 py-2.5 shrink-0 animate-fade-in bg-(--accent-soft) border-b border-(--border-subtle)">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles size={14} className="text-(--accent-text) shrink-0" />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-(--text) leading-tight">AI draft ready</p>
              <p className="text-[11px] text-(--text-dim) mt-0.5">Review below — accept to overwrite, or discard.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onDiscard} className="btn-secondary text-[12px] py-1 px-2.5">
              Discard
            </button>
            <button onClick={onAccept} className="btn-primary text-[12px] py-1 px-2.5">
              <Check size={11} />
              Accept
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-8 py-2.5 shrink-0 border-b border-(--border-subtle)">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-(--text-faint)">
            Processed
          </span>
          {saving && (
            <span className="flex items-center gap-1 text-[11px] text-(--text-faint)">
              <Loader2 size={11} className="animate-spin" /> Saving...
            </span>
          )}
          {saved && !saving && (
            <span className="flex items-center gap-1 text-[11px] text-(--success)">
              <Check size={11} /> Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!editing && !isPendingMode && (
            <>
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="btn-ghost text-[12px] py-1 px-2"
                title="Export as PDF"
              >
                {isExporting ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={pushToGithub}
                disabled={isPushing}
                className="btn-ghost text-[12px] py-1 px-2"
                title="Push to GitHub"
              >
                {isPushing ? <Loader2 size={11} className="animate-spin" /> : <CloudUpload size={11} />}
                <span className="hidden sm:inline">Push</span>
              </button>
              <div className="w-px h-4 bg-(--border-subtle) mx-1" />
            </>
          )}
          <button
            onClick={() => !isPendingMode && setEditing(!editing)}
            disabled={isPendingMode}
            className={editing ? 'btn-primary text-[12px] py-1 px-2.5' : 'btn-secondary text-[12px] py-1 px-2.5'}
          >
            {editing ? <><Eye size={11} /> Preview</> : <><Edit2 size={11} /> Edit</>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto px-10 py-6 bg-(--bg)"
        id="processed-markdown-content"
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
