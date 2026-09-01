/**
 * YouTube integration.
 *
 * `fetchYouTubeMetadata` — Google's public oEmbed endpoint (CORS-enabled, no
 * API key) for title / channel / thumbnail.
 *
 * `getYouTubeTranscript` — hits the NotesSync backend (`POST /api/youtube/transcript`)
 * which fetches the caption track with per-segment timestamps. Backend errors
 * are mapped to a typed error so the UI can surface an honest state.
 */

import api from './api';

const YOUTUBE_ID_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/;

export const extractYouTubeId = (url = '') => {
  const m = String(url).trim().match(YOUTUBE_ID_RE);
  return m ? m[1] : null;
};

export const isYouTubeUrl = (url = '') => Boolean(extractYouTubeId(url));

export const fetchYouTubeMetadata = async (url = '') => {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error("That doesn't look like a valid YouTube link.");
  }

  let res;
  try {
    res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}&format=json`
    );
  } catch {
    throw new Error('Could not reach YouTube. Check your connection and try again.');
  }

  if (!res.ok) {
    throw new Error('YouTube did not return details for this video. Try again in a moment.');
  }

  const data = await res.json();
  return {
    id: videoId,
    title: data.title || 'Untitled video',
    channel: data.author_name || 'Unknown channel',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    duration: null, // oEmbed does not expose duration
  };
};

export class YouTubeTranscriptUnavailableError extends Error {}

/**
 * Fetch the caption track for a video via the NotesSync backend.
 * Resolves to `{ videoId, language, transcript: [{ text, offsetMs, durationMs }] }`.
 */
export const getYouTubeTranscript = async (url = '') => {
  try {
    const res = await api.post('/youtube/transcript', { url });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const message =
      err?.response?.data?.error?.message || err?.message || 'Transcript retrieval failed.';
    if (status === 400 || status === 404) {
      throw new YouTubeTranscriptUnavailableError(message);
    }
    throw new Error(message);
  }
};