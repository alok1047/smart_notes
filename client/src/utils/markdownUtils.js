/**
 * Utility to parse custom syntax delimiters inside user notes into structured blocks.
 */
export const parseCustomSyntaxBlocks = (text) => {
  if (!text) return [];

  const blocks = [];
  let currentIndex = 0;

  // Match {/ followed by everything until /}
  const regex = /\{\/([\s\S]*?)\/\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding text as a text block
    if (match.index > currentIndex) {
      const content = text.substring(currentIndex, match.index);
      // Only push if it's not just whitespace between blocks
      if (content.trim() || content.includes('\n\n')) {
        blocks.push({
          type: 'text',
          content: content.replace(/^\n+/, '').replace(/\n+$/, '\n') // Trim leading but keep trailing newline for spacing
        });
      }
    }

    // Extract code and look for language hint on first line e.g. //java
    let codeContent = match[1].trim();
    let language = 'javascript'; // default

    if (codeContent.startsWith('//')) {
      const firstLine = codeContent.split('\n')[0].toLowerCase();
      if (firstLine.includes('java')) language = 'java';
      else if (firstLine.includes('python')) language = 'python';
      else if (firstLine.includes('cpp') || firstLine.includes('c++')) language = 'cpp';
      else if (firstLine.includes('html')) language = 'html';
      else if (firstLine.includes('css')) language = 'css';
      else if (firstLine.includes('sql')) language = 'sql';
    }

    // Push the code block
    blocks.push({
      type: 'code',
      content: codeContent,
      language
    });

    currentIndex = regex.lastIndex;
  }

  // Push any remaining text
  if (currentIndex < text.length) {
    const remaining = text.substring(currentIndex);
    if (remaining.trim()) {
      blocks.push({
        type: 'text',
        content: remaining.replace(/^\n+/, '')
      });
    }
  }

  return blocks;
};

// Keep existing parseCustomSyntax for github exports (so it still uploads standard markdown)
export const parseCustomSyntax = (text) => {
  if (!text) return text;
  return text.replace(/\{\/([\s\S]*?)\/\}/g, '\n```\n$1\n```\n');
};
