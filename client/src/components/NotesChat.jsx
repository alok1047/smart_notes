import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Loader2, BookOpen, Copy, Check, Sparkles } from 'lucide-react';
import { chatWithNotes } from '../services/lectureService';
import { getAISettings } from '../utils/aiSettings';
import { toErrorMessage } from '../utils/errors';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const SUGGESTIONS = [
  'Summarize the key points',
  'Explain the most important concept',
  'What should I focus on for the exam?',
  'List important formulas or definitions',
];

const NotesChat = ({ isOpen, onClose, subjectId, inline = false }) => {
  const prefersReduced = useReducedMotion();
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! Ask me any question about your notes for this subject. Answers are grounded only in your notes." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setInput('');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const settings = getAISettings();
      const apiKey = settings.provider === 'openai' ? settings.openaiKey : (settings.provider === 'groq' ? settings.groqKey : settings.geminiKey);
      const key = settings.apiKey || apiKey || '';

      const res = await chatWithNotes(subjectId, userMsg, settings.provider, key, settings.model);
      setMessages(prev => [...prev, { role: 'ai', content: res.answer, citations: res.citations || [] }]);
    } catch (error) {
      const errorMsg = toErrorMessage(error, "Sorry, I ran into an error while checking your notes.");
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLastAnswer = async () => {
    const last = [...messages].reverse().find(m => m.role === 'ai' && m.content);
    if (!last) return;
    try {
      await navigator.clipboard.writeText(last.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  };

  return (
    <>
      {!inline && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="fixed inset-0 bg-black/40 z-40 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
          )}
        </AnimatePresence>
      )}

      <motion.div
className={
          inline
            ? 'h-full w-full flex flex-col'
            : 'fixed inset-y-0 right-0 w-[400px] max-w-full bg-(--bg) border-l border-(--border-subtle) shadow-2xl z-50 flex flex-col'
        }
        initial={prefersReduced || inline ? false : { x: '100%' }}
        animate={{ x: 0 }}
        exit={prefersReduced ? undefined : { x: '100%' }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between p-4 border-b border-(--border-subtle) bg-(--surface)">
          <h2 className="font-semibold text-(--text) flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-md bg-(--accent-soft) border border-(--accent-ring) flex items-center justify-center text-(--accent-text)">
              <Bot size={13} />
            </span>
            Ask your notes
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={copyLastAnswer}
              className="btn-ghost p-1.5 rounded-md"
              title="Copy last answer"
            >
              {copied ? <Check size={15} className="text-(--success)" /> : <Copy size={15} />}
            </button>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-md" aria-label="Close chat">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-(--bg-subtle)">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[92%] p-3 rounded-xl text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-(--accent) text-(--bg) rounded-br-sm'
                  : 'bg-(--surface) border border-(--border-subtle) text-(--text) rounded-bl-sm shadow-sm'
              }`}>
                {msg.role === 'ai' ? (
                  <>
                    <div className="markdown-body !p-0 !text-[13px] max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {msg.citations?.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-(--border-subtle) flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10.5px] font-semibold text-(--text-faint) uppercase tracking-wide">Sources</span>
                        {msg.citations.slice(0, 3).map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-(--bg-subtle) text-[10.5px] text-(--text-dim)">
                            <BookOpen size={9} className="text-(--accent-text)" />
                            Lecture {c.lectureNumber}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-(--surface) border border-(--border-subtle) text-(--text-dim) p-3 rounded-xl rounded-bl-sm flex items-center gap-3 text-[13px] shadow-sm">
                <span className="w-5 h-5 relative shrink-0">
                  <span className="absolute inset-0 rounded-full border-2 border-(--border-strong) border-t-(--accent-text) animate-spin" />
                </span>
                <div>
                  <p className="font-medium text-(--text) text-[12.5px]">Ask your notes</p>
                  <p className="text-[11.5px] text-(--text-faint) mt-0.5">Searching your notes…</p>
                </div>
              </div>
            </div>
          )}
          {messages.length === 1 && !isLoading && (
            <div className="mt-2">
              <p className="text-[11px] font-semibold text-(--text-faint) uppercase tracking-wide mb-2">
                Try asking
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="px-2.5 py-1.5 rounded-md border border-(--border-subtle) bg-(--surface) text-[12px] text-(--text-dim) hover:border-(--accent-ring) hover:text-(--accent-text) transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles size={11} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-(--border-subtle) bg-(--surface)">
          <div className="flex gap-2 relative">
            <input
              type="text"
              className="input pr-10 text-[13px]"
              placeholder="Ask anything about your lectures…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              autoFocus
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-1 top-1 bottom-1 px-2 text-(--accent) hover:bg-(--accent-soft) rounded text-[13px] font-medium disabled:opacity-50 transition-colors flex items-center"
              aria-label="Send"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default NotesChat;