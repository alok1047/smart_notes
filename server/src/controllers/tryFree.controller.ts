import type { RequestHandler } from 'express';
import { tryFreeService } from '@/services/tryFree.service';

export const getTryStatus: RequestHandler = async (req, res, next) => {
  try {
    const { anonymousId } = req.body as { anonymousId?: string };
    const status = await tryFreeService.status(anonymousId);
    res.json(status);
  } catch (error) {
    next(error);
  }
};

export const processTryFree: RequestHandler = async (req, res, next) => {
  try {
    const { anonymousId, source, url, text } = req.body as {
      anonymousId?: string;
      source: 'youtube' | 'text';
      url?: string;
      text?: string;
    };
    const result = await tryFreeService.process({ anonymousId, source, url, text });
    res.json(result);
  } catch (error) {
    next(error);
  }
};