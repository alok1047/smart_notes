import type { RequestHandler } from 'express';
import { ragService } from '@/services/ai/ragService';
import { generateEmbedding, aiRegistry } from '@/services/ai/aiService';

export const chat: RequestHandler = async (req, res, next) => {
  try {
    const { subjectId, query, aiProvider, apiKey, model } = req.body as {
      subjectId: string;
      query: string;
      aiProvider?: string;
      apiKey?: string;
      model?: string;
    };

    const result = await ragService.answer(req.user!.id, subjectId, query, {
      provider: aiProvider,
      apiKey,
      options: model ? { model } : undefined,
    });

    res.json({
      answer: result.answer,
      citations: result.citations,
      intent: result.intent,
    });
  } catch (error) {
    next(error);
  }
};

export const generateImage: RequestHandler = async (req, res, next) => {
  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const cleanPrompt = prompt.trim();
    const encodedPrompt = encodeURIComponent(cleanPrompt);

    try {
      const lexicaRes = await fetch(`https://lexica.art/api/v1/search?q=${encodedPrompt}`);
      if (lexicaRes.ok) {
        const data = (await lexicaRes.json()) as { images?: Array<{ src: string }> };
        if (data.images && data.images.length > 0) {
          const match = data.images[Math.floor(Math.random() * Math.min(3, data.images.length))];
          res.json({ url: match.src, provider: 'lexica', prompt: cleanPrompt });
          return;
        }
      }
    } catch {
      // fall through to FLUX
    }

    const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}%20detailed%20educational%20diagram%20high%20quality?model=flux&width=1024&height=576&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

    res.json({ url: fluxUrl, provider: 'pollinations-flux', prompt: cleanPrompt });
  } catch (error) {
    next(error);
  }
};

export const suggest: RequestHandler = async (req, res, next) => {
  try {
    const { text, cursor, provider, model } = req.body as {
      text: string;
      cursor: number;
      provider?: string;
      model?: string;
    };

    if (text === undefined || cursor === undefined) {
      res.status(400).json({ error: 'text and cursor are required' });
      return;
    }

    const start = Math.max(0, cursor - 500);
    const end = Math.min(text.length, cursor + 500);
    const context = text.slice(start, end);
    const beforeCursor = text.slice(Math.max(0, cursor - 300), cursor);

    const prompt = `You are an autocomplete assistant for a student's lecture notes. Complete the text that follows the cursor. Return ONLY the completion text (no explanation, no markdown formatting, no code fences).

TEXT BEFORE CURSOR:
${beforeCursor}

SURROUNDING CONTEXT:
${context}

Return the most natural continuation of the student's thought.`;

    const answer = await aiRegistry.get(provider).generateText(prompt, undefined, model ? { model } : undefined);
    res.json({ text: answer.trim() });
  } catch (error) {
    next(error);
  }
};

export const embeddings: RequestHandler = async (req, res, next) => {
  try {
    const { text, apiKey } = req.body as { text: string; apiKey?: string };
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'text is required' });
      return;
    }
    const embedding = await generateEmbedding(text, apiKey);
    res.json({ embedding });
  } catch (error) {
    next(error);
  }
};