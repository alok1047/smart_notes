/**
 * Utility to preprocess custom notes content into clean, standard Markdown.
 */

export const parseCustomSyntaxBlocks = (text) => {
  if (!text) return [];
  // Retained for backward compatibility
  return [{ type: 'text', content: preprocessMarkdownContent(text) }];
};

export const preprocessMarkdownContent = (text) => {
  if (!text) return '';

  // Convert custom {/ ... /} blocks into standard markdown fenced code blocks
  return text.replace(/\{\/([\s\S]*?)\/\}/g, (match, p1) => {
    let codeContent = p1.trim();
    let lang = '';

    if (codeContent.startsWith('//')) {
      const firstLine = codeContent.split('\n')[0].toLowerCase();
      if (firstLine.includes('mermaid')) lang = 'mermaid';
      else if (firstLine.includes('java')) lang = 'java';
      else if (firstLine.includes('python')) lang = 'python';
      else if (firstLine.includes('cpp') || firstLine.includes('c++')) lang = 'cpp';
      else if (firstLine.includes('html')) lang = 'html';
      else if (firstLine.includes('css')) lang = 'css';
      else if (firstLine.includes('sql')) lang = 'sql';
    }

    return `\n\`\`\`${lang}\n${codeContent}\n\`\`\`\n`;
  });
};

export const parseCustomSyntax = (text) => {
  if (!text) return text;
  return text.replace(/\{\/([\s\S]*?)\/\}/g, '\n```\n$1\n```\n');
};
