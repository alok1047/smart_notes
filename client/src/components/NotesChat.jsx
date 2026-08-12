import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { chatWithNotes } from '../services/lectureService';
import { getAISettings } from '../utils/aiSettings';
import ReactMarkdown from 'react-markdown';

const NotesChat = ({ isOpen, onClose, subjectId }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! Ask me any question about your notes for this subject." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const settings = getAISettings();
      const apiKey = settings.provider === 'openai' ? settings.openaiKey : (settings.provider === 'groq' ? settings.groqKey : settings.geminiKey);
      
      const res = await chatWithNotes(subjectId, userMsg, apiKey);
      setMessages(prev => [...prev, { role: 'ai', content: res.answer }]);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || "Sorry, I ran into an error while checking your notes.";
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 sm:hidden animate-fade-in" 
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-(--bg) border-l border-(--border-subtle) shadow-2xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b border-(--border-subtle) bg-(--surface)">
          <h2 className="font-semibold text-(--text) flex items-center gap-2 text-sm">
            <Bot size={16} className="text-(--accent)" /> Chat with Notes
          </h2>
          <button onClick={onClose} className="btn-ghost p-1 rounded-full">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-(--bg-subtle)">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] p-3 rounded-xl text-[13px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-(--accent) text-white rounded-br-sm' 
                  : 'bg-(--surface) border border-(--border-subtle) text-(--text) rounded-bl-sm shadow-sm'
              }`}>
                {msg.role === 'ai' ? (
                  <div className="markdown-body !p-0 !text-[13px] max-w-none prose prose-sm prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-(--surface) border border-(--border-subtle) text-(--text-dim) p-3 rounded-xl rounded-bl-sm flex items-center gap-2 text-[13px] shadow-sm">
                <Loader2 size={14} className="animate-spin" /> Checking notes...
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
              placeholder="Ask about your notes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              autoFocus
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-1 top-1 bottom-1 px-2 text-(--accent) hover:bg-(--accent-soft) rounded text-[13px] font-medium disabled:opacity-50 transition-colors flex items-center"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotesChat;
