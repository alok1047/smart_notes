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
  const [saveStatus, setSaveStatus] = useState(null);
  const [processError, setProcessError] = useState('');
  const [pendingNotes, setPendingNotes] = useState(null);
  const [activeTab, setActiveTab] = useState('processed');
  const [lastSaved, setLastSaved] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const saveRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [aiConfig, setAiConfig] = useState(getAISettings());

  useEffect(() => {
    const handleSettingsChange = () => setAiConfig(getAISettings());
    window.addEventListener('aiSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('aiSettingsChanged', handleSettingsChange);
  }, []);

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

  const handleSaveProcessed = async (newContent) => {
    const r = await saveProcessedNotes(lectureId, newContent);
    setLecture(r.lecture);
  };

  const handleProcess = async () => {
    if (!rawNotes.trim()) { setProcessError('Write some notes first.'); return; }
    try {
      setProcessing(true);
      setProcessError('');
      if (saveRef.current) clearTimeout(saveRef.current);
      await saveRawNotes(lectureId, rawNotes);
      const r = await processNotes(lectureId, aiConfig.provider, aiConfig.apiKey);
      setLecture(r.lecture);
      if (r.processedNotes) {
        setPendingNotes(r.processedNotes);
      }
      switchTab('processed');
    } catch (e) {
      setProcessError(e.response?.data?.error || 'AI processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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

  const switchTab = (id) => {
    if (id === activeTab) return;
    setVisible(false);
    setTimeout(() => {
      setActiveTab(id);
      setVisible(true);
    }, 150);
  };

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

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar collapsed onToggle={() => {}} onNewSubject={() => {}} />
        <div className="main-content sidebar-collapsed">
          <div className="topbar">
            <div className="skeleton h-5 w-64 rounded" />
            <div className="ml-auto flex gap-2">
              <div className="skeleton h-8 w-24 rounded-md" />
              <div className="skeleton h-8 w-32 rounded-md" />
            </div>
          </div>
          <div className="skeleton m-4 rounded-lg flex-1" />
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
        <header className="topbar" style={{ gap: '12px' }}>
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <button
              onClick={() => subject && navigate(`/lectures/${subject._id}`)}
              className="btn-ghost px-2 py-1.5 shrink-0"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0 hidden sm:block">
              <p className="text-[13px] font-medium text-(--text) truncate leading-none">
                {lecture?.title?.trim() || `Lecture ${lecture?.lectureNumber}`}
              </p>
              <p className="text-[11px] text-(--text-faint) truncate mt-0.5">{subject?.name}</p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
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

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5">
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

            <div className="hidden lg:flex provider-pill">
              <Sparkles size={10} />
              {aiConfig.provider}
            </div>
            <button
              onClick={handleProcess}
              disabled={processing || !rawNotes.trim()}
              className="btn-primary"
            >
              {processing
                ? <Loader2 size={12} className="animate-spin" />
                : <Sparkles size={12} />
              }
              <span className="hidden sm:inline">
                {processing ? 'Processing...' : 'Process'}
              </span>
            </button>
          </div>
        </header>

        {processError && (
          <div className="flex items-center gap-2 px-5 py-2.5 text-[13px] animate-fade-in shrink-0 bg-(--danger-soft) border-b border-(--border-subtle) text-(--danger)">
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1">{processError}</span>
            <button onClick={() => setProcessError('')} style={{ opacity: 0.6 }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div
          className="flex-1 overflow-hidden"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.15s ease',
          }}
        >
          {activeTab === 'raw' && (
            <div className="h-full flex flex-col">
              <div className="flex items-center gap-2 px-8 py-2.5 shrink-0 border-b border-(--border-subtle) bg-(--bg-subtle)">
                <span className="text-[11px] text-(--text-faint)">AI commands:</span>
                {['//ai make table', '//ai simplify', '//ai exam points', '//ai code'].map(cmd => (
                  <code key={cmd} className="ai-chip">{cmd}</code>
                ))}
              </div>
              <div className="flex-1 flex flex-col w-full mx-auto" style={{ maxWidth: '900px', minHeight: 0 }}>
                <HighlightedEditor
                  value={rawNotes}
                  onChange={handleRawChange}
                  placeholder={`Start writing your lecture notes here...\n\nExamples:\n  binary search tree //ai make table\n  recursion //ai simplify\n  important formulas //ai exam points\n\nWrite freely — Hinglish works too.`}
                  autoFocus
                />
              </div>
            </div>
          )}

          {activeTab === 'processed' && (
            <ProcessedNotes
              content={pendingNotes !== null ? pendingNotes : lecture?.processedNotes}
              isPendingMode={pendingNotes !== null}
              onAccept={acceptPendingNotes}
              onDiscard={() => setPendingNotes(null)}
              lectureId={lectureId}
              onSave={handleSaveProcessed}
            />
          )}

          {activeTab === 'revision' && (
            <RevisionMode content={lecture?.processedNotes} />
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesEditorPage;
