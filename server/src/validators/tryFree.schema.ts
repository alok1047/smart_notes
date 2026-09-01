import { z } from 'zod';

export const tryStatusSchema = z.object({
  anonymousId: z.string().trim().min(8).max(200).optional(),
});

export const tryProcessSchema = z
  .object({
    anonymousId: z.string().trim().min(8).max(200).optional(),
    source: z.enum(['youtube', 'text']),
    url: z.string().trim().max(2000).optional(),
    text: z.string().trim().max(50_000).optional(),
  })
  .refine((data) => {
    if (data.source === 'youtube') return Boolean(data.url && data.url.trim());
    return Boolean(data.text && data.text.trim());
  }, { message: 'Content is required for the selected source' });