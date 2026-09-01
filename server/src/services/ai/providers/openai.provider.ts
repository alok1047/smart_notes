import OpenAI from 'openai';
import { BaseProvider } from './base.provider';
import type { AIPrompt, AIOptions, Provider } from '@/types/ai.types';
import { env } from '@/config/env';

export class OpenAIProvider extends BaseProvider {
  readonly name: Provider = 'openai';
  protected readonly openAICompat = true;

  protected envKey(): string | undefined {
    return env.OPENAI_API_KEY;
  }

  private client(apiKey: string): OpenAI {
    return new OpenAI({
      apiKey,
      ...(this.usingAicreditsFallback(apiKey) ? { baseURL: env.AICREDITS_BASE_URL } : {}),
    });
  }

  protected async generate(prompt: AIPrompt | string, apiKey: string, options?: AIOptions): Promise<string> {
    const client = this.client(apiKey);
    const completion = await client.chat.completions.create({
      messages: this.toMessages(prompt),
      model: this.resolveModel(options?.model || 'gpt-4o-mini', apiKey),
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
    const client = this.client(apiKey);
    const stream = await client.chat.completions.create({
      messages: this.toMessages(prompt),
      model: this.resolveModel(options?.model || 'gpt-4o-mini', apiKey),
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