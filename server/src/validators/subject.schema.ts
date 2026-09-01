import { z } from 'zod';

export const createSubjectSchema = z.object({
  name: z.string().trim().min(1, 'Subject name is required').max(120),
  description: z.string().trim().max(1000).optional().default(''),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#208383'),
  lectureCount: z.coerce.number().int().min(1, 'Lecture count must be between 1 and 100').max(100).optional().default(1),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional().default([]),
});

export const subjectIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const updateSubjectSchema = z.object({
  systemPrompt: z.string().max(5000).optional(),
  description: z.string().trim().max(1000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});