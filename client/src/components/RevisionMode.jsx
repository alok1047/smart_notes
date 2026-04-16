import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Zap } from 'lucide-react';

const RevisionMode = ({ content }) => {
  if (!content?.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
        <div className="w-14 h-14 rounded-2xl bg-[#1f1f1f] border border-[#2a2a2a] flex items-center justify-center mb-5">
          <Zap size={24} className="text-[#404040]" />
        </div>
        <h3 className="text-[14px] font-semibold text-[#525252] mb-2">No revision data</h3>
        <p className="text-[12px] text-[#404040] max-w-xs leading-relaxed">
          Process your notes with AI first — revision mode shows key points and highlights only.
        </p>
      </div>
    );
  }

  const extract = (text) => {
    const lines = text.split('\n');
    const out = [];
    let inKP = false;

    for (const line of lines) {
      const s = line.trim();
      if (s.match(/#{1,3}\s*📌?\s*key\s*points?/i)) {
        inKP = true; out.push(line); continue;
      }
      if (inKP) {
        if (s.match(/^#{1,2}\s/) && !s.match(/key\s*points?/i)) { inKP = false; continue; }
        out.push(line); continue;
      }
      if (s.match(/^#{1,3}\s/)) { out.push(line); continue; }
      if (s.includes('**')) { out.push(line); continue; }
      if (/[📌⭐⚡🔑💡]/.test(s)) { out.push(line); continue; }
    }

    if (out.length < 3) {
      return lines.filter(l => {
        const s = l.trim();
        return s.match(/^#{1,3}\s/) || s.includes('**') || s.startsWith('- ');
      }).join('\n');
    }
    return out.join('\n');
  };

  const revContent = extract(content);

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-8 py-5 border-b border-[#1f1f1f]">
        <div className="revision-badge">
          <Zap size={10} />
          Revision Mode — Key Points Only
        </div>
      </div>
      <div className="markdown-body" style={{ height: 'auto', paddingTop: '28px', maxWidth: '980px' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {revContent || '## No key points found\n\nReprocess your notes — the AI will add a key points section.'}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default RevisionMode;
