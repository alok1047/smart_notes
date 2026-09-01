import { z } from 'zod';

export const lectureIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const subjectIdParamsSchema = z.object({
  subjectId: z.string().min(1),
});

export const updateLectureSchema = z.object({
  title: z.string().trim().max(200).optional(),
  rawNotes: z.string().max(2_000_000).optional(),
  processedNotes: z.string().max(2_000_000).optional(),
});

export const processLectureSchema = z.object({
  aiProvider: z
    .enum(['gemini', 'openai', 'groq', 'deepseek', 'mistral', 'anthropic'])
    .optional()
    .default('groq'),
  apiKey: z.string().optional(),
  options: z
    .object({
      language: z.string().optional(),
      includeKeyPoints: z.boolean().optional(),
      includeSummary: z.boolean().optional(),
      strictness: z.enum(['strict', 'lenient']).optional(),
      model: z.string().optional(),
    })
    .optional(),
});

export const addLectureSchema = z.object({}).passthrough();