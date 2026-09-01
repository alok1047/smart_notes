export interface ChunkMetadata {
  heading?: string;
  headingLevel?: number;
  section?: string;
  chunkIndex: number;
  position: number;
}

export interface TextChunk {
  content: string;
  chunkIndex: number;
  metadata: ChunkMetadata;
}

interface Section {
  heading?: string;
  level?: number;
  blocks: string[];
}

const TARGET_CHARS = 2048; // ~512 tokens (≈4 chars/token)
const MIN_CHARS = 512;
const OVERLAP_SENTENCES = 2;

const SENTENCE_SPLIT = /(?<=[.!?।])\s+/;
const HEADING_RE = /^(#{1,3})\s+(.+)$/;

export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export const splitSentences = (text: string): string[] => {
  return text
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const splitParagraphs = (text: string): string[] => {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
};

const buildSections = (text: string): Section[] => {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let current: Section = { blocks: [] };

  for (const line of lines) {
    const headingMatch = line.match(HEADING_RE);
    if (headingMatch) {
      if (current.blocks.length > 0) {
        sections.push(current);
      }
      current = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        blocks: [],
      };
    } else if (line.trim()) {
      current.blocks.push(line.trim());
    }
  }

  if (current.blocks.length > 0) {
    sections.push(current);
  }

  if (sections.length === 0 && text.trim()) {
    sections.push({ blocks: [text.trim()] });
  }

  return sections;
};

const overlapTail = (chunk: string, count: number): string => {
  const sentences = splitSentences(chunk);
  return sentences.slice(-count).join(' ');
};

const chunkBlocks = (blocks: string[], targetChars: number): string[] => {
  const chunks: string[] = [];
  let buffer = '';

  const flush = () => {
    if (buffer.trim().length >= MIN_CHARS || chunks.length === 0) {
      chunks.push(buffer.trim());
    } else {
      chunks[chunks.length - 1] += '\n' + buffer.trim();
    }
    buffer = '';
  };

  for (const block of blocks) {
    const proposed = buffer ? `${buffer}\n\n${block}` : block;

    if (proposed.length > targetChars) {
      // Try to split long blocks on paragraph/sentence boundaries
      const paragraphs = splitParagraphs(block);
      let paragraphBuf = '';

      for (const para of paragraphs) {
        const combined = paragraphBuf ? `${paragraphBuf}\n\n${para}` : para;
        if (combined.length > targetChars) {
          // Split oversized paragraph into sentences with overlap
          const sentences = splitSentences(para);
          let sentenceBuf = '';

          for (const sentence of sentences) {
            if ((sentenceBuf + ' ' + sentence).length > targetChars && sentenceBuf) {
              const overlap = overlapTail(sentenceBuf, OVERLAP_SENTENCES);
              chunks.push(sentenceBuf.trim());
              sentenceBuf = overlap ? `${overlap} ${sentence}` : sentence;
            } else {
              sentenceBuf = sentenceBuf ? `${sentenceBuf} ${sentence}` : sentence;
            }
          }

          if (sentenceBuf) {
            if (buffer) {
              buffer = `${buffer}\n\n${sentenceBuf}`;
              flush();
            } else {
              chunks.push(sentenceBuf.trim());
            }
          }
        } else {
          paragraphBuf = combined;
        }
      }

      if (paragraphBuf) {
        buffer = paragraphBuf;
      }
    } else {
      buffer = proposed;
      if (buffer.length >= targetChars) {
        flush();
      }
    }
  }

  if (buffer.trim()) {
    flush();
  }

  return chunks;
};

export const chunkText = (text: string, options: { targetChars?: number } = {}): TextChunk[] => {
  const target = options.targetChars ?? TARGET_CHARS;
  if (!text || !text.trim()) return [];

  const sections = buildSections(text);
  const chunks: TextChunk[] = [];
  let chunkIndex = 0;
  let position = 0;

  for (const section of sections) {
    const blocks = section.blocks;
    if (blocks.length === 0) continue;

    const sectionChunks = chunkBlocks(blocks, target);
    const headerPrefix = section.heading ? `${'#'.repeat(section.level || 1)} ${section.heading}\n\n` : '';

    for (const raw of sectionChunks) {
      if (raw.length < MIN_CHARS && chunks.length > 0) {
        // Merge tiny section chunks into the previous chunk to avoid noise
        chunks[chunks.length - 1].content += `\n\n${raw}`;
        continue;
      }

      chunks.push({
        content: headerPrefix ? `${headerPrefix}${raw}` : raw,
        chunkIndex,
        metadata: {
          heading: section.heading,
          headingLevel: section.level,
          section: section.heading,
          chunkIndex,
          position: position++,
        },
      });
      chunkIndex++;
    }
  }

  return chunks;
};

export const chunkTextWithOverlap = (text: string, overlapSentences = OVERLAP_SENTENCES): TextChunk[] => {
  const base = chunkText(text);
  const result: TextChunk[] = [];

  for (let i = 0; i < base.length; i++) {
    const chunk = base[i];
    let content = chunk.content;

    if (i > 0) {
      const prevTail = overlapTail(base[i - 1].content, overlapSentences);
      if (prevTail) {
        content = `${prevTail}\n\n${content}`;
      }
    }

    result.push({ ...chunk, content });
  }

  return result;
};

export const chunkForLecture = (text: string, _lectureId: string): Array<{ content: string; chunkIndex: number; metadata: ChunkMetadata }> => {
  const chunks = chunkTextWithOverlap(text);
  return chunks.map((c) => ({
    content: c.content,
    chunkIndex: c.chunkIndex,
    metadata: c.metadata,
  }));
};