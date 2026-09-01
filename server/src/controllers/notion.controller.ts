import type { RequestHandler } from 'express';
import { importNotionPage } from '@/services/notion.service';

export const importPage: RequestHandler = async (req, res, next) => {
  try {
    const { token, url } = req.body as { token?: string; url?: string };
    const result = await importNotionPage(token || '', url || '');
    res.json(result);
  } catch (error) {
    next(error);
  }
};
