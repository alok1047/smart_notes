import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider } from './base.provider';
import type { AIPrompt, AIOptions, Provider } from '@/types/ai.types';
import { env } from '@/config/env';

export class GeminiProvider extends BaseProvider {
  readonly name: Provider = 'gemini';

  protected envKey(): string | undefined {
    return env.GEMINI_API_KEY;
  }

  private client(apiKey: string) {
    return new GoogleGenerativeAI(apiKey);
  }

  private promptText(prompt: AIPrompt | string): string {
    return typeof prompt === 'object' ? `${prompt.system}\n\n${prompt.user}` : prompt;
  }

  /**
   * Retry transient Gemini 503 "high demand" overloads with backoff, then fall
   * back across a chain of model IDs so OCR / chat don't fail on a spike.
   */
  private async callWithRetry(
    fn: (modelId: string) => Promise<string>,
    fallbackModels: string[],
    primaryModel: string
  ): Promise<string> {
    const candidates = [primaryModel, ...fallbackModels];
    let lastErr: unknown = null;

    for (const modelId of candidates) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await fn(modelId);
        } catch (err) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const retryable = /503|429|high demand|try again later|unavailable|overloaded/i.test(msg);
          if (retryable) {
            await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
            continue;
          }
          // Non-transient error → try the next model, else rethrow.
          if (modelId !== candidates[candidates.length - 1]) break;
          throw err;
        }
      }
    }
    throw lastErr;
  }

  protected async generate(prompt: AIPrompt | string, apiKey: string, options?: AIOptions): Promise<string> {
    return this.callWithRetry(
      (modelId) => this.client(apiKey).getGenerativeModel({ model: modelId }).generateContent(this.promptText(prompt)).then((r) => r.response.text()),
      ['gemini-2.5-flash', 'gemini-flash-latest'],
      options?.model || 'gemini-3.6-flash'
    );
  }

  protected async stream(
    prompt: AIPrompt | string,
    apiKey: string,
    options: AIOptions | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const model = this.client(apiKey).getGenerativeModel({ model: options?.model || 'gemini-3.6-flash' });
    const result = await model.generateContentStream(this.promptText(prompt));
    let fullText = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  }

  async embedText(text: string, apiKey?: string): Promise<number[]> {
    const key = this.resolveApiKey(apiKey, this.envKey());
    const model = this.client(key).getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent({
      content: { role: 'user', parts: [{ text }] },
      outputDimensionality: 768,
    } as import('@google/generative-ai').EmbedContentRequest & { outputDimensionality: number });
    return result.embedding.values;
  }

  async extractTextFromFile(buffer: Buffer, mimeType: string, apiKey?: string): Promise<string> {
    const key = this.resolveApiKey(apiKey, this.envKey());
    const filePart = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: mimeType || 'application/pdf',
      },
    };
    const prompt =
      'Analyze this lecture document/slide/image thoroughly. Extract all slide titles, body text, whiteboard notes, formulas, code snippets, and diagrams into clean, well-structured Markdown notes.';
    return this.callWithRetry(
      (modelId) =>
        this.client(key).getGenerativeModel({ model: modelId }).generateContent([prompt, filePart]).then((r) => r.response.text()),
      ['gemini-2.5-flash', 'gemini-flash-latest'],
      'gemini-3.6-flash'
    );
  }

  async transcribeAudio(buffer: Buffer, mimeType: string, apiKey?: string): Promise<string> {
    const key = this.resolveApiKey(apiKey, this.envKey());
    const prompt =
      'Transcribe this lecture recording verbatim into clean, readable text. Keep the speaker\'s words, preserve paragraph breaks where the speaker pauses, and include timestamps in [mm:ss] brackets every 30 seconds. Return plain text (no markdown headers).';
    return this.callWithRetry(
      (modelId) =>
        this.client(key).getGenerativeModel({ model: modelId }).generateContent([
          prompt,
          {
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: mimeType || 'audio/mpeg',
            },
          },
        ]).then((r) => r.response.text()),
      ['gemini-2.5-flash', 'gemini-flash-latest'],
      'gemini-3.6-flash'
    );
  }
}