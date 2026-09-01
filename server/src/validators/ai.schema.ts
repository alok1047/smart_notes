import { z } from 'zod';

export const AI_PROVIDERS = ['gemini', 'openai', 'groq', 'deepseek', 'mistral', 'anthropic'] as const;

export const chatSchema = z.object({
  subjectId: z.string().min(1),
  query: z.string().trim().min(1).max(4000),
  aiProvider: z.enum(AI_PROVIDERS).optional().default('groq'),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

export const generateImageSchema = z.object({
  prompt: z.string().trim().min(1).max(1000),
});

export const suggestSchema = z.object({
  text: z.string().max(100_000),
  cursor: z.number().int().min(0),
  provider: z.enum(AI_PROVIDERS).optional(),
  model: z.string().optional(),
});

export const youtubeTranscriptSchema = z.object({
  url: z.string().trim().min(1).max(2000),
});