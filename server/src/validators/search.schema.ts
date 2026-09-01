import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query is required').max(200),
  mode: z.enum(['semantic', 'keyword', 'hybrid']).optional().default('hybrid'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});