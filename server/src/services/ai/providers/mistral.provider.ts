import OpenAI from 'openai';
import { BaseProvider } from './base.provider';
import type { AIPrompt, AIOptions, Provider } from '@/types/ai.types';
import { env } from '@/config/env';

const DEFAULT_MODEL = 'mistral-large-latest';
const BASE_URL = 'https://api.mistral.ai/v1';

export class MistralProvider extends BaseProvider {
  readonly name: Provider = 'mistral';
  protected readonly openAICompat = true;

  protected envKey(): string | undefined {
    return env.MISTRAL_API_KEY;
  }

  private client(apiKey: string) {
    return new OpenAI({ apiKey, baseURL: this.usingAicreditsFallback(apiKey) ? env.AICREDITS_BASE_URL : BASE_URL });
  }

  private model(options?: AIOptions, apiKey?: string): string {
    return this.resolveModel(options?.model || DEFAULT_MODEL, apiKey || '');
  }

  protected async generate(prompt: AIPrompt | string, apiKey: string, options?: AIOptions): Promise<string> {
    const completion = await this.client(apiKey).chat.completions.create({
      messages: this.toMessages(prompt),
      model: this.model(options, apiKey),
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
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
