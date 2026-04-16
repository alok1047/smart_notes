import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ProcessedNotes from '../components/ProcessedNotes';
import RevisionMode from '../components/RevisionMode';
import HighlightedEditor from '../components/HighlightedEditor';
import { saveRawNotes, saveProcessedNotes, processNotes } from '../services/lectureService';
import { getAISettings } from '../utils/aiSettings';
import { getIdToken } from '../services/firebase';
import {
  ArrowLeft, Save, Sparkles, Eye, Edit3, Zap,
  Loader2, CheckCircle2, AlertCircle, Clock, X
} from 'lucide-react';

const TABS = [
  { id: 'raw', label: 'Raw Notes', icon: Edit3 },
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
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'error' | null
  const [processError, setProcessError] = useState('');
  const [activeTab, setActiveTab] = useState('processed'); // default: processed
  const [lastSaved, setLastSaved] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const saveRef = useRef(null);
  const [visible, setVisible] = useState(true); // for tab fade transitions
  const [aiConfig, setAiConfig] = useState(getAISettings());

  // Listen for AI settings changes across the app
  useEffect(() => {
    const handleSettingsChange = () => setAiConfig(getAISettings());
    window.addEventListener('aiSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('aiSettingsChanged', handleSettingsChange);
  }, []);

  // --- Data fetching ---
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
          // If no processed notes yet, default to raw editor
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

  // --- Auto-save raw notes ---
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

  // --- Manual save ---
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

  // --- Save processed notes (from edit mode in ProcessedNotes) ---
  const handleSaveProcessed = async (newContent) => {
    const r = await saveProcessedNotes(lectureId, newContent);
    setLecture(r.lecture);
  };

  // --- AI Process ---
  const handleProcess = async () => {
    if (!rawNotes.trim()) { setProcessError('Write some notes first!'); return; }
    try {
      setProcessing(true);
      setProcessError('');
      // Save raw first, then process
      if (saveRef.current) clearTimeout(saveRef.current);
      await saveRawNotes(lectureId, rawNotes);
      const r = await processNotes(lectureId, aiConfig.provider, aiConfig.apiKey);
      setLecture(r.lecture);
      switchTab('processed');
    } catch (e) {
      setProcessError(e.response?.data?.error || 'AI processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // --- Tab switch with fade ---
  const switchTab = (id) => {
    if (id === activeTab) return;
    setVisible(false);
    setTimeout(() => {
      setActiveTab(id);
      setVisible(true);
    }, 150);
  };

  // Ctrl/Cmd + S
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

  useEffect(() => () => { if (saveRef.current) clearTimeout(saveRef.current); }, []);

  const fmtTime = (d) =>
    d?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // --- Loading ---
  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar collapsed onToggle={() => {}} onNewSubject={() => {}} />
        <div className="main-content sidebar-collapsed">
          <div className="topbar">
            <div className="skeleton h-5 w-64 rounded" />
            <div className="ml-auto flex gap-2">
              <div className="skeleton h-8 w-24 rounded-lg" />
              <div className="skeleton h-8 w-32 rounded-lg" />
            </div>
          </div>
          <div className="skeleton" style={{ margin: '16px', height: 'calc(100vh - 84px)', borderRadius: '12px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onNewSubject={() => navigate('/dashboard')}
      />

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Top bar */}
        <header className="topbar" style={{ gap: '12px' }}>
          {/* Back + title */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <button
              onClick={() => subject && navigate(`/lectures/${subject._id}`)}
              className="btn-ghost px-2 py-1.5 flex-shrink-0"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0 hidden sm:block">
              <p className="text-[13px] font-semibold text-[#d4d4d4] truncate leading-none">
                Lecture {lecture?.lectureNumber}
              </p>
              <p className="text-[11px] text-[#525252] truncate mt-0.5">{subject?.name}</p>
            </div>
          </div>

          {/* CENTER: Pill tabs */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center" style={{ gap: '8px' }}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  className="flex items-center gap-2 px-8 py-3 rounded-full text-[14px] font-semibold transition-all duration-200"
                  style={
                    activeTab === id
                      ? { background: '#7c3aed', color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }
                      : { background: '#1a1a1a', color: '#525252', border: '1px solid #2a2a2a' }
                  }
                  onMouseEnter={e => {
                    if (activeTab !== id) { e.currentTarget.style.color = '#d4d4d4'; e.currentTarget.style.borderColor = '#404040'; }
                  }}
                  onMouseLeave={e => {
                    if (activeTab !== id) { e.currentTarget.style.color = '#525252'; e.currentTarget.style.borderColor = '#2a2a2a'; }
                  }}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Save indicator */}
            <div className="hidden sm:flex items-center gap-1.5">
              {saving && <Loader2 size={12} className="animate-spin" style={{ color: '#525252' }} />}
              {saveStatus === 'saved' && !saving && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#22c55e' }}>
                  <CheckCircle2 size={11} /> Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#f43f5e' }}>
                  <AlertCircle size={11} /> Error
                </span>
              )}
              {lastSaved && !saving && !saveStatus && (
                <span className="flex items-center gap-1 text-[11px]" style={{ color: '#404040' }}>
                  <Clock size={10} /> {fmtTime(lastSaved)}
                </span>
              )}
            </div>

            {/* Save button — only visible in raw tab */}
            {activeTab === 'raw' && (
              <button
                onClick={handleManualSave}
                disabled={saving}
                className="btn-secondary"
                title="Ctrl+S"
              >
                <Save size={13} />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}

            {/* Process with AI */}
            <div className="flex bg-[#111] p-1.5 rounded-[12px] border border-[#2a2a2a] items-center gap-3">
              <span className="hidden lg:flex items-center gap-1.5 px-2 text-[11px] font-medium text-[#7c3aed] uppercase tracking-wide">
                <Sparkles size={12} />
                Using: {aiConfig.provider}
              </span>
              <button
                onClick={handleProcess}
                disabled={processing || !rawNotes.trim()}
                className="btn-primary"
              >
                {processing
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Sparkles size={13} />
                }
                <span className="hidden sm:inline">
                  {processing ? `Processing with ${aiConfig.provider}…` : 'Process with AI'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Error banner */}
        {processError && (
          <div
            className="flex items-center gap-2 px-5 py-2.5 text-[13px] animate-fade-in flex-shrink-0"
            style={{
              background: 'rgba(244,63,94,0.08)',
              borderBottom: '1px solid rgba(244,63,94,0.15)',
              color: '#f43f5e',
            }}
          >
            <AlertCircle size={14} className="flex-shrink-0" />
            <span className="flex-1">{processError}</span>
            <button onClick={() => setProcessError('')} style={{ opacity: 0.5 }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Main content area */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          {/* ── RAW NOTES ── */}
          {activeTab === 'raw' && (
            <div className="h-full flex flex-col">
              {/* Hints bar */}
              <div
                className="flex items-center gap-3 px-8 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid #1f1f1f' }}
              >
                <span className="text-[11px]" style={{ color: '#404040' }}>
                  AI commands:
                </span>
                {['//ai make table', '//ai simplify', '//ai exam points', '//ai code'].map(cmd => (
                  <code
                    key={cmd}
                    className="text-[11px] px-2 py-0.5 rounded"
                    style={{ background: '#1f1f1f', color: '#a78bfa', border: '1px solid #2a2a2a' }}
                  >
                    {cmd}
                  </code>
                ))}
              </div>
              <div className="flex-1 flex flex-col w-full mx-auto" style={{ maxWidth: '900px', minHeight: 0 }}>
                <HighlightedEditor
                  value={rawNotes}
                  onChange={handleRawChange}
                  placeholder={`Start writing your lecture notes here…\n\nExamples:\n  binary search tree //ai make table\n  recursion //ai simplify\n  important formulas //ai exam points\n\nWrite freely — Hinglish works too!`}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* ── PROCESSED NOTES ── */}
          {activeTab === 'processed' && (
            <ProcessedNotes
              content={lecture?.processedNotes}
              lectureId={lectureId}
              onSave={handleSaveProcessed}
            />
          )}

          {/* ── REVISION MODE ── */}
          {activeTab === 'revision' && (
            <RevisionMode content={lecture?.processedNotes} />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesEditorPage;
