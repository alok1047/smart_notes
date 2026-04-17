import React from 'react';
import EditorPkg from 'react-simple-code-editor';
const Editor = EditorPkg.default || EditorPkg;

const escapeHtml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const tokenizeCode = (line) => {
  if (!line) return '';
  
  // 1. Strings (Emerald Green #4ade80)
  line = line.replace(/("[^"]*")/g, '<span style="color: #4ade80;">$1</span>');

  // 2. Keywords (Vivid Blue #60a5fa)
  const keywords = /\b(public|static|void|class|int|long|double|float|boolean|char|if|else|for|while|return|new|import|package|try|catch|private|protected|final|abstract|interface|extends|implements|this|super|const|let|var|function|async|await)\b/g;
  line = line.replace(keywords, '<span style="color: #60a5fa;">$1</span>');

  // 3. Datatypes / Classes (Teal/Aqua #2dd4bf)
  const types = /\b(String|Integer|Double|Float|Long|Boolean|Character|Scanner|ArrayList|LinkedList|HashMap|HashSet|Stack|Queue|List|Map|Set|Node|Solution)\b/g;
  line = line.replace(types, '<span style="color: #2dd4bf;">$1</span>');

  // 4. Method Calls (Soft Yellow #fbdf4a)
  line = line.replace(/\b([a-z0-9_]+)(?=\()/gi, '<span style="color: #fbdf4a;">$1</span>');

  // 5. Comments (Gray-Green #71717a)
  line = line.replace(/(\/\/.*)/, '<span style="color: #71717a; font-style: italic;">$1</span>');

  return line;
};

const highlightSyntax = (code) => {
  if (!code) return '';
  const lines = code.split('\n');
  let inCustomBlock = false;

  return lines.map((line, index) => {
    let rawEscaped = escapeHtml(line);
    const hasStart = rawEscaped.includes('{/');
    const hasEnd = rawEscaped.includes('/}');
    
    // Determine block position
    const isFirstLine = hasStart;
    const isLastLine = hasEnd;
    const isBlockLine = inCustomBlock || hasStart || hasEnd;
    
    // Update state for NEXT line
    if (hasStart) inCustomBlock = true;
    if (hasEnd) inCustomBlock = false;

    if (isBlockLine) {
      // 1. Highlight markers separately
      let processed = rawEscaped;
      processed = processed.replace(/\{\//, '<span style="color: #525252; font-weight: bold;">{/</span>');
      processed = processed.replace(/\/\}/, '<span style="color: #525252; font-weight: bold;">/}</span>');

      // 2. Tokenize the content inside the markers
      // We skip tokenizing the markers themselves by only tokenizing what's NOT inside a marker span
      if (!hasStart && !hasEnd) {
        processed = tokenizeCode(processed);
      } else {
        // If it's a boundary line, we only tokenize the part outside the markers
        // (This is a bit simplified but usually the markers are on their own lines)
      }

      const borderRadius = `${isFirstLine ? '8px' : '0'} ${isFirstLine ? '8px' : '0'} ${isLastLine ? '8px' : '0'} ${isLastLine ? '8px' : '0'}`;
      const content = processed || '&nbsp;';
      
      return `<span style="background-color: #1a1a1a; color: #f5f5f5; font-family: var(--font-mono); font-size: 13.5px; display: inline-block; min-width: 100%; padding: 0 16px; margin: 0; border-radius: ${borderRadius}; box-shadow: 0 2px 0 #1a1a1a, 0 -2px 0 #1a1a1a; vertical-align: bottom;">${content}</span>`;
    } else {
      // Normal line - apply slash commands
      if (rawEscaped.includes('//ai')) {
        return rawEscaped.replace(/(\/\/ai.*)/, '<span style="color: #d946ef; font-weight: 600;">$1</span>');
      } else if (rawEscaped.includes('//*')) {
        return rawEscaped.replace(/(\/\/\*.*)/, '<span style="background-color: rgba(34, 197, 94, 0.15); color: #4ade80; font-weight: 600; padding: 2px 4px; border-radius: 4px; box-decoration-break: clone;">$1</span>');
      } else if (rawEscaped.includes('//?')) {
        return rawEscaped.replace(/(\/\/\?.*)/, '<span style="color: #60a5fa; font-style: italic;">$1</span>');
      } else if (rawEscaped.includes('//&gt;')) {
        return rawEscaped.replace(/(\/\/&gt;.*)/, '<span style="color: #fb923c; font-weight: 500;">$1</span>');
      } else if (rawEscaped.includes('//')) {
        return rawEscaped.replace(/(\/\/.*)/, '<span style="color: #22c55e; opacity: 0.9;">$1</span>');
      }
    }
    
    return rawEscaped;
  }).join('\n');
};

const HighlightedEditor = ({ value, onChange, placeholder, autoFocus }) => {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <Editor
        value={value || ''}
        onValueChange={onChange}
        highlight={highlightSyntax}
        padding={32}
        className="highlight_editor_root"
        textareaClassName="notes-editor-focus !outline-none !shadow-none"
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '14px',
          lineHeight: '1.75',
          minHeight: '100%',
          color: '#d4d4d4',
          maxWidth: '980px',
        }}
      />
    </div>
  );
};

export default HighlightedEditor;
