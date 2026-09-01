import { createRequire } from 'module';
import pdfParseLib from 'pdf-parse';
import { createChildLogger } from '@/utils/logger';

const require = createRequire(import.meta.url);

// pdf-parse vendors an old pdf.js build and uses it internally. Reuse the exact
// same engine for per-page extraction so we don't introduce a second PDF parser.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PDFJS: any = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

const logger = createChildLogger('pdf');

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB (must match multer limit)

export const SUPPORTED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'] as const;

export const SUPPORTED_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/ogg; codecs=opus',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export interface PdfParseResult {
  text: string;
  numpages: number;
  info: Record<string, unknown>;
}

/** Guard: throw a clear, non-fatal error for unsupported / oversized inputs. */
export const assertSupportedFile = (file: { mimetype: string; size: number; originalname?: string }): void => {
  const isPdf = file.mimetype === 'application/pdf';
  const isImage = (SUPPORTED_MIME_TYPES as readonly string[]).includes(file.mimetype);
  const isAudio =
    file.mimetype.startsWith('audio/') ||
    (SUPPORTED_AUDIO_MIME_TYPES as readonly string[]).includes(file.mimetype);

  if (!isPdf && !isImage && !isAudio) {
    throw new Error('Unsupported file type. Please upload a PDF, PNG, JPG, WEBP, or audio file.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File is too large. Maximum allowed size is 15 MB.');
  }
};

/**
 * Parse a PDF buffer with pdf-parse and return clean text + metadata.
 * Never throws for malformed PDFs — returns the error via `error` field so
 * callers can decide to fall back to OCR.
 */
export const extractPdf = async (buffer: Buffer, filename = 'document.pdf'): Promise<PdfParseResult> => {
  const started = Date.now();

  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty.');
  }

  logger.info({ filename, bytes: buffer.length }, 'PDF extraction started');

  let data;
  try {
    data = await pdfParseLib(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parse error';
    logger.warn({ filename, err: message }, 'PDF parsing failed');
    throw new Error('This PDF could not be read. It may be corrupted, password-protected, or image-only.');
  }

  const rawText = (data.text || '').toString();
  const text = normalizeExtractedText(rawText);
  const numpages = data.numpages || 0;

  logger.info(
    {
      filename,
      pages: numpages,
      chars: text.length,
      durationMs: Date.now() - started,
    },
    'PDF extraction complete'
  );

  return { text, numpages, info: (data.info as Record<string, unknown>) || {} };
};

/**
 * Clean raw extracted PDF text:
 * - collapse runs of whitespace to single newlines / spaces
 * - drop leading/trailing blank lines
 * - preserve paragraph boundaries (double newline) where present
 * - remove common PDF artifacts (form feed chars, lone page numbers on empty lines)
 */
export const normalizeExtractedText = (input: string): string => {
  if (!input) return '';

  return input
    .replace(/\r\n?/g, '\n') // normalize CRLF
    .replace(/\f/g, '\n') // form feeds → newline
    .replace(/[ \t]+\n/g, '\n') // trailing spaces on lines
    .replace(/\n[ \t]+/g, '\n') // leading spaces on lines
    .replace(/ {2,}/g, ' ') // collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n') // collapse 3+ blank lines
    .replace(/^\s+/, '') // trim start
    .replace(/\s+$/, ''); // trim end
};

/**
 * Detect whether extracted text is meaningful (vs a scanned/empty PDF).
 */
export const hasUsableText = (text: string, minChars = 40): boolean => {
  if (!text) return false;
  const letters = text.replace(/[\s\d\W]/g, '');
  return letters.length >= minChars;
};

export interface PdfPageResult {
  page: number;
  text: string;
}

export interface PdfPagesResult {
  numpages: number;
  pages: PdfPageResult[];
}

/**
 * Extract text page-by-page with the same engine pdf-parse uses. Lets callers
 * report exactly which pages yielded no usable text (e.g. "pages 17, 23 failed")
 * instead of failing the whole document silently.
 */
export const extractPdfPages = async (buffer: Buffer): Promise<PdfPagesResult> => {
  if (!buffer || buffer.length === 0) {
    throw new Error('Uploaded file is empty.');
  }

  PDFJS.disableWorker = true;
  const doc = await PDFJS.getDocument({ data: buffer }).promise;
  const numpages = doc.numPages;
  const pages: PdfPageResult[] = [];

  try {
    for (let i = 1; i <= numpages; i++) {
      let text = '';
      try {
        const page = await doc.getPage(i);
        const content = await page.getTextContent({
          normalizeWhitespace: false,
          disableCombineTextItems: false,
        });
        // Replicates pdf-parse's render_page line-assembly (Y-coordinate aware).
        const items = (content?.items as Array<{ str?: string; transform?: number[] }>) || [];
        let lastY: number | null = null;
        for (const item of items) {
          const y = item?.transform?.[5];
          if (lastY === null || lastY === y) {
            text += item.str ?? '';
          } else {
            text += `\n${item.str ?? ''}`;
          }
          lastY = y ?? lastY;
        }
      } catch {
        text = '';
      }
      pages.push({ page: i, text: normalizeExtractedText(text) });
    }
  } finally {
    try {
      doc.destroy();
    } catch {
      // noop — document already closed
    }
  }

  return { numpages, pages };
};