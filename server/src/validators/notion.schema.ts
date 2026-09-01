import { z } from 'zod';

export const notionImportSchema = z.object({
  token: z.string().trim().min(1).max(2000),
  url: z.string().trim().min(1).max(2000),
});
