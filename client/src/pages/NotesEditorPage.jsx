import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ProcessedNotes from '../components/ProcessedNotes';
import RevisionMode from '../components/RevisionMode';
import HighlightedEditor from '../components/HighlightedEditor';
import ProcessSettingsModal from '../components/ProcessSettingsModal';
import AddMaterialModal from '../components/AddMaterialModal';
import ProcessingModal from '../components/ProcessingModal';
import pdfLoadingAnimation from '../assets/loading3.json';
import { SOURCES } from '../utils/inputSources';
import HistoryView from '../components/HistoryView';
import NotesChat from '../components/NotesChat';
import {
  getSingleLecture,
  saveRawNotes,
  saveProcessedNotes,
  streamProcessNotes,
} from '../services/lectureService';
import { getAISettings } from '../utils/aiSettings';

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FilePlus2,
  History,
  Loader2,
  MessageCircle,
  Save,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

const TABS = [
  { id: 'raw', label: 'Raw', icon: Edit3 },
  { id: 'structured', label: 'Structured', icon: Eye },
  { id: 'history', label: 'History', icon: History },
  { id: 'revision', label: 'Revision', icon: Zap },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
];

const PROCESS_STAGES = [
  { key: 'transcript', label: 'Transcript' },
  { key: 'clean', label: 'Clean' },
  { key: 'structure', label: 'Structure' },
  { key: 'knowledge', label: 'Knowledge' },
  { key: 'rag', label: 'RAG' },
];

/* Premium empty state — "What would you like to organize?" */
const EmptyState = ({ onPick, onType }) => (
  <div className="h-full flex flex-col items-center justify-center text-center px-6 overflow-y-auto">
    <div className="w-12 h-12 rounded-2xl bg-(--accent-soft) border border-(--accent-ring) flex items-center justify-center text-(--accent-text) mb-5">
      <Sparkles size={20} />
    </div>
    <h2 className="font-display text-[24px] sm:text-[28px] text-(--text) tracking-tight">
      What would you like to organize?
    </h2>
    <p className="mt-2 text-[13.5px] text-(--text-dim) max-w-md leading-relaxed">
      Drop a PDF, paste a YouTube link, import a Notion page, or type messy notes — NotesSync
      structures it into searchable knowledge.
    </p>

    <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-xl">
      {SOURCES.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s.id)}
            className="group flex items-center gap-2.5 rounded-xl border border-(--border-subtle) bg-(--surface) px-3.5 py-3 text-left hover:border-(--accent-ring) hover:bg-(--surface-hover) transition-colors"
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-(--border-subtle) shadow-sm"
              style={{ background: s.bg }}
            >
              <Icon size={14} color={s.color} />
            </span>
            <span className="min-w-0">
              <span className="block text-[12.5px] font-semibold text-(--text)">{s.title}</span>
              {s.todo && (
                <span className="text-[10px] text-(--text-faint) font-medium uppercase tracking-wide">Soon</span>
              )}
            </span>
          </button>
        );
      })}
    </div>

    <button
      type="button"
      onClick={onType}
      className="mt-7 text-[12.5px] text-(--text-faint) hover:text-(--text-dim) transition-colors underline underline-offset-4"
    >
      or start typing raw notes
    </button>
  </div>
);

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
  const [showProcessSettings, setShowProcessSettings] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [addMaterialSource, setAddMaterialSource] = useState(null);
  const [searchParams] = useSearchParams();
  const consumedAdd = useRef(false);

  const [saveStatus, setSaveStatus] = useState(null);
  const [processError, setProcessError] = useState('');
  const [pendingNotes, setPendingNotes] = useState(null);
  const [activeTab, setActiveTab] = useState('raw');
  const [lastSaved, setLastSaved] = useState(null);
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [showProcessing, setShowProcessing] = useState(false);
  const [processStage, setProcessStage] = useState(2);
  const [processDone, setProcessDone] = useState(false);
  const [processMeta, setProcessMeta] = useState({
    heading: 'Structuring your lecture',
    sub: 'Turning the transcript into searchable knowledge.',
    detail: '',
  });

  const saveRef = useRef(null);
  const [aiConfig, setAiConfig] = useState(getAISettings());

  const addParam = searchParams.get('add');
  if (!consumedAdd.current && !showAddMaterial && addParam && SOURCES.some((s) => s.id === addParam)) {
    consumedAdd.current = true;
    setAddMaterialSource(addParam);
    setShowAddMaterial(true);
  }

  /* ---------------- AI SETTINGS ---------------- */

  useEffect(() => {
    const handleSettingsChange = () => setAiConfig(getAISettings());
    window.addEventListener('aiSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('aiSettingsChanged', handleSettingsChange);
  }, []);

  /* ---------------- LOAD LECTURE ---------------- */

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getSingleLecture(lectureId);
        setLecture(data.lecture);
        setSubject(data.subject);
        setRawNotes(data.lecture.rawNotes || '');
        setActiveTab(data.lecture.processedNotes?.trim() ? 'structured' : 'raw');
      } catch (e) {
        console.error('Failed to load lecture:', e);
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

  const handleManualSave = useCallback(async () => {
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
  }, [lectureId, rawNotes]);

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

    const sections = (rawNotes.match(/^#{1,4}\s/gm) || []).length;
    const segments = (rawNotes.match(/^\d{1,2}:\d{2}\s/gm) || []).length;
    setProcessDone(false);
    setProcessStage(2);
    setProcessMeta({
      heading: 'Structuring your lecture',
      sub: 'Turning the transcript into searchable knowledge.',
      detail: segments ? `${segments} transcript segments` : sections ? `${sections} sections detected` : '',
    });
    setShowProcessing(true);

    try {
      setProcessing(true);
      setStreaming(true);
      setProcessError('');
      setStreamingText('');

      if (saveRef.current) clearTimeout(saveRef.current);
      await saveRawNotes(lectureId, rawNotes);

      switchTab('structured');

      await streamProcessNotes(
        lectureId,
        aiConfig.provider,
        aiConfig.apiKey,
        { ...options, model: aiConfig.model || undefined },
        (chunk, accumulatedText) => {
          setStreamingText(accumulatedText);
        },
        (finalText) => {
          setLecture((prev) => ({ ...prev, processedNotes: finalText }));
          setPendingNotes(null);
          setStreamingText('');
          setStreaming(false);
          setProcessing(false);
          setProcessStage(4);
          setProcessDone(true);
          setProcessMeta((prev) => ({ ...prev, heading: 'Your lecture is ready.', sub: '', detail: '' }));
        },
        (err) => {
          setProcessError(err.message || 'AI streaming failed.');
          setStreaming(false);
          setProcessing(false);
          setShowProcessing(false);
        },
        (stage) => {
          if (stage === 'knowledge') {
            setProcessStage(3);
            setProcessMeta((prev) => ({
              ...prev,
              heading: 'Building knowledge connections',
              sub: 'Chunking and embedding concepts for search.',
              detail: sections ? `${sections} sections detected` : prev.detail,
            }));
          } else if (stage === 'rag') {
            setProcessStage(4);
            setProcessMeta((prev) => ({
              ...prev,
              heading: 'Indexing for RAG',
              sub: 'Preparing instant answers from your notes.',
              detail: '',
            }));
          }
        }
      );
    } catch (e) {
      setProcessError(e.message || 'AI processing failed.');
      setStreaming(false);
      setProcessing(false);
      setShowProcessing(false);
    }
  };

  /* ---------------- ADD MATERIAL ---------------- */

  const handleInsertMaterial = (payload) => {
    const text = payload?.text || '';
    if (!text.trim()) return;
    const sep = payload.filename ? `--- ${payload.filename} ---\n` : '';
    const updated = rawNotes ? `${rawNotes}\n\n${sep}${text}` : text;
    setRawNotes(updated);
    debouncedSave(updated);
    switchTab('raw');
  };

  const openAddMaterial = (source = null) => {
    setAddMaterialSource(source);
    setShowAddMaterial(true);
  };

  const openStructuredFromModal = () => {
    setShowProcessing(false);
    switchTab('structured');
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

  // Switch tabs instantly without toggling visibility to avoid layout shift.
  const switchTab = (id) => {
    if (id === 'chat') {
      setIsChatOpen(true);
      return;
    }
    if (id === activeTab) return;
    setActiveTab(id);
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
  }, [rawNotes, activeTab, handleManualSave]);

  /* ---------------- CLEANUP ---------------- */

  useEffect(() => () => { if (saveRef.current) clearTimeout(saveRef.current); }, []);

  const fmtTime = (d) => d?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const sourceMeta = /^> 🎬/.test(rawNotes.trim())
    ? 'Imported from YouTube'
    : /--- .*\.(pdf|png|jpe?g|webp) ---/i.test(rawNotes)
    ? 'PDF import'
    : '';

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
      <div className="main-content min-w-0">
        {/* ================= TOP BAR ================= */}
        <header className="topbar px-3 sm:px-5 gap-2">
          {/* LEFT — back + title */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <button
              onClick={() => subject && navigate(`/lectures/${subject._id}`)}
              className="btn-ghost px-2 py-1.5 shrink-0"
              title="Back to lectures"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="min-w-0 hidden sm:block">
              <p className="text-[13px] truncate leading-tight">
                <span className="text-(--text) font-semibold">{subject?.name || 'Subject'}</span>
                <span className="text-(--text-faint) mx-1.5">/</span>
                <span className="text-(--text-dim)">{lecture?.title?.trim() || `Lecture ${lecture?.lectureNumber}`}</span>
              </p>
            </div>
          </div>

          {/* CENTER — tabs */}
          <div className="flex-1 flex justify-center min-w-0 px-2">
            <div className="pill-tabs overflow-x-auto max-w-full" role="tablist" aria-label="Lecture views">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTab === id}
                  onClick={() => switchTab(id)}
                  className={`pill-tab shrink-0 ${activeTab === id ? 'active' : ''}`}
                >
                  <Icon size={13} />
                  <span className="hidden md:inline text-[11px] font-medium tracking-wider">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — actions */}
          <div className="flex items-center gap-1.5 shrink-0">

            <button
              onClick={() => openAddMaterial(null)}
              className="btn-ghost px-2 py-1.5 text-[12px] transition-colors"
              title="Add PDF, images, YouTube, notes…"
            >
              <FilePlus2 size={14} className="text-(--accent-text)" />
              <span className="hidden lg:inline text-[11px] font-medium tracking-wider">Add material</span>
            </button>

            {activeTab === 'raw' && (
              <button
                onClick={handleManualSave}
                disabled={saving || !rawNotes.trim()}
                className="btn-secondary px-2.5 py-1.5 text-[12px] transition-colors"
                title="Save raw notes (⌘S)"
              >
                <Save size={13} />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}

            <button
              onClick={() => setShowProcessSettings(true)}
              disabled={processing || !rawNotes.trim()}
              className="btn-primary px-3 py-1.5 text-[12.5px]"
              title="Structure these notes with AI"
            >
              {processing || streaming ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              <span className="hidden sm:inline">
                {processing || streaming ? 'Processing…' : 'Process with AI'}
              </span>
            </button>
          </div>
        </header>

        {/* ================= STATUS STRIP ================= */}
        {(saving || saveStatus || lastSaved || streaming) && (
          <div className="flex items-center gap-3 px-5 h-7 text-[11.5px] border-b border-(--border-subtle) bg-(--bg-subtle) shrink-0">
            {saving && (
              <span className="flex items-center gap-1.5 text-(--text-faint)">
                <Loader2 size={11} className="animate-spin" /> Saving…
              </span>
            )}
            {saveStatus === 'saved' && !saving && (
              <span className="flex items-center gap-1.5 text-(--success)">
                <CheckCircle2 size={11} /> Saved
              </span>
            )}
            {saveStatus === 'error' && !saving && (
              <span className="flex items-center gap-1.5 text-(--danger)">
                Error saving — check your connection
              </span>
            )}
            {lastSaved && !saving && !saveStatus && !streaming && (
              <span className="flex items-center gap-1.5 text-(--text-faint)">
                <Clock size={10} /> Last saved {fmtTime(lastSaved)}
              </span>
            )}
            {streaming && (
              <span className="ml-auto flex items-center gap-1.5 text-(--accent-text)">
                <Sparkles size={11} /> AI structuring your notes…
              </span>
            )}
          </div>
        )}

        {/* ================= ERROR ================= */}
        {processError && (
          <div className="flex items-center gap-2 px-5 py-2.5 text-[13px] animate-fade-in shrink-0 bg-(--danger-soft) border-b border-(--border-subtle) text-(--danger)">
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1">{processError}</span>
            <button onClick={() => setProcessError('')} className="opacity-60 hover:opacity-100" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ================= MODALS ================= */}
        {showProcessSettings && (
          <ProcessSettingsModal
            onClose={() => setShowProcessSettings(false)}
            onConfirm={handleProcessStream}
          />
        )}

        <AddMaterialModal
          isOpen={showAddMaterial}
          onClose={() => setShowAddMaterial(false)}
          lectureId={lectureId}
          apiKey={aiConfig.provider === 'gemini' ? aiConfig.apiKey : ''}
          subjectName={subject?.name}
          initialSource={addMaterialSource}
          onInsertText={handleInsertMaterial}
          onStructureNow={() => {
            setShowAddMaterial(false);
            setShowProcessSettings(true);
          }}
        />

        {/* ================= CONTENT ================= */}
        <main
          className="flex-1 min-h-0 overflow-hidden"
        >
          {/* RAW */}
          {activeTab === 'raw' && (
            <div className="h-full flex flex-col">
              {!rawNotes.trim() && !showRawEditor ? (
                <EmptyState onPick={openAddMaterial} onType={() => setShowRawEditor(true)} />
              ) : (
                <>
                  <div className="shrink-0 px-6 sm:px-10 pt-8 pb-3 border-b border-(--border-subtle)">
                    <h2 className="font-display text-[26px] sm:text-[30px] text-(--text) tracking-tight leading-tight">
                      {lecture?.title?.trim() || `Lecture ${lecture?.lectureNumber}`}
                    </h2>
                    <p className="mt-1.5 text-[12.5px] text-(--text-faint)">
                      {subject?.name}
                      {sourceMeta ? ` · ${sourceMeta}` : ''}
                    </p>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <HighlightedEditor
                      value={rawNotes}
                      onChange={handleRawChange}
                      placeholder="Paste your messy notes here…"
                      autoFocus
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* STRUCTURED */}
{activeTab === 'structured' && (
  <div className="h-full flex flex-col">
    <ProcessedNotes
      content={streaming ? streamingText : (pendingNotes || lecture?.processedNotes || '')}
      isPendingMode={!!pendingNotes && !streaming}
      isStreaming={streaming}
      onAccept={acceptPendingNotes}
      onDiscard={() => setPendingNotes(null)}
      lectureId={lectureId}
      onSave={handleSaveProcessed}
    />
  </div>
)}

          {/* HISTORY */}
          {activeTab === 'history' && <HistoryView lectureId={lectureId} />}

          {/* REVISION */}
          {activeTab === 'revision' && (
            <RevisionMode
              content={pendingNotes || lecture?.processedNotes || ''}
              lectureId={lectureId}
              onAskAI={() => switchTab('chat')}
            />
          )}

          {/* CHAT — rendered as fixed right-side drawer below */}
        </main>
      </div>

      <NotesChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        subjectId={subject?._id}
      />

      <ProcessingModal
        open={showProcessing}
        source={{
          label: lecture?.title?.trim() || `Lecture ${lecture?.lectureNumber}`,
          meta: `${subject?.name || 'Subject'}${sourceMeta ? ` · ${sourceMeta}` : ''}`,
        }}
        stages={PROCESS_STAGES}
        activeIndex={processStage}
        state={processDone ? 'done' : 'running'}
        heading={processMeta.heading}
        sub={processMeta.sub}
        detail={processMeta.detail}
        loadingAnimation={pdfLoadingAnimation}
        onOpenStructured={openStructuredFromModal}
      />
    </div>
  );
};

export default NotesEditorPage;
