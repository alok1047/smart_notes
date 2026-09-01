export type Provider = 'gemini' | 'openai' | 'groq' | 'deepseek' | 'mistral' | 'anthropic';

export interface AIPrompt {
  system: string;
  user: string;
}

export interface AIOptions {
  language?: string;
  includeKeyPoints?: boolean;
  includeSummary?: boolean;
  strictness?: 'strict' | 'lenient';
  maxTokens?: number;
  temperature?: number;
  model?: string;
  subjectPrompt?: string;
}

export interface AITextProvider {
  readonly name: Provider;
  generateText(prompt: AIPrompt | string, apiKey?: string, options?: AIOptions): Promise<string>;
  streamText(
    prompt: AIPrompt | string,
    apiKey: string | undefined,
    options: AIOptions | undefined,
    onChunk: (chunk: string) => void
  ): Promise<string>;
}

export interface AIChatProvider {
  readonly name: Provider;
  chat(query: string, context: string, apiKey?: string): Promise<string>;
}

export interface CompletionSuggestion {
  text: string;
  confidence: number;
  reason?: string;
}

export interface RAGResult {
  answer: string;
  citations: RAGCitation[];
  chunks: RetrievedChunk[];
}

export interface RAGCitation {
  lectureTitle: string;
  lectureNumber: number;
  chunkIndex: number;
  snippet: string;
}

export interface RetrievedChunk {
  chunkId: string;
  lectureId: string;
  lectureTitle: string;
  lectureNumber: number;
  content: string;
  score: number;
}

export interface SearchResult {
  id: string;
  type: 'subject' | 'lecture' | 'chunk';
  title: string;
  snippet: string;
  score: number;
  subjectName?: string;
  lectureNumber?: number;
  subjectId?: string;
}