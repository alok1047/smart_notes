import type { RequestHandler } from 'express';
import { fetchTranscript } from '@/services/youtube.service';

export const getTranscript: RequestHandler = async (req, res, next) => {
  try {
    const { url } = req.body as { url?: string };
    const result = await fetchTranscript(url || '');
    res.json(result);
  } catch (error) {
    next(error);
  }
};
