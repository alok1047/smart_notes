import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';import {
  X,
  CloudUpload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileUp,
  RefreshCw,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { toErrorMessage } from '../utils/errors';
import { LottieMark, PipelineLoader } from './NotesLoader';
import pdfLoadingAnimation from '../assets/loading3.json';

const MAX_SIZE = 15 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

const STAGES = ['Reading file', 'Extracting text', 'Structuring notes', 'Ready'];

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const validateFile = (file) => {
  if (!ACCEPTED.includes(file.type)) {
    return 'Unsupported file type. Please upload a PDF, PNG, JPG, or WEBP file.';
  }
  if (file.size > MAX_SIZE) {
    return 'File is too large. Maximum allowed size is 15 MB.';
  }
  if (file.size === 0) {
    return 'This file appears to be empty.';
  }
  return null;
};

export default function FileImportDropzone({ lectureId, apiKey, onInsert, onClose, isOpen = true }) {
  const prefersReduced = useReducedMotion();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(0);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error

  const doUpload = useCallback(
    async (selected) => {
      const validation = validateFile(selected);
      if (validation) {
        setError(validation);
        setStatus('error');
        return;
      }

      setFile(selected);
      setError('');
      setStatus('uploading');
      setStage(0);

      // Staged progress simulation — the server returns the full result at the end,
      // so we walk through readable stages while the request is in flight.
      const timer = setInterval(() => {
        setStage((s) => {
          if (s < STAGES.length - 1) return s + 1;
          clearInterval(timer);
          return s;
        });
      }, 900);

      try {
        const formData = new FormData();
        formData.append('file', selected);
        if (apiKey) formData.append('apiKey', apiKey);

        const res = await fetch(`/api/lectures/${lectureId}/import-file`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('google_id_token') || ''}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(toErrorMessage({ response: { data } }, 'Import failed'));
        }

        clearInterval(timer);
        setStage(STAGES.length - 1);
        setStatus('done');
        setResult({ filename: data.filename, pageCount: data.pageCount, extractedText: data.extractedText });
      } catch (err) {
        clearInterval(timer);
        setError(toErrorMessage(err, 'Import failed.'));
        setStatus('error');
      }
    },
    [lectureId, apiKey]
  );

  const [result, setResult] = useState(null);

  const handleFiles = useCallback(
    (list) => {
      const selected = list?.[0];
      if (selected) doUpload(selected);
    },
    [doUpload]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer?.files);
    },
    [handleFiles]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setError('');
      setFile(null);
      setResult(null);
      setStage(0);
    }
  }, [isOpen]);

  const progress = Math.min(100, Math.round((stage / (STAGES.length - 1)) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Import file"
        >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReduced ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-xl border border-(--border) bg-(--surface-elevated) shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-subtle) bg-(--bg-subtle)">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-(--accent-soft) border border-(--accent-ring) flex items-center justify-center text-(--accent-text)">
              <FileUp size={13} />
            </span>
            <span className="text-[13.5px] font-semibold text-(--text)">Import file</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-md border border-(--border-subtle) hover:bg-(--surface-hover) flex items-center justify-center text-(--text-dim) transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          {/* IDLE: dropzone */}
          {status === 'idle' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragActive
                  ? 'border-(--accent) bg-(--accent-soft)'
                  : 'border-(--border) hover:border-(--accent-ring)'
              }`}
            >
              <div className="mx-auto w-10 h-10 rounded-full bg-(--accent-soft) border border-(--accent-ring) flex items-center justify-center text-(--accent-text)">
                <CloudUpload size={18} />
              </div>
              <p className="mt-3 text-[13.5px] font-semibold text-(--text)">
                Drag & drop a file
              </p>
              <p className="mt-1 text-[12px] text-(--text-dim)">
                PDF, PNG, JPG or WEBP · up to 15 MB
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 h-9 px-4 rounded-md bg-(--accent) hover:bg-(--accent-hover) text-white text-[12.5px] font-semibold transition-colors"
              >
                Browse files
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <p className="mt-3 text-[11px] text-(--text-faint)">
                Slide PDFs extract locally. Scanned pages use OCR with your AI key.
              </p>
            </div>
          )}

          {/* UPLOADING: staged progress */}
          {status === 'uploading' && file && (
            <div>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-md bg-(--accent-soft) border border-(--accent-ring) flex items-center justify-center text-(--accent-text)">
                  {file.type === 'application/pdf' ? <FileText size={16} /> : <ImageIcon size={16} />}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-(--text) truncate">{file.name}</p>
                  <p className="text-[11px] text-(--text-faint)">{formatBytes(file.size)}</p>
                </div>
                <span className="ml-auto text-[12px] font-mono text-(--accent-text) font-semibold">
                  {progress}%
                </span>
              </div>

              <div className="mt-4">
                <LottieMark size={96} src={file.type === 'application/pdf' ? pdfLoadingAnimation : undefined} />
              </div>

              <div className="mt-4">
                <PipelineLoader
                  state="PDF_EXTRACTING"
                  current={stage}
                  label={STAGES[stage]}
                />
              </div>
            </div>
          )}

          {/* DONE: success */}
          {status === 'done' && result && (
            <div>
              <div className="rounded-lg border border-(--success-soft) bg-(--success-soft)/40 p-4">
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-(--success-soft) flex items-center justify-center text-(--success)">
                    <CheckCircle2 size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-(--text)">Extraction complete</p>
                    <p className="text-[11.5px] text-(--text-dim) truncate">
                      {result.filename}
                      {result.pageCount ? ` · ${result.pageCount} pages` : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-(--text-dim)">
                  <Sparkles size={12} className="text-(--accent-text)" />
                  {result.extractedText ? `${result.extractedText.length.toLocaleString()} characters extracted` : 'Empty extraction'}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { onInsert(result.extractedText); onClose(); }}
                  className="h-9 rounded-md bg-(--accent) hover:bg-(--accent-hover) text-white text-[12.5px] font-semibold transition-colors"
                >
                  Insert into notes
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 rounded-md border border-(--border-subtle) hover:bg-(--surface-hover) text-[12.5px] text-(--text-dim) transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ERROR */}
          {status === 'error' && (
            <div>
              <div className="rounded-lg border border-(--danger-border) bg-(--danger-soft) p-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-(--danger-soft) flex items-center justify-center text-(--danger) shrink-0">
                    <AlertCircle size={15} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-(--text)">Import failed</p>
                    <p className="mt-1 text-[12.5px] leading-5 text-(--text-dim)">{error}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setStatus('idle'); setError(''); setFile(null); }}
                  className="h-9 rounded-md bg-(--accent) hover:bg-(--accent-hover) text-white text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={13} /> Try again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 rounded-md border border-(--border-subtle) hover:bg-(--surface-hover) text-[12.5px] text-(--text-dim) transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}