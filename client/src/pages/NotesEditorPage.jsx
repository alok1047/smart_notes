import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProcessedNotes from '../components/ProcessedNotes';
import RevisionMode from '../components/RevisionMode';
import HighlightedEditor from '../components/HighlightedEditor';
import ProcessSettingsModal from '../components/ProcessSettingsModal';
import NotesChat from '../components/NotesChat';
import {
  saveRawNotes,
  saveProcessedNotes,
  processNotes,
  streamProcessNotes,
  uploadLectureFile,
} from '../services/lectureService';
import { getAISettings } from '../utils/aiSettings';
import { getIdToken } from '../services/firebase';

import {
  ArrowLeft,
  Save,
  Sparkles,
  Eye,
  Edit3,
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  FileUp,
  UploadCloud,
  MessageCircle,
} from 'lucide-react';

const TABS = [
  { id: 'raw', label: 'Raw', icon: Edit3 },
  { id: 'processed', label: 'Processed', icon: Eye },
  { id: 'revision', label: 'Revision', icon: Zap },
];

const NotesEditorPage = () => {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [lecture, setLecture] = useState(null);
  const [subject, setSubject] = useState(null);
  const [rawNotes, setRawNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showProcessSettings, setShowProcessSettings] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [saveStatus, setSaveStatus] = useState(null);
  const [processError, setProcessError] = useState('');

  const [pendingNotes, setPendingNotes] = useState(null);
  const [activeTab, setActiveTab] = useState('processed');
  const [lastSaved, setLastSaved] = useState(null);

  const saveRef = useRef(null);
  const fileInputRef = useRef(null);

  const [visible, setVisible] = useState(true);
  const [aiConfig, setAiConfig] = useState(getAISettings());

  /* ---------------- AI SETTINGS ---------------- */

  useEffect(() => {
    const handleSettingsChange = () => {
      setAiConfig(getAISettings());
    };
    window.addEventListener('aiSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('aiSettingsChanged', handleSettingsChange);
  }, []);

  /* ---------------- LOAD LECTURE ---------------- */

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await getIdToken();
        const res = await fetch(`/api/lectures/single/${lectureId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setLecture(data.lecture);
          setSubject(data.subject);
          setRawNotes(data.lecture.rawNotes || '');

          if (!data.lecture.processedNotes?.trim()) {
            setActiveTab('raw');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [lectureId]);

  /* ---------------- AUTO SAVE ---------------- */

  const debouncedSave = useCallback(
    (notes) => {
      if (saveRef.current) clearTimeout(saveRef.current);

      saveRef.current = setTimeout(async () => {
        try {
          setSaving(true);
          const r = await saveRawNotes(lectureId, notes);
          setLecture(r.lecture);
          setSaveStatus('saved');
          setLastSaved(new Date());
          setTimeout(() => setSaveStatus(null), 3000);
        } catch {
          setSaveStatus('error');
        } finally {
          setSaving(false);
        }
      }, 1200);
    },
    [lectureId]
  );

  const handleRawChange = (value) => {
    const text = typeof value === 'string' ? value : value?.target?.value || '';
    setRawNotes(text);
    debouncedSave(text);
  };

  /* ---------------- MANUAL SAVE ---------------- */

  const handleManualSave = async () => {
    if (saveRef.current) clearTimeout(saveRef.current);

    try {
      setSaving(true);
      const r = await saveRawNotes(lectureId, rawNotes);
      setLecture(r.lecture);
      setSaveStatus('saved');
      setLastSaved(new Date());
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- PROCESSED NOTES ---------------- */

  const handleSaveProcessed = async (newContent) => {
    const r = await saveProcessedNotes(lectureId, newContent);
    setLecture(r.lecture);
  };

  /* ---------------- STREAMING PROCESS AI ---------------- */

  const handleProcessStream = async (options) => {
    setShowProcessSettings(false);
    if (!rawNotes.trim()) {
      setProcessError('Write some notes first.');
      return;
    }

    try {
      setProcessing(true);
      setStreaming(true);
      setProcessError('');
      setStreamingText('');

      if (saveRef.current) clearTimeout(saveRef.current);
      await saveRawNotes(lectureId, rawNotes);

      switchTab('processed');

      await streamProcessNotes(
        lectureId,
        aiConfig.provider,
        aiConfig.apiKey,
        options,
        (chunk, accumulatedText) => {
          setStreamingText(accumulatedText);
        },
        (finalText) => {
          setLecture(prev => ({ ...prev, processedNotes: finalText }));
          setPendingNotes(null);
          setStreamingText('');
          setStreaming(false);
          setProcessing(false);
        },
        (err) => {
          setProcessError(err.message || 'AI streaming failed.');
          setStreaming(false);
          setProcessing(false);
        }
      );
    } catch (e) {
      setProcessError(e.message || 'AI processing failed.');
      setStreaming(false);
      setProcessing(false);
    }
  };

  /* ---------------- FILE IMPORT (PDF/IMAGE OCR) ---------------- */

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      setProcessError('');
      const data = await uploadLectureFile(lectureId, file, aiConfig.apiKey);
      if (data.extractedText) {
        const updated = rawNotes
          ? `${rawNotes}\n\n--- Imported Slide (${data.filename}) ---\n${data.extractedText}`
          : data.extractedText;

        setRawNotes(updated);
        debouncedSave(updated);
        setActiveTab('raw');
      }
    } catch (err) {
      setProcessError(err.response?.data?.error || err.message || 'File import failed.');
    } finally {
      setUploadingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  /* ---------------- ACCEPT NOTES ---------------- */

  const acceptPendingNotes = async () => {
    if (!pendingNotes) return;
    try {
      setProcessing(true);
      await handleSaveProcessed(pendingNotes);
      setPendingNotes(null);
    } catch (e) {
      console.error('Failed to accept notes:', e);
    } finally {
      setProcessing(false);
    }
  };

  /* ---------------- TAB SWITCH ---------------- */

  const switchTab = (id) => {
    if (id === activeTab) return;
    setVisible(false);
    setTimeout(() => {
      setActiveTab(id);
      setVisible(true);
    }, 150);
  };

  /* ---------------- KEYBOARD SAVE ---------------- */

  useEffect(() => {
    const kd = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeTab === 'raw') handleManualSave();
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, [rawNotes, activeTab]);

  /* ---------------- CLEANUP ---------------- */

  useEffect(() => {
    return () => {
      if (saveRef.current) clearTimeout(saveRef.current);
    };
  }, []);

  const fmtTime = (d) =>
    d?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="app-layout">
        <div className="main-content">
          <div className="topbar px-5">
            <div className="skeleton h-5 w-64 rounded" />
            <div className="ml-auto flex gap-2">
              <div className="skeleton h-8 w-24 rounded-md" />
              <div className="skeleton h-8 w-32 rounded-md" />
            </div>
          </div>
          <div className="flex-1 p-6">
            <div className="skeleton w-full h-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,image/*"
        className="hidden"
      />

      <div className="main-content min-w-0">
        {/* TOP BAR */}
        <header className="topbar px-4 sm:px-6">
          {/* LEFT */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => subject && navigate(`/lectures/${subject._id}`)}
              className="btn-ghost px-2 py-1.5 shrink-0"
              title="Back to lectures"
            >
              <ArrowLeft size={14} />
            </button>

            <div className="min-w-0">
              <p className="text-[13px] font-medium text-(--text) truncate leading-tight">
                {lecture?.title?.trim() || `Lecture ${lecture?.lectureNumber}`}
              </p>
              <p className="text-[11px] text-(--text-faint) truncate mt-0.5">
                {subject?.name}
              </p>
            </div>
          </div>

          {/* CENTER TABS */}
          <div className="flex-1 flex justify-center px-4">
            <div className="pill-tabs">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  className={`pill-tab ${activeTab === id ? 'active' : ''}`}
                >
                  <Icon size={12} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2 shrink-0">
            {/* FILE IMPORT BUTTON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="btn-secondary text-[12px] flex items-center gap-1.5"
              title="Import PDF Slide or Whiteboard Photo"
            >
              {uploadingFile ? (
                <Loader2 size={12} className="animate-spin text-[#2383e2]" />
              ) : (
                <FileUp size={13} className="text-[#2383e2]" />
              )}
              <span className="hidden md:inline">
                {uploadingFile ? 'Extracting...' : 'Import Slide'}
              </span>
            </button>

            {/* SAVE STATUS */}
            <div className="hidden md:flex items-center gap-1.5 min-w-[70px] justify-end">
              {saving && <Loader2 size={12} className="animate-spin text-(--text-faint)" />}
              {saveStatus === 'saved' && !saving && (
                <span className="flex items-center gap-1 text-[11px] text-(--success)">
                  <CheckCircle2 size={11} /> Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-[11px] text-(--danger)">
                  <AlertCircle size={11} /> Error
                </span>
              )}
              {lastSaved && !saving && !saveStatus && (
                <span className="flex items-center gap-1 text-[11px] text-(--text-faint)">
                  <Clock size={10} /> {fmtTime(lastSaved)}
                </span>
              )}
            </div>

            {/* SAVE */}
            {activeTab === 'raw' && (
              <button
                onClick={handleManualSave}
                disabled={saving}
                className="btn-secondary"
                title="Ctrl+S"
              >
                <Save size={12} />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}

            {/* PROVIDER */}
            <div className="hidden lg:flex provider-pill">
              <Sparkles size={10} />
              {aiConfig.provider}
            </div>

            {/* STREAM PROCESS BUTTON */}
            <button
              onClick={() => setShowProcessSettings(true)}
              disabled={processing || !rawNotes.trim()}
              className="btn-primary"
            >
              {processing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span className="hidden sm:inline">
                {processing ? 'Streaming...' : 'Process (Live)'}
              </span>
            </button>

            {/* CHAT WITH NOTES BUTTON */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="btn-secondary hidden sm:flex"
              title="Chat with Notes"
            >
              <MessageCircle size={12} />
              <span className="hidden md:inline">Chat</span>
            </button>
          </div>
        </header>

        {/* ERROR */}
        {processError && (
          <div className="flex items-center gap-2 px-5 py-2.5 text-[13px] animate-fade-in shrink-0 bg-(--danger-soft) border-b border-(--border-subtle) text-(--danger)">
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1">{processError}</span>
            <button onClick={() => setProcessError('')} className="opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* PROCESS SETTINGS MODAL */}
        {showProcessSettings && (
          <ProcessSettingsModal
            onClose={() => setShowProcessSettings(false)}
            onConfirm={handleProcessStream}
          />
        )}

        {/* CONTENT */}
        <main
          className="flex-1 min-h-0 overflow-hidden"
          style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.15s ease' }}
        >
          {/* RAW */}
          {activeTab === 'raw' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-5 sm:px-8 py-2.5 shrink-0 border-b border-(--border-subtle) bg-(--bg-subtle) overflow-x-auto">
                <span className="text-[11px] text-(--text-faint) shrink-0">
                  Tip: Use <code className="text-[#2383e2]">//ai make table</code> or <code className="text-[#2383e2]">//ai simplify</code> for AI instructions. Click <b>Import Slide</b> to upload PDF/Photos.
                </span>
              </div>
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <HighlightedEditor
                  value={rawNotes}
                  onChange={handleRawChange}
                  placeholder="Type or paste messy lecture notes here..."
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* PROCESSED (STREAMING SUPPORT) */}
          {activeTab === 'processed' && (
            <ProcessedNotes
              content={streaming ? streamingText : (pendingNotes || lecture?.processedNotes || '')}
              isPendingMode={!!pendingNotes && !streaming}
              isStreaming={streaming}
              onAccept={acceptPendingNotes}
              onDiscard={() => setPendingNotes(null)}
              lectureId={lectureId}
              onSave={handleSaveProcessed}
            />
          )}

          {/* REVISION */}
          {activeTab === 'revision' && (
            <RevisionMode
              content={pendingNotes || lecture?.processedNotes || ''}
              lectureId={lectureId}
            />
          )}
        </main>
      </div>

      <NotesChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        subjectId={subject?._id} 
      />
    </div>
  );
};

export default NotesEditorPage;