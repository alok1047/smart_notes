import { YoutubeTranscript } from 'youtube-transcript';
import { createChildLogger } from '@/utils/logger';
import { AppError } from '@/errors';

const logger = createChildLogger('youtube');

const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/|v\/)|youtu\.be\/)([\w-]{11})/;

export const extractVideoId = (url: string): string | null => {
  const m = String(url || '')
    .trim()
    .match(YOUTUBE_ID_RE);
  return m ? m[1] : null;
};

export interface TranscriptSegment {
  text: string;
  offsetMs: number;
  durationMs: number;
  lang?: string;
}

export interface YouTubeTranscriptResult {
  videoId: string;
  language: string | null;
  transcript: TranscriptSegment[];
}

/**
 * Fetch the caption track for a YouTube video (timed segments).
 * Timestamps (offsetMs/durationMs) are preserved so the client can link
 * straight into the video at the right time.
 */
export const fetchTranscript = async (url: string): Promise<YouTubeTranscriptResult> => {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new AppError("That doesn't look like a valid YouTube link.", 400, { code: 'INVALID_YOUTUBE_URL' });
  }

  logger.info({ videoId }, 'YouTube transcript requested');

  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);

    if (!segments || segments.length === 0) {
      throw new AppError('No transcript is available for this video.', 404, { code: 'TRANSCRIPT_UNAVAILABLE' });
    }

    return {
      videoId,
      language: segments[0]?.lang ?? null,
      transcript: segments.map((s) => ({
        text: String(s.text ?? '').trim(),
        offsetMs: Number(s.offset) || 0,
        durationMs: Number(s.duration) || 0,
        lang: s.lang,
      })),
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.warn({ videoId, err: message }, 'YouTube transcript fetch failed');
    throw new AppError(
      'No transcript is available for this video. It may have captions disabled, be region-locked, or be a live/music stream.',
      404,
      { code: 'TRANSCRIPT_UNAVAILABLE' }
    );
  }
};
