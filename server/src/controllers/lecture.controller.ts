import type { RequestHandler } from 'express';
import { strParam } from '@/utils/helpers';
import { serialize, serializeMany } from '@/utils/serialize';
import { lectureService } from '@/services/lecture.service';
import { extractTextFromFile, transcribeAudioFromFile } from '@/services/ai/aiService';
import { extractPdf, extractPdfPages, hasUsableText, assertSupportedFile } from '@/services/pdf.service';
import { createChildLogger } from '@/utils/logger';

const importLogger = createChildLogger('import');

export const getSingleLecture: RequestHandler = async (req, res, next) => {
  try {
    const result = await lectureService.getSingle(strParam(req.params.id), req.user!.id);
    res.json({ ...result, lecture: serialize(result.lecture), subject: serialize(result.subject) });
  } catch (error) {
    next(error);
  }
};

export const getLectures: RequestHandler = async (req, res, next) => {
  try {
    const result = await lectureService.listBySubject(strParam(req.params.subjectId), req.user!.id);
    res.json({ ...result, subject: serialize(result.subject), lectures: serializeMany(result.lectures) });
  } catch (error) {
    next(error);
  }
};

export const addLecture: RequestHandler = async (req, res, next) => {
  try {
    const lecture = await lectureService.add(strParam(req.params.subjectId), req.user!.id);
    res.status(201).json(serialize(lecture));
  } catch (error) {
    next(error);
  }
};

export const deleteLecture: RequestHandler = async (req, res, next) => {
  try {
    const result = await lectureService.delete(strParam(req.params.id), req.user!.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateLecture: RequestHandler = async (req, res, next) => {
  try {
    const result = await lectureService.update(strParam(req.params.id), req.user!.id, req.body);
    res.json({ lecture: serialize(result.lecture) });
  } catch (error) {
    next(error);
  }
};

export const processLecture: RequestHandler = async (req, res, next) => {
  try {
    const result = await lectureService.process(strParam(req.params.id), req.user!.id, req.body);
    res.json({ ...result, lecture: serialize(result.lecture) });
  } catch (error) {
    next(error);
  }
};

export const processLectureStream: RequestHandler = async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const fullText = await lectureService.processStream(
      strParam(req.params.id),
      req.user!.id,
      req.body,
      (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
      (stage) => {
        res.write(`data: ${JSON.stringify({ stage })}\n\n`);
      }
    );

    res.write(`data: ${JSON.stringify({ done: true, fullText })}\n\n`);
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      next(error);
    } else {
      const message = error instanceof Error ? error.message : 'Streaming failed';
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
};

export const importLectureFile: RequestHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });
      return;
    }

    const { mimetype, buffer, originalname } = file;
    const body = (req.body || {}) as { apiKey?: string; forceOcr?: boolean | string };
    const { apiKey } = body;
    const forceOcr = body.forceOcr === true || body.forceOcr === 'true';

    // 1. Validate type + size before anything else
    try {
      assertSupportedFile(file);
    } catch (validationErr) {
      const message = validationErr instanceof Error ? validationErr.message : 'Invalid file';
      res.status(400).json({ error: { code: 'UNSUPPORTED_FILE', message } });
      return;
    }

    importLogger.info(
      { filename: originalname, mimetype, bytes: buffer.length, forceOcr },
      'Import started'
    );

    let extractedText = '';
    let pageCount: number | null = null;
    let failedPages: number[] = [];

    if (mimetype === 'application/pdf') {
      if (!forceOcr) {
        // 2a. Local text extraction first — fast, no API key needed
        let pdfText = '';
        let pdfPages: number | null = null;
        try {
          const parsed = await extractPdf(buffer, originalname);
          pdfText = parsed.text;
          pdfPages = parsed.numpages;
        } catch (pdfErr) {
          importLogger.warn({ filename: originalname, err: pdfErr instanceof Error ? pdfErr.message : pdfErr }, 'Local PDF extraction failed');
        }

        // 2b. Detect which pages failed to yield usable text (per-page errors)
        if (hasUsableText(pdfText) && pdfPages && pdfPages > 1) {
          try {
            const pageResult = await extractPdfPages(buffer);
            failedPages = pageResult.pages
              .filter((p) => !hasUsableText(p.text))
              .map((p) => p.page);
            pdfPages = pageResult.numpages;
          } catch (pageErr) {
            importLogger.warn(
              { filename: originalname, err: pageErr instanceof Error ? pageErr.message : pageErr },
              'Per-page extraction unavailable — continuing with whole-document text'
            );
          }
        }

        if (hasUsableText(pdfText)) {
          extractedText = pdfText;
          pageCount = pdfPages;
          importLogger.info(
            { filename: originalname, chars: extractedText.length, pages: pageCount, failedPages },
            'Used local PDF extraction'
          );
        } else {
          // 2c. Scanned/image-only PDF → fall back to OCR via Gemini
          importLogger.info({ filename: originalname }, 'Local extraction yielded no text, falling back to OCR');
          try {
            extractedText = await extractTextFromFile(buffer, 'application/pdf', apiKey);
            pageCount = pdfPages ?? null;
          } catch (ocrErr) {
            const message = ocrErr instanceof Error ? ocrErr.message : 'OCR failed';
            importLogger.warn({ filename: originalname, err: message }, 'OCR fallback failed');
            res.status(422).json({
              error: {
                code: 'PDF_NO_TEXT',
                message:
                  'This PDF has no extractable text and OCR failed. It may be scanned or corrupted. Check your AI API key in settings, or try a clear digital PDF.',
              },
            });
            return;
          }
        }
      } else {
        // 2d. Force OCR (client retried after partial page failures)
        importLogger.info({ filename: originalname }, 'Forced OCR path for PDF');
        try {
          extractedText = await extractTextFromFile(buffer, 'application/pdf', apiKey);
          pageCount = null;
        } catch (ocrErr) {
          const message = ocrErr instanceof Error ? ocrErr.message : 'OCR failed';
          importLogger.warn({ filename: originalname, err: message }, 'Forced OCR failed');
          res.status(422).json({
            error: {
              code: 'OCR_FAILED',
              message:
                'OCR could not read this PDF. Check your AI API key in Settings, then try again.',
            },
          });
          return;
        }
      }
    } else if (mimetype.startsWith('audio/')) {
      // 3. Audio → AI transcription (Gemini)
      try {
        extractedText = await transcribeAudioFromFile(buffer, mimetype, apiKey);
      } catch (trErr) {
        const message = trErr instanceof Error ? trErr.message : 'Transcription failed';
        importLogger.warn({ filename: originalname, err: message }, 'Audio transcription failed');
        res.status(422).json({
          error: {
            code: 'TRANSCRIPTION_FAILED',
            message:
              'Could not transcribe this recording. Check your AI API key in Settings, then try again.',
          },
        });
        return;
      }
    } else if (mimetype.startsWith('image/')) {
      // 3. Image → OCR (Gemini) is the only path
      try {
        extractedText = await extractTextFromFile(buffer, mimetype, apiKey);
      } catch (ocrErr) {
        const message = ocrErr instanceof Error ? ocrErr.message : 'OCR failed';
        importLogger.warn({ filename: originalname, err: message }, 'Image OCR failed');
        res.status(422).json({
          error: {
            code: 'OCR_FAILED',
            message:
              'Could not extract text from this image. Check your AI API key in Settings, then try again.',
          },
        });
        return;
      }
    }

    if (!extractedText || !extractedText.trim()) {
      res.status(422).json({ error: { code: 'NO_TEXT_EXTRACTED', message: 'No text could be extracted from this file.' } });
      return;
    }

    importLogger.info(
      { filename: originalname, chars: extractedText.trim().length, pages: pageCount, failedPages },
      'Import completed'
    );

    res.json({
      message: failedPages.length
        ? 'File imported — some pages could not be extracted'
        : 'File imported successfully',
      filename: originalname,
      extractedText: extractedText.trim(),
      pageCount,
      failedPages,
      partialExtraction: failedPages.length > 0,
    });
  } catch (error) {
    next(error);
  }
};

export const getLectureVersions: RequestHandler = async (req, res, next) => {
  try {
    const result = await lectureService.getVersions(strParam(req.params.id), req.user!.id);
    res.json({ versions: serializeMany(result) });
  } catch (error) {
    next(error);
  }
};

export const deleteLectureVersion: RequestHandler = async (req, res, next) => {
  try {
    const result = await lectureService.deleteVersion(strParam(req.params.versionId), req.user!.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getRecentLectures: RequestHandler = async (req, res, next) => {
  try {
    const recent = await lectureService.getRecent(req.user!.id);
    res.json(serializeMany(recent));
  } catch (error) {
    next(error);
  }
};