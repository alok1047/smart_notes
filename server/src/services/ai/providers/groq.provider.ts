import OpenAI from 'openai';
import { BaseProvider } from './base.provider';
import type { AIPrompt, AIOptions, Provider } from '@/types/ai.types';
import { env } from '@/config/env';

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export class GroqProvider extends BaseProvider {
  readonly name: Provider = 'groq';
  protected readonly openAICompat = true;

  protected envKey(): string | undefined {
    return env.GROQ_API_KEY;
  }

  private client(apiKey: string): OpenAI {
    return new OpenAI({
      apiKey,
      baseURL: this.usingAicreditsFallback(apiKey) ? env.AICREDITS_BASE_URL : GROQ_BASE_URL,
    });
  }

  private model(options?: AIOptions, apiKey?: string): string {
    return this.resolveModel(options?.model || DEFAULT_MODEL, apiKey || '');
  }

  protected async generate(prompt: AIPrompt | string, apiKey: string, options?: AIOptions): Promise<string> {
    const completion = await this.client(apiKey).chat.completions.create({
      messages: this.toMessages(prompt),
      model: this.model(options, apiKey),
      max_tokens: options?.maxTokens ?? 8000,
    });
    return completion.choices[0].message.content ?? '';
  }

  protected async stream(
    prompt: AIPrompt | string,
    apiKey: string,
    options: AIOptions | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const stream = await this.client(apiKey).chat.completions.create({
      messages: this.toMessages(prompt),
      model: this.model(options, apiKey),
      stream: true,
      max_tokens: options?.maxTokens ?? 8000,
    });
    let fullText = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;
  }
}
