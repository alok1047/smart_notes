const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const Groq = require('groq-sdk');

const parseCommands = (rawNotes) => {
  const lines = rawNotes.split('\n');
  const commands = [];

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

const buildPrompt = (rawNotes, commands, options = {}) => {
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

  const language = options.language || 'English';
  const includeKeyPoints = options.includeKeyPoints !== false; // Default true
  const includeSummary = options.includeSummary === true;
  const strictness = options.strictness || 'strict';

  let strictnessText = '';
  if (strictness === 'strict') {
    strictnessText = 'STRICTLY structure the given notes only. DO NOT add external information, extra context, or hallucinate concepts that were not explicitly mentioned by the student.';
  } else {
    strictnessText = 'You may add helpful extra educational context, definitions, and brief explanations to improve the student\'s understanding of the topics mentioned.';
  }

  let summaryText = includeSummary ? '4. Include a concise summary of the lecture under a "## 📝 Summary" heading at the very beginning.' : '';
  let keyPointsText = includeKeyPoints ? '3. Always append a "## 📌 Key Points" section at the end for revision mode.' : '';

  let languageTarget = `Translate and format all output text in ${language}.`;
  if (language.toLowerCase() === 'hinglish') {
    languageTarget = `Translate and format all output text in Hinglish (Hindi written in the English alphabet).
CRITICAL HINGLISH RULES:
- Write Hindi words using the English alphabet (Latin script), NEVER use Devanagari script.
- Example: Write "DBMS kya hai? Database ek data ka collection hota hai." instead of "डीबीएमएस क्या है? डेटाबेस एक डेटा का संग्रह है."
- Keep the tone natural, like how a student casually writes revision notes mixed with English technical terms.`;
  }

  const prompt = `You are an Advanced AI Lecture Formatting Assistant. You structure messy student notes into clean, revision-ready Markdown with diagrams, images, tables, and code blocks.

LANGUAGE TARGET: ${languageTarget}

GUIDELINES:
1. REASONING & STRUCTURE: Logically analyze the provided notes before formatting. Identify the overarching themes, main topics, sub-topics, and supporting details.
2. HEADING HIERARCHY (NOTION STYLE): Use H1 (# Heading) for all main topics (you can have multiple H1s throughout the document). Use H2 (## Heading) for sub-topics. MINIMIZE the use of subheadings—don't create subheadings for everything; group related points under strong main headings instead.
3. LANGUAGE PRESERVATION: Maintain the student's exact original language style, core concepts, and terminology. Do not over-formalize the phrasing—just organize it perfectly.
4. FORMATTING: Use bullet points, bold text for emphasis, and visual callouts to maximize readability.
${keyPointsText}
${summaryText}
7. ${strictnessText}

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

Output MUST be clean, valid Markdown. All diagrams must use \`\`\`mermaid fenced blocks. All images must use standard Markdown image syntax ![alt](url).

--- RAW NOTES START ---
${rawNotes}
--- RAW NOTES END ---`;

  return prompt;
};

const processWithGemini = async (prompt, apiKey) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing Gemini API Key');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const streamProcessGemini = async (prompt, apiKey, onChunk) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing Gemini API Key');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContentStream(prompt);
  let fullText = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }
  return fullText;
};

const processWithOpenAI = async (prompt, apiKey) => {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Missing OpenAI API Key');

  const openai = new OpenAI({ apiKey: key });
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o-mini',
  });
  return completion.choices[0].message.content;
};

const streamProcessOpenAI = async (prompt, apiKey, onChunk) => {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Missing OpenAI API Key');

  const openai = new OpenAI({ apiKey: key });
  const stream = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o-mini',
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
};

const processWithGroq = async (prompt, apiKey) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('Missing Groq API Key');

  const groq = new Groq({ apiKey: key });
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
  });
  return completion.choices[0].message.content;
};

const streamProcessGroq = async (prompt, apiKey, onChunk) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('Missing Groq API Key');

  const groq = new Groq({ apiKey: key });
  const stream = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
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
};

const processNotes = async (rawNotes, provider = 'gemini', apiKey = '', options = {}) => {
  if (!rawNotes || rawNotes.trim().length === 0) {
    throw new Error('No notes content provided');
  }

  const commands = parseCommands(rawNotes);
  const prompt = buildPrompt(rawNotes, commands, options);

  try {
    let processedText = '';

    switch (provider.toLowerCase()) {
      case 'openai':
        processedText = await processWithOpenAI(prompt, apiKey);
        break;
      case 'groq':
        processedText = await processWithGroq(prompt, apiKey);
        break;
      case 'gemini':
      default:
        processedText = await processWithGemini(prompt, apiKey);
        break;
    }

    return processedText;
  } catch (error) {
    console.error(`AI processing error [${provider}]:`, error);
    throw new Error(`AI processing failed: ${error.message}`);
  }
};

const streamNotes = async (rawNotes, provider = 'gemini', apiKey = '', options = {}, onChunk) => {
  if (!rawNotes || rawNotes.trim().length === 0) {
    throw new Error('No notes content provided');
  }

  const commands = parseCommands(rawNotes);
  const prompt = buildPrompt(rawNotes, commands, options);

  switch (provider.toLowerCase()) {
    case 'openai':
      return await streamProcessOpenAI(prompt, apiKey, onChunk);
    case 'groq':
      return await streamProcessGroq(prompt, apiKey, onChunk);
    case 'gemini':
    default:
      return await streamProcessGemini(prompt, apiKey, onChunk);
  }
};

const extractTextFromImage = async (buffer, mimeType, apiKey) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing Gemini API Key for document/image processing');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const filePart = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType || 'application/pdf',
    },
  };

  const prompt = 'Analyze this lecture document/slide/image thoroughly. Extract all slide titles, body text, whiteboard notes, formulas, code snippets, and diagrams into clean, well-structured Markdown notes.';
  const result = await model.generateContent([prompt, filePart]);
  return result.response.text();
};

const generateEmbedding = async (text, apiKey) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing Gemini API Key for embeddings');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  
  const result = await model.embedContent(text);
  return result.embedding.values;
};

const generateChatResponse = async (query, contextNotes, apiKey) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing Gemini API Key for chat');

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a helpful AI tutor. Answer the student's question based ONLY on the following lecture notes context. If the answer is not in the context, tell the student that the information is not present in their notes.

CONTEXT NOTES:
${contextNotes}

STUDENT QUESTION:
${query}

Answer in a clean, readable Markdown format.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

module.exports = { 
  processNotes, 
  streamNotes, 
  extractTextFromImage, 
  parseCommands,
  generateEmbedding,
  generateChatResponse,
  cosineSimilarity
};
