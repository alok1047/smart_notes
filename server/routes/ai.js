const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

const { generateEmbedding, generateChatResponse, cosineSimilarity } = require('../services/aiService');
const Lecture = require('../models/Lecture');

router.use(authenticate);

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { subjectId, query, aiProvider, apiKey } = req.body;
    
    if (!subjectId || !query) {
      return res.status(400).json({ error: 'Subject ID and query are required' });
    }

    // 1. Fetch all lectures for this subject that have processed notes
    const allLectures = await Lecture.find({ subjectId }).select('title processedNotes');
    const lectures = allLectures.filter(l => l.processedNotes && l.processedNotes.trim().length > 0);

    if (lectures.length === 0) {
      return res.json({ answer: 'I cannot answer this because you have not saved or processed any notes for this subject yet. Process some notes first, then try chatting!' });
    }

    // 2. Combine all notes into a single context block
    let contextNotes = '';
    lectures.forEach(lecture => {
      contextNotes += `\n--- Lecture: ${lecture.title} ---\n${lecture.processedNotes}\n`;
    });

    // 3. Generate the final answer using the user's chosen AI provider
    const answer = await generateChatResponse(query, contextNotes, aiProvider, apiKey);

    res.json({ answer });
  } catch (error) {
    console.error('Error in chat:', error.message || error);
    res.status(500).json({ error: error.message || 'Failed to generate answer from notes.' });
  }
});

// POST /api/ai/generate-image
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const cleanPrompt = prompt.trim();
    const encodedPrompt = encodeURIComponent(cleanPrompt);

    // 1. Try Lexica AI Image Search API
    try {
      const lexicaRes = await fetch(`https://lexica.art/api/v1/search?q=${encodedPrompt}`);
      if (lexicaRes.ok) {
        const data = await lexicaRes.json();
        if (data.images && data.images.length > 0) {
          const match = data.images[Math.floor(Math.random() * Math.min(3, data.images.length))];
          return res.json({
            url: match.src,
            provider: 'lexica',
            prompt: cleanPrompt
          });
        }
      }
    } catch (err) {
      console.warn('Lexica image search failed, using FLUX fallback:', err.message);
    }

    // 2. Pollinations FLUX Engine Fallback
    const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}%20detailed%20educational%20diagram%20high%20quality?model=flux&width=1024&height=576&nologo=true&seed=${Math.floor(Math.random() * 100000)}`;

    return res.json({
      url: fluxUrl,
      provider: 'pollinations-flux',
      prompt: cleanPrompt
    });

  } catch (error) {
    console.error('Error generating AI image:', error);
    res.status(500).json({ error: 'Failed to generate AI image' });
  }
});

module.exports = router;
