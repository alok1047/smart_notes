import React from 'react';
import EditorPkg from 'react-simple-code-editor';
const Editor = EditorPkg.default || EditorPkg;

const escapeHtml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const highlightSyntax = (code) => {
  if (!code) return '';
  const lines = code.split('\n');
  return lines.map(line => {
    const escaped = escapeHtml(line);
    
    if (escaped.includes('//ai')) {
      return escaped.replace(/(\/\/ai.*)/, '<span style="color: #d946ef; font-weight: 600;">$1</span>');
    }
    if (escaped.includes('//*')) {
      return escaped.replace(/(\/\/\*.*)/, '<span style="background-color: rgba(34, 197, 94, 0.15); color: #4ade80; font-weight: 600; padding: 2px 4px; border-radius: 4px; box-decoration-break: clone;">$1</span>');
    }
    if (escaped.includes('//?')) {
      return escaped.replace(/(\/\/\?.*)/, '<span style="color: #60a5fa; font-style: italic;">$1</span>');
    }
    if (escaped.includes('//&gt;')) {
      return escaped.replace(/(\/\/&gt;.*)/, '<span style="color: #fb923c; font-weight: 500;">$1</span>');
    }
    if (escaped.includes('//')) {
      return escaped.replace(/(\/\/.*)/, '<span style="color: #22c55e; opacity: 0.9;">$1</span>');
    }
    
    return escaped;
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
