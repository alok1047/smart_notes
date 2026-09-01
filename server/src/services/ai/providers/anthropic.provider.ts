import { BaseProvider } from './base.provider';
import type { AIPrompt, AIOptions, Provider } from '@/types/ai.types';
import { env } from '@/config/env';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const BASE_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicContentBlock {
  type?: string;
  text?: string;
}

export class AnthropicProvider extends BaseProvider {
  readonly name: Provider = 'anthropic';

  protected envKey(): string | undefined {
    return env.ANTHROPIC_API_KEY;
  }

  private model(options?: AIOptions): string {
    return options?.model || DEFAULT_MODEL;
  }

  private headers(apiKey: string): Record<string, string> {
    return {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  private splitMessages(prompt: AIPrompt | string): { system?: string; messages: Array<{ role: string; content: string }> } {
    const parts = this.toMessages(prompt);
    const system = parts[0]?.role === 'system' ? parts[0].content : undefined;
    return { system, messages: parts.filter((m) => m.role !== 'system') };
  }

  protected async generate(prompt: AIPrompt | string, apiKey: string, options?: AIOptions): Promise<string> {
    const { system, messages } = this.splitMessages(prompt);
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: this.headers(apiKey),
      body: JSON.stringify({
        model: this.model(options),
        max_tokens: options?.maxTokens ?? 4096,
        system,
        messages,
      }),
    });
    if (!res.ok) {
      throw new Error(`Anthropic API error (${res.status})`);
    }
    const data = (await res.json()) as { content?: AnthropicContentBlock[] };
    return (data.content || []).map((b) => b.text || '').join('');
  }

  protected async stream(
    prompt: AIPrompt | string,
    apiKey: string,
    options: AIOptions | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const { system, messages } = this.splitMessages(prompt);
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: this.headers(apiKey),
      body: JSON.stringify({
        model: this.model(options),
        max_tokens: options?.maxTokens ?? 4096,
        system,
        messages,
        stream: true,
      }),
    });
    if (!res.ok) {
      throw new Error(`Anthropic API error (${res.status})`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('Anthropic stream unavailable');

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const json = trimmed.slice(6).trim();
        if (json === '[DONE]') continue;
        try {
          const event = JSON.parse(json) as { type?: string; delta?: { type?: string; text?: string } };
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && event.delta.text) {
            fullText += event.delta.text;
            onChunk(event.delta.text);
          }
        } catch {
          // skip non-JSON keep-alive lines
        }
      }
    }

    return fullText;
  }
}
