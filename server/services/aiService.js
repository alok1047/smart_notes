const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const Groq = require('groq-sdk');

/**
 * Parse special // commands from raw notes
 * Returns an array of { line, command } objects
 */
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

/**
 * Build the prompt for AI
 */
const buildPrompt = (rawNotes, commands) => {
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

  const prompt = `You are a Markdown Formatting Assistant. 

CRITICAL RULES:
2. If the user writes in Hinglish (Hindi + English), your output MUST be in the Hinglish words. 
3. Your ONLY job is to inject Markdown structure (headings, bullet points, bolding, code blocks) into the provided raw text to make it readable.
4. DO NOT summarize, DO NOT add new English filler words, and DO NOT rewrite sentences to sound more formal.
5. The final response MUST read exactly like the raw notes vocabulary-wise, just formatted securely with Markdown.
- Use:
  - # for main headings
  - ## for subheadings
  - ### for sub-subheadings
  - bullet points for key concepts
  - code blocks where needed
  - bold for important terms
  - tables where appropriate
- Preserve technical terms correctly
- Add a "📌 Key Points" section at the end summarizing the most important concepts (this will be used for revision mode)

Special Command Instructions:
- If the student writes "// make table" after content → convert that content into a well-formatted markdown table
- If the student writes "// simplify" → simplify that explanation into easier language
- If the student writes "// exam points" → highlight those as important exam-relevant points
- If the student writes "// code" → format as a proper code block with language specification
${specialInstructions}

Output should look like well-written class notes — NOT JSON, NOT data format. Use clean markdown formatting.
Ensure each section is clearly separated.

--- RAW NOTES START ---
${rawNotes}
--- RAW NOTES END ---`;

  return prompt;
};

const processWithGemini = async (prompt, apiKey) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing Gemini API Key");
  
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

const processWithOpenAI = async (prompt, apiKey) => {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OpenAI API Key");
  
  const openai = new OpenAI({ apiKey: key });
  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o-mini",
  });
  return completion.choices[0].message.content;
};

const processWithGroq = async (prompt, apiKey) => {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error("Missing Groq API Key");
  
  const groq = new Groq({ apiKey: key });
  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });
  return completion.choices[0].message.content;
};

/**
 * Process raw notes through AI
 * @param {string} rawNotes - The raw, messy notes from the student
 * @param {string} provider - The requested AI provider
 * @param {string} apiKey - Optional user API key override
 * @returns {string} - Clean, structured markdown notes
 */
const processNotes = async (rawNotes, provider = 'gemini', apiKey = '') => {
  if (!rawNotes || rawNotes.trim().length === 0) {
    throw new Error('No notes content provided');
  }

  // Parse special commands
  const commands = parseCommands(rawNotes);
  // Build the prompt
  const prompt = buildPrompt(rawNotes, commands);

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

    if (error.message?.includes('429') || error.status === 429) {
      throw new Error('AI rate limit reached. Please try again in a minute.');
    }
    if (error.message?.includes('API key not valid') || error.status === 401) {
      throw new Error('Invalid API key provided.');
    }

    throw new Error(`AI processing failed: ${error.message}`);
  }
};

module.exports = { processNotes, parseCommands };
