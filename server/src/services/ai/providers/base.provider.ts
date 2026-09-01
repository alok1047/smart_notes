import type { AIPrompt, AIOptions, AITextProvider, Provider } from '@/types/ai.types';
import { env } from '@/config/env';

export abstract class BaseProvider implements AITextProvider {
  abstract readonly name: Provider;

  /**
   * Whether this provider speaks the OpenAI-compatible protocol.
   * Only OpenAI-compatible providers can fall back to the shared AICredits gateway.
   */
  protected readonly openAICompat: boolean = false;

  protected abstract generate(prompt: AIPrompt | string, apiKey: string, options?: AIOptions): Promise<string>;

  protected abstract stream(
    prompt: AIPrompt | string,
    apiKey: string,
    options: AIOptions | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string>;

  protected resolveApiKey(apiKey?: string, envKey?: string): string {
    const key = apiKey || envKey || (this.openAICompat ? env.AICREDITS_API_KEY : undefined);
    if (!key) {
      throw new Error(`${this.name} API Key is missing`);
    }
    return key;
  }

  protected usingAicreditsFallback(apiKey: string): boolean {
    return this.openAICompat && !!env.AICREDITS_API_KEY && apiKey === env.AICREDITS_API_KEY;
  }

  protected resolveModel(model: string, apiKey: string): string {
    if (!this.usingAicreditsFallback(apiKey)) return model;
    // The gateway uses its own model IDs (e.g. "openai/gpt-4o-mini"); the app's
    // per-provider model names (e.g. groq "llama-3.3-70b-versatile") may not route.
    return env.AICREDITS_MODEL;
  }

  protected toMessages(prompt: AIPrompt | string): Array<{ role: 'system' | 'user'; content: string }> {
    return typeof prompt === 'object'
      ? [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ]
      : [{ role: 'user', content: prompt }];
  }

  async generateText(prompt: AIPrompt | string, apiKey?: string, options?: AIOptions): Promise<string> {
    return this.generate(prompt, this.resolveApiKey(apiKey, this.envKey()), options);
  }

  async streamText(
    prompt: AIPrompt | string,
    apiKey: string | undefined,
    options: AIOptions | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    return this.stream(prompt, this.resolveApiKey(apiKey, this.envKey()), options, onChunk);
  }

  protected envKey(): string | undefined {
    return undefined;
  }
}