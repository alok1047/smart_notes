import { guestTryRepository } from '@/repositories/guestTry.repository';
import { fetchTranscript } from './youtube.service';
import { processNotes } from './ai/aiService';
import { AppError } from '@/errors';
import { createChildLogger } from '@/utils/logger';

const logger = createChildLogger('try-free');

export interface TryFreeInput {
  anonymousId?: string;
  source: 'youtube' | 'text';
  text?: string;
  url?: string;
}

const FREE_TRY_LIMIT = 1;

/**
 * Free one-shot structuring for anonymous visitors on the landing page.
 * - `status` lets the client know whether the visitor still has a free try.
 * - `process` structures the input with the server's own AI key, then
 *   consumes the visitor's free try (only on success).
 *
 * Authenticated users always pass through — they already have the full app.
 */
export const tryFreeService = {
  async status(anonymousId?: string) {
    if (!anonymousId) return { allowed: true, usedCount: 0 };

    const usage = await guestTryRepository.findByAnonymousId(anonymousId);
    return {
      allowed: !usage || usage.usedCount < FREE_TRY_LIMIT,
      usedCount: usage?.usedCount ?? 0,
    };
  },

  async process({ anonymousId, source, url, text }: TryFreeInput) {
    // 1. Build the raw notes payload from the chosen source.
    let rawNotes = '';
    if (source === 'youtube') {
      if (!url || !url.trim()) {
        throw new AppError('A YouTube link is required.', 400, { code: 'TRY_EMPTY_INPUT' });
      }
      logger.info({ videoUrl: url }, 'Free try YouTube structuring started');
      const transcript = await fetchTranscript(url);
      rawNotes = transcript.transcript.map((s) => s.text).filter(Boolean).join('\n');
    } else {
      rawNotes = (text || '').trim();
    }

    if (!rawNotes || !rawNotes.trim()) {
      throw new AppError(
        'No content to structure. Paste some notes or a valid YouTube link.',
        400,
        { code: 'TRY_EMPTY_INPUT' }
      );
    }

    // 2. Anonymous visitors get exactly one free try.
    if (anonymousId) {
      const usage = await guestTryRepository.findByAnonymousId(anonymousId);
      if (usage && usage.usedCount >= FREE_TRY_LIMIT) {
        throw new AppError(
          "You've used your free try. Log in to keep structuring notes.",
          403,
          { code: 'TRY_LIMIT_REACHED' }
        );
      }
    }

    // 3. Structure with the server's own AI key (groq → AICredits fallback).
    const markdown = await processNotes(rawNotes, 'groq', undefined, {
      includeKeyPoints: true,
    });

    // 4. Consume the free try only after a successful generation.
    if (anonymousId) {
      await guestTryRepository.upsert(anonymousId, new Date());
      return { markdown, usedCount: 1 };
    }

    return { markdown, usedCount: 0 };
  },
};