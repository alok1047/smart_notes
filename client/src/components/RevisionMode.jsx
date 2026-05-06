import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Zap } from 'lucide-react';
import { parseCustomSyntaxBlocks } from '../utils/markdownUtils';
import CodeBlock from './CodeBlock';

const RevisionMode = ({ content }) => {
  if (!content?.trim()) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16 px-8">
        <div className="w-12 h-12 rounded-xl bg-(--bg-subtle) border border-(--border-subtle) flex items-center justify-center mb-4">
          <Zap size={20} className="text-(--text-faint)" strokeWidth={1.75} />
        </div>
        <h3 className="text-[14px] font-medium text-(--text) mb-1.5">No revision data</h3>
        <p className="text-[12.5px] text-(--text-dim) max-w-xs leading-relaxed">
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
  const cleaned = revContent || '## No key points found\n\nReprocess your notes — the AI will add a key points section.';

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between gap-4 px-8 py-2.5 border-b border-(--border-subtle) shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Zap size={14} className="text-(--accent-text) shrink-0" />
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-(--text) leading-tight">Revision Mode</p>
            <p className="text-[11px] text-(--text-dim) mt-0.5">Headings, bolds & key points only — skim-ready.</p>
          </div>
        </div>
        <span className="revision-badge hidden sm:inline-flex" style={{ margin: 0 }}>
          <Zap size={10} />
          Focus
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-10 py-8 markdown-body bg-(--bg)">
        <div style={{ maxWidth: '980px' }}>
          {parseCustomSyntaxBlocks(cleaned).map((block, i) => (
            block.type === 'code' ? (
              <CodeBlock key={i} content={block.content} language={block.language} />
            ) : (
              <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevisionMode;
