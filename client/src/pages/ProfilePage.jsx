import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getSubjects, updateSubject } from '../services/subjectService';
import { updateProfile } from '../services/userService';
import { toErrorMessage } from '../utils/errors';
import {
  User,
  Camera,
  Sparkles,
  Save,
  Check,
  X,
  Loader2,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not process image'));
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Could not read that image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.readAsDataURL(file);
  });

const ProfilePage = () => {
  const { dbUser, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null); // { type, text }
  const [savingPrompts, setSavingPrompts] = useState({});
  const [promptDrafts, setPromptDrafts] = useState({});
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    setName(dbUser?.name || user?.displayName || '');
    setAvatar(dbUser?.avatar || user?.photoURL || '');
  }, [dbUser, user]);

  const loadSubjects = useCallback(async () => {
    try {
      const res = await getSubjects();
      setSubjects(res || []);
      const drafts = {};
      (res || []).forEach((s) => { drafts[s._id] = s.systemPrompt || ''; });
      setPromptDrafts(drafts);
    } catch (e) {
      console.error('Failed to load subjects:', e);
    }
  }, []);
  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const photo = avatar || user?.photoURL || dbUser?.avatar || '';
  const displayName = name || dbUser?.name || user?.displayName || 'Student';
  const initials = displayName.charAt(0).toUpperCase();

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      setProfileMsg({ type: 'error', text: 'Image is too large. Max 2 MB.' });
      return;
    }
    try {
      const dataUrl = await resizeImage(file);
      setAvatar(dataUrl);
      setProfileMsg(null);
    } catch (err) {
      setProfileMsg({ type: 'error', text: toErrorMessage(err, 'Could not process image.') });
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      setProfileMsg({ type: 'error', text: 'Name cannot be empty.' });
      return;
    }
    setSaving(true);
    setProfileMsg(null);
    try {
      const payload = { name: name.trim() };
      if (avatar && avatar !== (dbUser?.avatar || user?.photoURL || '')) {
        payload.avatar = avatar;
      }
      const res = await updateProfile(payload);
      updateUser(res.user);
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: toErrorMessage(err, 'Could not update profile.') });
    } finally {
      setSaving(false);
    }
  };

  const savePrompt = async (subjectId) => {
    const value = (promptDrafts[subjectId] || '').trim();
    setSavingPrompts((p) => ({ ...p, [subjectId]: true }));
    try {
      await updateSubject(subjectId, { systemPrompt: value });
      setSubjects((prev) =>
        prev.map((s) => (s._id === subjectId ? { ...s, systemPrompt: value } : s))
      );
    } catch (err) {
      console.error('Failed to save prompt:', err);
    } finally {
      setSavingPrompts((p) => ({ ...p, [subjectId]: false }));
    }
  };

  const setPromptFor = (id, val) =>
    setPromptDrafts((d) => ({ ...d, [id]: val }));

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
        onNewSubject={() => navigate('/dashboard')}
      />

      <div className="main-content">
        <Topbar breadcrumb="Profile & AI Settings" />

        <div className="page-scroll">
          <div className="page-container max-w-3xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-(--accent-text) mb-3">
              Account
            </p>
            <h1 className="font-display text-[34px] sm:text-[40px] text-(--text) tracking-tight leading-[1.05]">
              Profile & <em className="text-(--accent-text)">AI behaviour.</em>
            </h1>
            <p className="mt-3 text-[14.5px] text-(--text-dim) max-w-xl leading-relaxed">
              Edit how you appear, and teach the AI how to structure notes for each subject.
            </p>

            {/* ---------------- PROFILE CARD ---------------- */}
            <div className="mt-8 rounded-2xl border border-(--border-subtle) bg-(--surface-elevated) p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-(--border) bg-(--surface-hover) flex items-center justify-center">
                    {photo ? (
                      <img src={photo} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[32px] font-bold text-(--accent-text)">{initials}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-(--accent) text-(--accent-fg) flex items-center justify-center shadow-lg border-2 border-(--surface-elevated) hover:opacity-90 transition-opacity"
                    aria-label="Change profile photo"
                    title="Upload a photo"
                  >
                    <Camera size={15} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                  />
                </div>

                {/* Fields */}
                <div className="flex-1 min-w-0 space-y-4">
                  <div>
                    <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-(--text-faint) mb-1.5">
                      Display name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input w-full text-[14px]"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-(--text-faint) mb-1.5">
                      Email
                    </label>
                    <input
                      value={dbUser?.email || user?.email || ''}
                      disabled
                      className="input w-full text-[14px] opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={saving}
                      className="btn-primary px-5 h-10 text-[13px] inline-flex items-center gap-2"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save profile
                    </button>
                    {photo && (
                      <button
                        type="button"
                        onClick={() => setAvatar('')}
                        className="text-[12.5px] text-(--text-dim) hover:text-(--danger) transition-colors"
                      >
                        Remove photo
                      </button>
                    )}
                  </div>
                  {profileMsg && (
                    <p className={`text-[12.5px] ${profileMsg.type === 'error' ? 'text-(--danger)' : 'text-(--success)'}`}>
                      {profileMsg.text}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ---------------- AI BEHAVIOUR PER SUBJECT ---------------- */}
            <div className="mt-8">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-9 h-9 rounded-lg bg-(--accent-soft) border border-(--accent-ring) flex items-center justify-center text-(--accent-text)">
                  <Sparkles size={16} />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-(--text)">AI behaviour per subject</h2>
                  <p className="text-[12px] text-(--text-dim)">
                    Give each subject a custom system prompt the AI follows when structuring notes.
                  </p>
                </div>
              </div>

              {subjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-(--border-strong) bg-(--surface) p-8 text-center">
                  <BookOpen size={20} className="mx-auto text-(--text-faint)" />
                  <p className="mt-3 text-[13px] text-(--text-dim)">
                    No subjects yet. Create a subject on the dashboard to add AI behaviour.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjects.map((s) => {
                    const open = expanded === s._id;
                    const busy = !!savingPrompts[s._id];
                    return (
                      <div
                        key={s._id}
                        className="rounded-2xl border border-(--border-subtle) bg-(--surface-elevated) overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpanded(open ? null : s._id)}
                          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-(--surface-hover) transition-colors"
                        >
                          <span
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-(--border-subtle)"
                            style={{ background: s.color || '#208383' }}
                          >
                            <BookOpen size={15} className="text-white" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-semibold text-(--text) truncate">{s.name}</span>
                            <span className="block text-[11.5px] text-(--text-faint truncate">
                              {s.systemPrompt ? 'Custom AI prompt set' : 'No custom prompt — default behaviour'}
                            </span>
                          </span>
                          {open ? <X size={16} className="text-(--text-dim)" /> : <ChevronDown size={16} className="text-(--text-dim)" />}
                        </button>

                        {open && (
                          <div className="px-5 pb-5 pt-1 border-t border-(--border-subtle)">
                            <label className="block text-[11.5px] font-semibold uppercase tracking-wider text-(--text-faint) mb-1.5">
                              System prompt
                            </label>
                            <textarea
                              value={promptDrafts[s._id] || ''}
                              onChange={(e) => setPromptFor(s._id, e.target.value)}
                              placeholder="e.g. Always explain concepts with real-world examples and include practice questions at the end."
                              className="input w-full resize-none text-[13px] leading-relaxed"
                              rows={5}
                            />
                            <div className="mt-2 flex items-center justify-between gap-3">
                              <p className="text-[11px] text-(--text-faint)">
                                This instructs the AI when structuring lectures in “{s.name}”.
                              </p>
                              <button
                                type="button"
                                onClick={() => savePrompt(s._id)}
                                disabled={busy}
                                className="btn-primary px-4 h-9 text-[12.5px] inline-flex items-center gap-1.5 shrink-0"
                              >
                                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                Save prompt
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
