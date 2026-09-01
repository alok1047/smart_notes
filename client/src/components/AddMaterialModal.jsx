import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SiYoutube } from '@icons-pack/react-simple-icons';
import {
  ArrowLeft,
  Check,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';
import { SOURCES } from '../utils/inputSources';
import ProcessingModal from './ProcessingModal';
import pdfLoadingAnimation from '../assets/loading3.json';
import { uploadLectureFile } from '../services/lectureService';
import { importNotionPage } from '../services/notionService';
import { toErrorMessage } from '../utils/errors';
import {
  extractYouTubeId,
  fetchYouTubeMetadata,
  getYouTubeTranscript,
  YouTubeTranscriptUnavailableError,
} from '../services/videoService';

const FILE_STAGES = [
  { key: 'upload', label: 'Upload' },
  { key: 'extract', label: 'Extract' },
  { key: 'sections', label: 'Sections' },
  { key: 'notes', label: 'Add' },
  { key: 'chunk', label: 'Index' },
  { key: 'ready', label: 'Ready' },
];

const STAGE_DETAILS = [
  'Uploading your file…',
  'Extracting text from the document…',
  'Detecting sections and headings…',
  'Adding to your notes…',
  'Chunking and indexing for search…',
  'Ready to structure with AI.',
];
const ACCEPTED = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
];
const MAX_SIZE = 15 * 1024 * 1024;

const formatBytes = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const validateFile = (file) => {
  if (!ACCEPTED.includes(file.type)) {
    return 'Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP file.';
  }
  if (file.size > MAX_SIZE) return 'File is too large. Maximum allowed size is 15 MB.';
  if (file.size === 0) return 'This file appears to be empty.';
  return null;
};

/* ---------------- PDF / IMAGE PANEL ---------------- */

const FilePanel = ({ title, lectureId, apiKey, onInsert, onClose, onStructure }) => {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [state, setState] = useState('idle'); // idle | running | done | error
  const [stage, setStage] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [pageWarning, setPageWarning] = useState('');

  const timerRef = useRef(null);

  const stopStaging = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // Cleanly dispose any staging timer on unmount
  useEffect(() => stopStaging, []);

  const handleFile = useCallback(
    async (selected, forceOcr = false) => {
      if (!selected) return;
      const validation = validateFile(selected);
      if (validation) {
        setError(validation);
        setState('error');
        return;
      }

      setFile(selected);
      setError('');
      setPageWarning('');
      setResult(null);
      setState('running');
      setStage(0);

      // Staged progress — the server returns the extraction in one response,
      // so we advance through honest milestones while it works.
      stopStaging();
      timerRef.current = setInterval(() => {
        setStage((s) => {
          if (s < FILE_STAGES.length - 1) return s + 1;
          stopStaging();
          return s;
        });
      }, 1100);

      try {
        const data = await uploadLectureFile(lectureId, selected, apiKey, forceOcr);
        stopStaging();

        setResult({
          filename: selected.name,
          size: formatBytes(selected.size),
          chars: data.extractedText?.length || 0,
          pageCount: data.pageCount || null,
        });

        if (data.extractedText) {
          onInsert?.({ text: data.extractedText, filename: selected.name, pageCount: data.pageCount || null });
        }

        setStage(FILE_STAGES.length - 1);
        setState('done');

        if (data.failedPages?.length) {
          setPageWarning(
            `Some pages could not be extracted (pages ${data.failedPages.join(', ')}). You can retry the whole document with AI OCR.`
          );
        } else if (data.pageCount && data.extractedText && data.extractedText.trim().length < data.pageCount * 60) {
          setPageWarning(
            `Some pages may have been extracted partially (${data.pageCount} pages). If the notes look thin, try a clearer PDF or check your AI OCR key in Settings.`
          );
        } else {
          setPageWarning('');
        }
      } catch (err) {
        stopStaging();
        const message = toErrorMessage(err, 'Import failed.');
        setError(/scanned|OCR|no text|extract/i.test(message) ? `Could not extract text from this file. ${message}` : message);
        setState('error');
      }
    },
    [lectureId, apiKey, onInsert]
  );

  const pickFile = () => inputRef.current?.click();

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,audio/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {state === 'idle' && (
        <div
          role="button"
          tabIndex={0}
          onClick={pickFile}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pickFile()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files?.[0]); }}
          className={`flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed px-6 py-12 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-(--accent-ring) ${
            dragActive ? 'border-(--accent-text) bg-(--accent-soft)' : 'border-(--border-strong) bg-(--surface) hover:border-(--accent-text)'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-(--accent-soft) flex items-center justify-center mb-4">
            <Plus size={20} className="text-(--accent-text)" />
          </div>
          <p className="text-[14px] font-semibold text-(--text)">Drop a {title} here</p>
          <p className="mt-1 text-[12.5px] text-(--text-dim)">or click / press Enter to browse</p>
          <p className="mt-3 text-[11px] text-(--text-faint)">
            {title === 'PDF'
              ? 'Text PDFs extract locally · scanned pages fall back to AI OCR'
              : title === 'Recording'
              ? 'Audio is transcribed with AI — MP3, WAV, M4A, WEBM'
              : 'AI OCR reads handwritten and printed text'}
          </p>
        </div>
      )}

      {state === 'running' && (
        <ProcessingModal
          open
          source={{ label: file?.name || title, meta: file ? formatBytes(file.size) : '' }}
          stages={FILE_STAGES}
          activeIndex={Math.min(stage, FILE_STAGES.length - 1)}
          state="running"
          heading={`Processing ${title.toLowerCase()}`}
          sub={`Reading and extracting text from your ${title.toLowerCase()}.`}
          detail={file ? `${formatBytes(file.size)} · ${STAGE_DETAILS[Math.min(stage, STAGE_DETAILS.length - 1)]}` : ''}
          loadingAnimation={pdfLoadingAnimation}
        />
      )}

      {state === 'done' && result && (
        <ProcessingModal
          open
          source={{ label: result.filename, meta: result.size }}
          stages={FILE_STAGES}
          activeIndex={FILE_STAGES.length - 1}
          state="done"
          heading={`${title} added to notes`}
          doneHeading={`${title} added to notes`}
          detail=""
          loadingAnimation={pdfLoadingAnimation}
          resultContent={
            <div className="w-full flex flex-col gap-4">
              <div className="rounded-2xl border border-(--border-strong) bg-(--success-soft)/40 p-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-(--success-soft) flex items-center justify-center text-(--success) shrink-0">
                    <Check size={18} strokeWidth={3} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-(--text) truncate">{result.filename}</p>
                    <p className="text-[11.5px] text-(--text-dim) truncate">
                      {result.pageCount ? `${result.pageCount} pages · ` : ''}
                      {result.chars.toLocaleString()} characters extracted
                    </p>
                  </div>
                </div>
              </div>

              {pageWarning && (
                <div className="rounded-xl border border-[rgba(180,83,9,0.25)] bg-(--warning-soft) px-3.5 py-3 text-left">
                  <p className="text-[12.5px] leading-relaxed text-(--text-dim)">{pageWarning}</p>
                  <button
                    type="button"
                    onClick={() => handleFile(file, true)}
                    className="mt-2.5 h-8 px-3.5 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> Retry with OCR
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => { onStructure && onStructure(); onClose && onClose(); }}
                  className="h-9 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white text-[12.5px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={13} /> Structure with AI
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 rounded-lg border border-(--border-subtle) hover:bg-(--surface-hover) text-[12.5px] text-(--text-dim) transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          }
        />
      )}

      {state === 'error' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-xl border border-(--danger-border) bg-(--danger-soft) p-4">
            <span className="w-8 h-8 rounded-full bg-(--danger-soft) flex items-center justify-center text-(--danger) shrink-0">
              <X size={15} />
            </span>
            <p className="text-[12.5px] leading-relaxed text-(--text)">{error}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setState('idle'); setFile(null); setError(''); }}
              className="h-9 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white text-[12.5px] font-semibold transition-colors"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-lg border border-(--border-subtle) hover:bg-(--surface-hover) text-[12.5px] text-(--text-dim) transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
/* ---------------- YOUTUBE PANEL ---------------- */

const YOUTUBE_STAGES = [
  { key: 'find', label: 'Finding' },
  { key: 'transcript', label: 'Transcript' },
  { key: 'ready', label: 'Ready' },
];

const YouTubePanel = ({ onInsert, onClose }) => {
  const [url, setUrl] = useState('');
  const [meta, setMeta] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [transcriptError, setTranscriptError] = useState('');
  const [procStage, setProcStage] = useState(0);

  const fmtTime = (ms) => {
    const total = Math.max(0, Math.floor((ms || 0) / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  const lookUp = async () => {
    const trimmed = url.trim();
    if (!extractYouTubeId(trimmed)) {
      setError("That doesn't look like a valid YouTube link.");
      return;
    }
    setBusy(true);
    setProcStage(0);
    setError('');
    setMeta(null);
    setTranscript(null);
    setTranscriptError('');
    try {
      const m = await fetchYouTubeMetadata(trimmed);
      setMeta(m);
      setProcStage(1);
      try {
        const t = await getYouTubeTranscript(trimmed);
        setTranscript(t.transcript || []);
      } catch (err) {
        setTranscriptError(
          err instanceof YouTubeTranscriptUnavailableError
            ? err.message
            : 'Transcript retrieval failed. Check the URL and try again.'
        );
      }
    } catch (err) {
      setError(err.message || 'Could not fetch video details.');
    } finally {
      setProcStage(2);
      setBusy(false);
    }
  };

  const addTranscriptToNotes = () => {
    if (!meta || !transcript?.length) return;
    const lines = transcript
      .map((s) => `${fmtTime(s.offsetMs)}  ${s.text}`)
      .join('\n');
    const block = `\n\n> 🎬 **Video: ${meta.title}**\n> Channel: ${meta.channel}\n> Watch: ${meta.watchUrl}\n\n${lines}\n`;
    onInsert?.({ text: block, filename: meta.title });
    onClose?.();
  };

  const addVideoToNotes = () => {
    if (!meta) return;
    const block = `\n\n> 🎬 **Video: ${meta.title}**\n> Channel: ${meta.channel}\n> Watch: ${meta.watchUrl}\n`;
    onInsert?.({ text: block, filename: meta.title });
    onClose?.();
  };

  const hasTranscript = !!transcript?.length;

  const resultContent = meta ? (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl border border-(--border-subtle) bg-(--surface) p-3 text-left">
        <img
          src={meta.thumbnail}
          alt={meta.title}
          className="w-24 h-14 rounded-lg object-cover shrink-0 bg-(--surface-hover)"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-(--text) leading-snug line-clamp-2">{meta.title}</p>
          <p className="mt-1 text-[12px] text-(--text-dim)">{meta.channel}</p>
          <p className="mt-0.5 text-[11px] text-(--text-faint)">
            {hasTranscript
              ? `${transcript.length} segments ready to add`
              : 'Transcript unavailable — add the video link only'}
          </p>
          <a
            href={meta.watchUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[12px] font-medium text-(--accent-text) hover:underline"
          >
            <SiYoutube size={12} color="#FF0000" /> Open on YouTube
          </a>
        </div>
      </div>

      {transcriptError && (
        <div className="rounded-xl border border-(--danger-border) bg-(--danger-soft) px-3.5 py-3 text-left">
          <p className="text-[12.5px] font-medium text-(--danger) leading-relaxed">{transcriptError}</p>
          <button
            type="button"
            onClick={lookUp}
            className="mt-2.5 h-8 px-3.5 rounded-lg bg-(--danger) text-white text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={addTranscriptToNotes}
          disabled={!hasTranscript}
          className="h-9 px-4 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <Plus size={13} /> Add transcript to notes
        </button>
        <button
          type="button"
          onClick={addVideoToNotes}
          className="h-9 px-4 rounded-lg border border-(--border-subtle) hover:bg-(--surface-hover) text-[12.5px] text-(--text-dim) transition-colors"
        >
          Video link only
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-3">
      <ProcessingModal
        open={busy || !!meta}
        source={{ label: 'YouTube', meta: meta?.title || 'Finding video…' }}
        stages={YOUTUBE_STAGES}
        activeIndex={procStage}
        state={busy ? 'running' : 'done'}
        heading={busy ? 'Processing video' : 'Video ready'}
        doneHeading="Video ready"
        sub={busy ? 'Fetching the video details and transcript.' : ''}
        detail={busy ? '' : `${transcript?.length || 0} transcript segments retrieved`}
        loadingAnimation={pdfLoadingAnimation}
        resultContent={!busy ? resultContent : null}
      />

      <div className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && lookUp()}
          placeholder="https://youtube.com/watch?v=… or youtu.be/…"
          className="input flex-1 min-w-0 text-[13px]"
          aria-label="YouTube URL"
        />
        <button
          type="button"
          onClick={lookUp}
          disabled={busy}
          className="h-9 px-4 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-(--accent-fg) text-[12.5px] font-semibold transition-colors disabled:opacity-60 shrink-0"
        >
          {busy ? 'Looking up…' : 'Find video'}
        </button>
      </div>

      {error && <p className="text-[12.5px] text-(--danger)">{error}</p>}
    </div>
  );
};
/* ---------------- RAW NOTES PANEL ---------------- */

const RawPanel = ({ onInsert, onClose, initial = '' }) => {
  const [text, setText] = useState(initial);

  const insert = () => {
    if (!text.trim()) return;
    onInsert?.({ text: text.trim() });
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste messy lecture notes…"
        className="input w-full resize-none text-[13px] leading-relaxed"
        rows={8}
      />
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={insert}
          disabled={!text.trim()}
          className="h-9 px-4 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white text-[12.5px] font-semibold transition-colors disabled:opacity-60"
        >
          Add to notes
        </button>
        <p className="text-[11.5px] text-(--text-faint)">
          Next, tap <span className="text-(--accent-text) font-medium">Structure with AI</span> in the Raw tab.
        </p>
      </div>
    </div>
  );
};

/* ---------------- NOTION PANEL ---------------- */

const NotionPanel = ({ onInsert, onClose }) => {
  const [path, setPath] = useState('paste'); // paste | connect
  const [text, setText] = useState('');
  const [token, setToken] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const importPage = async () => {
    if (!token.trim() || !url.trim()) {
      setError('Enter both your Notion integration token and page link.');
      return;
    }
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const data = await importNotionPage(token.trim(), url.trim());
      setResult(data);
    } catch (err) {
      setError(toErrorMessage(err, 'Could not import this Notion page.'));
    } finally {
      setBusy(false);
    }
  };

  const addToNotes = () => {
    if (!result?.markdown) return;
    onInsert?.({ text: result.markdown, filename: result.title || 'Notion page' });
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {[
          { id: 'paste', label: 'Paste page content' },
          { id: 'connect', label: 'Connect Notion API' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPath(t.id)}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors border ${
              path === t.id
                ? 'border-(--accent-text) bg-(--accent-soft) text-(--accent-text)'
                : 'border-(--border-subtle) text-(--text-dim) hover:bg-(--surface-hover)'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {path === 'paste' ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Copy your Notion page (headings, bullets, code, tables) and paste here — preserved markdown goes through the same structuring pipeline as raw notes."
            className="input w-full resize-none text-[13px] leading-relaxed"
            rows={6}
          />
          <button
            type="button"
            onClick={() => { if (text.trim()) { onInsert?.({ text: text.trim(), filename: 'Notion page' }); onClose?.(); } }}
            disabled={!text.trim()}
            className="h-9 px-4 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white text-[12.5px] font-semibold self-start transition-colors disabled:opacity-60"
          >
            Add to notes
          </button>
          <p className="text-[11.5px] text-(--text-faint)">
            The imported content enters the same AI structuring pipeline as raw notes.
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[12px] font-medium text-(--text-dim) mb-1">
              Notion integration token
            </label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="secret_xxxxxxxx…"
              className="input text-[12.5px] font-mono"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-(--text-dim) mb-1">
              Page link
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.notion.so/…"
              className="input text-[12.5px]"
            />
          </div>
          <p className="text-[11.5px] text-(--text-faint) leading-relaxed">
            Create an integration at notion.so/my-integrations, share your page with it, then paste
            the token and page link. Headings, bullets, lists, code and tables are preserved.
          </p>
          <button
            type="button"
            onClick={importPage}
            disabled={busy}
            className="h-9 px-4 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white text-[12.5px] font-semibold self-start transition-colors disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {busy ? 'Importing…' : 'Import page'}
          </button>

          {error && <p className="text-[12.5px] text-(--danger)">{error}</p>}

          {result && (
            <div className="rounded-xl border border-(--border-strong) bg-(--success-soft)/40 p-4">
              <div className="flex items-center gap-2 min-w-0">
                <Check size={14} className="text-(--success) shrink-0" />
                <p className="text-[13px] font-semibold text-(--text) truncate">{result.title || 'Notion page'}</p>
              </div>
              <p className="mt-1 text-[11.5px] text-(--text-dim)">
                {result.markdown.length.toLocaleString()} characters of markdown
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={addToNotes}
                  className="h-8 px-3.5 rounded-lg bg-(--accent) hover:bg-(--accent-hover) text-white text-[12px] font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus size={12} /> Add to notes
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-3.5 rounded-lg border border-(--border-subtle) hover:bg-(--surface-hover) text-[12px] text-(--text-dim) transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------------- MAIN MODAL ---------------- */

const AddMaterialModal = ({ isOpen, onClose, lectureId, apiKey, onInsertText, onStructureNow, subjectName, initialSource = null }) => {
  const reduced = useReducedMotion();
  const [sourceId, setSourceId] = useState(null);

  if (!isOpen && sourceId !== null) {
    setSourceId(null);
  }
  if (isOpen && initialSource && sourceId !== initialSource && SOURCES.some((s) => s.id === initialSource)) {
    setSourceId(initialSource);
  }

  const current = SOURCES.find((s) => s.id === sourceId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay z-[9999]" onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Add material"
            onClick={(e) => e.stopPropagation()}
            initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="modal max-w-xl w-full bg-(--bg) border border-(--border-subtle) rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-(--border-subtle)">
              <div className="flex items-center gap-2.5 min-w-0">
                {current && (
                  <button
                    type="button"
                    onClick={() => setSourceId(null)}
                    className="btn-ghost p-1.5 rounded-md shrink-0 text-(--text-dim)"
                    aria-label="Back to sources"
                  >
                    <ArrowLeft size={15} />
                  </button>
                )}
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold text-(--text) tracking-tight truncate">
                    {current ? `Add ${current.title}` : 'What would you like to organize?'}
                  </h2>
                  <p className="text-[11.5px] text-(--text-dim) truncate">
                    {current
                      ? current.description
                      : subjectName
                      ? `Into “${subjectName}” · added to the current lecture`
                      : 'Start with any unstructured material — we do the rest.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-(--surface-hover) text-(--text-dim) transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {!current ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SOURCES.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.button
                        key={s.id}
                        type="button"
                        onClick={() => setSourceId(s.id)}
                        initial={reduced ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.28 }}
                        className="group flex items-start gap-3 text-left rounded-xl border border-(--border-subtle) bg-(--surface) p-3.5 hover:border-(--accent-ring) hover:bg-(--surface-hover) transition-colors"
                      >
                        <span
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-(--border-subtle) shadow-sm"
                          style={{ background: s.bg }}
                        >
                          <Icon size={16} color={s.color} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-[13.5px] font-semibold text-(--text)">{s.title}</span>
                            {s.todo && (
                              <span className="px-1.5 py-0.5 rounded bg-(--surface-hover) text-[9.5px] font-bold uppercase tracking-wide text-(--text-faint)">
                                Soon
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-snug text-(--text-dim)">{s.description}</span>
                          <span className="mt-1.5 block text-[10.5px] font-medium uppercase tracking-wide text-(--text-faint)">
                            {s.support}
                          </span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                /* PANELS */
                <div>
                  {sourceId === 'pdf' || sourceId === 'images' || sourceId === 'recording' ? (
                    <FilePanel
                      title={current.title}
                      lectureId={lectureId}
                      apiKey={apiKey}
                      onInsert={onInsertText}
                      onClose={onClose}
                      onStructure={onStructureNow}
                    />
                  ) : sourceId === 'youtube' ? (
                    <YouTubePanel onInsert={onInsertText} onClose={onClose} />
                  ) : sourceId === 'raw' ? (
                    <RawPanel onInsert={onInsertText} onClose={onClose} />
                  ) : (
                    <NotionPanel onInsert={onInsertText} onClose={onClose} />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddMaterialModal;