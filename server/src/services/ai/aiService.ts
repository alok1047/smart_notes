import { BaseProvider } from './providers/base.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { GroqProvider } from './providers/groq.provider';
import { DeepSeekProvider } from './providers/deepseek.provider';
import { MistralProvider } from './providers/mistral.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import type { AIOptions, AIPrompt, AITextProvider, Provider } from '@/types/ai.types';
import { AIProviderError } from '@/errors';
import { createChildLogger } from '@/utils/logger';

const logger = createChildLogger('ai-service');

interface Command {
  lineNumber: number;
  originalLine: string;
  content: string;
  command: string;
}

const parseCommands = (rawNotes: string): Command[] => {
  const lines = rawNotes.split('\n');
  const commands: Command[] = [];

  lines.forEach((line, index) => {
    const commentMatch = line.match(/\/\/ai\s*(.+)$/i);
    if (commentMatch) {
      commands.push({
        lineNumber: index + 1,
        originalLine: line,
        content: line.replace(/\/\/\s*(.+)$/, '').trim(),
        command: commentMatch[1].trim(),
      });
    }
  });

  return commands;
};

const cleanRawNotes = (rawNotes: string): string => {
  return rawNotes
    .split('\n')
    .map((line) => {
      if (line.match(/^\s*\/\/ai\s/i)) return line;
      const cleaned = line.replace(/^\s*\/\/[?!*]?\s?/, '');
      if (line.match(/^\s*\/\/\s*$/) || line.match(/^\s*\/\/[-=]+\s*$/)) return '';
      return cleaned;
    })
    .join('\n');
};

const buildPrompt = (rawNotes: string, commands: Command[], options: AIOptions = {}): AIPrompt => {
  let specialInstructions = '';

  if (commands.length > 0) {
    specialInstructions = '\n\nSpecial Instructions from the student:\n';
    commands.forEach((cmd) => {
      if (cmd.content) {
        specialInstructions += `- For content "${cmd.content}": ${cmd.command}\n`;
      } else {
        specialInstructions += `- General instruction: ${cmd.command}\n`;
      }
    });
  }

  const subjectPrompt = (options.subjectPrompt || '').trim();
  const subjectPromptBlock = subjectPrompt
    ? `\n\nSUBJECT-SPECIFIC INSTRUCTIONS (from the student's teacher/preferences for this subject):\n${subjectPrompt}`
    : '';

  const language = options.language || 'English';
  const includeKeyPoints = options.includeKeyPoints !== false;
  const includeSummary = options.includeSummary === true;
  const strictness = options.strictness || 'strict';

  let strictnessText = '';
  if (strictness === 'strict') {
    strictnessText =
      'STRICTLY structure the given notes only. DO NOT add external information, extra context, or hallucinate concepts that were not explicitly mentioned by the student.';
  } else {
    strictnessText =
      "You may add helpful extra educational context, definitions, and brief explanations to improve the student's understanding of the topics mentioned.";
  }

  const summaryText = includeSummary
    ? '4. Include a concise summary of the lecture under a "## 📝 Summary" heading at the very beginning.'
    : '';
  const keyPointsText = includeKeyPoints
    ? '3. Always append a "## 📌 Key Points" section at the end for revision mode.'
    : '';

  let languageTarget = `Translate and format all output text in ${language}.`;
  if (language.toLowerCase() === 'hinglish') {
    languageTarget = `Translate and format all output text in Hinglish (Hindi written in the English alphabet).
CRITICAL HINGLISH RULES:
- Write Hindi words using the English alphabet (Latin script), NEVER use Devanagari script.
- Example: Write "DBMS kya hai? Database ek data ka collection hota hai." instead of "डीबीएमएस क्या है? डेटाबेस एक डेटा का संग्रह है."
- Keep the tone natural, like how a student casually writes revision notes mixed with English technical terms.`;
  }

  const cleanedNotes = cleanRawNotes(rawNotes);

  const system = `You are an Advanced AI Lecture Formatting Assistant. You structure messy student notes into clean, revision-ready Markdown with diagrams, images, tables, and code blocks.

LANGUAGE TARGET: ${languageTarget}

GUIDELINES:
1. REASONING & STRUCTURE: Logically analyze the provided notes before formatting. Identify the overarching themes, main topics, sub-topics, and supporting details.
2. HEADING HIERARCHY (NOTION STYLE): Use H1 (# Heading) for all main topics (you can have multiple H1s throughout the document). Use H2 (## Heading) for sub-topics. MINIMIZE the use of subheadings—don't create subheadings for everything; group related points under strong main headings instead.
3. LANGUAGE PRESERVATION: Maintain the student's exact original language style, core concepts, and terminology. Do not over-formalize the phrasing—just organize it perfectly.
4. FORMATTING: Use bullet points, bold text for emphasis, and visual callouts to maximize readability.
${keyPointsText}
${summaryText}
7. ${strictnessText}
8. PRESERVE CODE: If the student includes functional programming code (loops, functions, declarations), PRESERVE IT ENTIRELY in fenced code blocks (e.g. \`\`\`java).
9. COMPLETENESS: You MUST cover ALL content from the notes. Do NOT skip, summarize away, or omit any topic. Every single point the student wrote must appear in your output.

SPECIAL DIRECTIVE HANDLERS:

DIAGRAMS — If the student writes "//ai graph", "//ai diagram", "//ai flowchart", "//ai tree", or "//ai architecture":
Generate a Mermaid diagram inside a fenced code block with the language tag "mermaid".
CRITICAL MERMAID RULES you MUST follow:
- Start the diagram with "graph TD" or "graph LR" (top-down or left-right).
- Use ONLY simple single-letter or short alphanumeric node IDs: A, B, C, D, N1, N2.
- Put human-readable labels inside square brackets: A[Label Here]
- For labeled arrows use: A -->|label| B  (arrow, pipe, label text, pipe, space, target node)
- NEVER put quotes inside pipe labels. Write -->|label| NOT -->|"label"|
- NEVER add a closing bracket after pipes. Write -->|label| B NOT -->|label|> B
- Keep labels SHORT (1-3 words). No special characters, no parentheses, no hyphens in labels.
- For unlabeled arrows just use: A --> B
- Each node definition on its own line, indented with 4 spaces.
- Example of CORRECT syntax:
\`\`\`mermaid
graph TD
    A[Input] -->|Process| B[Output]
    B -->|Feedback| C[Control]
    C --> A
\`\`\`

IMAGES — If the student writes "//ai image [description]", "//ai draw [description]", "//ai picture [description]", or "//ai create image [description]":
Generate a Markdown image tag using Pollinations AI. The URL must be:
![description](https://image.pollinations.ai/prompt/ENCODED_DESCRIPTION?width=800&height=450&nologo=true)
Replace ENCODED_DESCRIPTION with the description URL-encoded (spaces become %20, etc).
Example: ![CPU Architecture](https://image.pollinations.ai/prompt/CPU%20Architecture%20diagram%20detailed?width=800&height=450&nologo=true)

OTHER DIRECTIVES:
- "//ai table" or "//ai make table" → convert content into a well-formatted Markdown table.
- "//ai simplify" → simplify into clear, easy student language.
- "//ai code" → format as a proper fenced code block with language tag.
- "//ai exam points" → highlight as crucial exam-relevant points in blockquotes.

${specialInstructions}
${subjectPromptBlock}

NO LATEX: Never use LaTeX math syntax like $\\rightarrow$, $\\times$, $\\alpha$ etc. Use plain Unicode symbols instead: → for arrows, × for multiplication, Greek letters spelled out or as Unicode (α, β, etc). The output is rendered as standard Markdown without a LaTeX engine.

Output MUST be clean, valid Markdown. All diagrams must use \`\`\`mermaid fenced blocks. All images must use standard Markdown image syntax ![alt](url).`;

  const user = `Here are my messy lecture notes. Structure them into clean, complete revision-ready Markdown. Cover EVERY point I wrote — do not skip anything.

--- RAW NOTES START ---
${cleanedNotes}
--- RAW NOTES END ---`;

  return { system, user };
};

class AIProviderRegistry {
  private readonly providers: Record<Provider, AITextProvider>;

  constructor() {
    this.providers = {
      gemini: new GeminiProvider(),
      openai: new OpenAIProvider(),
      groq: new GroqProvider(),
      deepseek: new DeepSeekProvider(),
      mistral: new MistralProvider(),
      anthropic: new AnthropicProvider(),
    };
  }

  get(provider: string | undefined, fallback: Provider = 'groq'): AITextProvider {
    const normalized = (provider || fallback).toLowerCase() as Provider;
    const instance = this.providers[normalized];
    if (!instance) {
      throw new AIProviderError(`Unsupported AI provider: ${provider}`, provider || 'unknown');
    }
    return instance;
  }

  isBaseProvider(instance: AITextProvider): instance is BaseProvider {
    return instance instanceof BaseProvider;
  }
}

export const aiRegistry = new AIProviderRegistry();

const shouldRetryWithoutUserKey = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const status = (error as Error & { status?: number; statusCode?: number }).status ?? (error as Error & { statusCode?: number }).statusCode;
  const message = error.message;
  const isAuthOrModelError =
    status === 401 ||
    status === 403 ||
    status === 404 ||
    /model_not_found|does not exist|no access|not have access|invalid api key|incorrect api key|authentication/i.test(message);
  return isAuthOrModelError;
};

const processNotes = async (
  rawNotes: string,
  provider: string = 'groq',
  apiKey = '',
  options: AIOptions = {}
): Promise<string> => {
  if (!rawNotes || rawNotes.trim().length === 0) {
    throw new Error('No notes content provided');
  }

  const commands = parseCommands(rawNotes);
  const prompt = buildPrompt(rawNotes, commands, options);

  try {
    const instance = aiRegistry.get(provider);
    return await instance.generateText(prompt, apiKey || undefined, options);
  } catch (error) {
    if (apiKey && shouldRetryWithoutUserKey(error)) {
      logger.warn({ err: error, provider }, 'User AI key failed, retrying with AICredits fallback');
      try {
        return await aiRegistry.get(provider).generateText(prompt, undefined, options);
      } catch (fallbackError) {
        logger.error({ err: fallbackError, provider }, 'AICredits fallback failed');
        throw fallbackError;
      }
    }
    logger.error({ err: error, provider }, 'AI processing failed');
    throw error;
  }
};

const streamNotes = async (
  rawNotes: string,
  provider: string = 'groq',
  apiKey = '',
  options: AIOptions = {},
  onChunk: (chunk: string) => void
): Promise<string> => {
  if (!rawNotes || rawNotes.trim().length === 0) {
    throw new Error('No notes content provided');
  }

  const commands = parseCommands(rawNotes);
  const prompt = buildPrompt(rawNotes, commands, options);
  const instance = aiRegistry.get(provider);

  try {
    return await instance.streamText(prompt, apiKey || undefined, options, onChunk);
  } catch (error) {
    if (apiKey && shouldRetryWithoutUserKey(error)) {
      logger.warn({ err: error, provider }, 'User AI key failed, retrying with AICredits fallback');
      return aiRegistry.get(provider).streamText(prompt, undefined, options, onChunk);
    }
    throw error;
  }
};

const generateChatResponse = async (
  query: string,
  contextNotes: string,
  provider: string = 'groq',
  apiKey = ''
): Promise<string> => {
  const prompt = `You are a helpful AI tutor. Answer the student's question based ONLY on the following lecture notes context. If the answer is not in the context, tell the student that the information is not present in their notes.

CONTEXT NOTES:
${contextNotes}

STUDENT QUESTION:
${query}

Answer in a clean, readable Markdown format.`;

  try {
    return await aiRegistry.get(provider).generateText(prompt, apiKey || undefined);
  } catch (error) {
    if (apiKey && shouldRetryWithoutUserKey(error)) {
      logger.warn({ err: error, provider }, 'User AI key failed in chat, retrying with AICredits fallback');
      return aiRegistry.get(provider).generateText(prompt, undefined);
    }
    throw error;
  }
};

const generateEmbedding = async (text: string, apiKey?: string): Promise<number[]> => {
  const instance = aiRegistry.get('gemini');
  if (aiRegistry.isBaseProvider(instance)) {
    return (instance as GeminiProvider).embedText(text, apiKey);
  }
  throw new AIProviderError('Gemini provider unavailable', 'gemini');
};

const extractTextFromFile = async (buffer: Buffer, mimeType: string, apiKey?: string): Promise<string> => {
  const instance = aiRegistry.get('gemini');
  if (aiRegistry.isBaseProvider(instance)) {
    return (instance as GeminiProvider).extractTextFromFile(buffer, mimeType, apiKey);
  }
  throw new AIProviderError('Gemini provider unavailable', 'gemini');
};

const transcribeAudioFromFile = async (buffer: Buffer, mimeType: string, apiKey?: string): Promise<string> => {
  const instance = aiRegistry.get('gemini');
  if (aiRegistry.isBaseProvider(instance)) {
    return (instance as GeminiProvider).transcribeAudio(buffer, mimeType, apiKey);
  }
  throw new AIProviderError('Gemini provider unavailable', 'gemini');
};

export {
  parseCommands,
  buildPrompt,
  processNotes,
  streamNotes,
  generateChatResponse,
  generateEmbedding,
  extractTextFromFile,
  transcribeAudioFromFile,
};