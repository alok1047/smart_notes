const mongoose = require('mongoose');
const { generateEmbedding, cosineSimilarity, generateChatResponse } = require('./services/aiService');
const Lecture = require('./models/Lecture');
require('dotenv').config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    const subjectId = "66b1a13b94b0558b387e5b22"; // We don't have a real subjectId, we will just fetch any lecture.
    const lectures = await Lecture.find({ embedding: { $exists: true, $not: { $size: 0 } } });
    console.log("Lectures found with embeddings:", lectures.length);
    
    const emb = await generateEmbedding("Test question", process.env.GEMINI_API_KEY);
    console.log("Embedding generated, length:", emb.length);

    console.log("All tests passed");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}

test();
