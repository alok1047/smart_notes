import type { RequestHandler } from 'express';
import { searchService } from '@/services/search.service';

export const search: RequestHandler = async (req, res, next) => {
  try {
    const { q, mode, limit } = req.query as { q: string; mode: 'semantic' | 'keyword' | 'hybrid'; limit?: string };
    const result = await searchService.search({
      q,
      mode: mode || 'hybrid',
      limit: limit ? parseInt(limit, 10) : 20,
      userId: req.user!.id,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};