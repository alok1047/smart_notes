import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ content, language = 'javascript' }) => {
  const [copied, setCopied] = useState(false);

  // Clean code content (some hint lines might be present)
  let lines = content.split('\n');
  if (lines[0].startsWith('//') && (lines[0].includes('java') || lines[0].includes('js') || lines[0].includes('node'))) {
    // If the first line was just a language hint for my parser, we might want to skip it in the display?
    // Actually, users might want to see it too. Let's keep it but handle the parsing.
  }

  // Filter out the first line if it's purely a language hint for the parser
  let displayContent = content;
  const contentLines = content.split('\n');
  if (contentLines.length > 1 && contentLines[0].startsWith('//') && 
      (contentLines[0].toLowerCase().includes('java') || 
       contentLines[0].toLowerCase().includes('python') || 
       contentLines[0].toLowerCase().includes('javascript'))) {
    displayContent = contentLines.slice(1).join('\n');
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-8 bg-[#181818] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl transition-all hover:border-[#3a3a3a]">
      {/* Header / Language Badge */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#222222] border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] opacity-80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] opacity-80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-[#22c55e] opacity-80"></div>
          </div>
          <div className="w-px h-3 bg-[#333] mx-1"></div>
          <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 px-2 rounded-md hover:bg-[#2a2a2a] text-[#737373] hover:text-[#e5e5e5] transition-all flex items-center gap-1.5"
          title="Copy code"
        >
          {copied ? (
            <><Check size={11} className="text-green-500" /> <span className="text-[10px] text-green-500 font-bold uppercase">Copied!</span></>
          ) : (
            <><Copy size={11} /> <span className="text-[10px] font-bold uppercase">Copy</span></>
          )}
        </button>
      </div>

      <div className="relative">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '24px',
            fontSize: '13.5px',
            lineHeight: '1.8',
            backgroundColor: 'transparent',
            fontFamily: 'var(--font-mono)'
          }}
          lineNumberStyle={{ color: '#333', minWidth: '2.5em' }}
          showLineNumbers={false}
        >
          {displayContent}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
