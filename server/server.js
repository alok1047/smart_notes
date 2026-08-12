require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const initializeFirebase = require('./config/firebase');

initializeFirebase();
connectDB();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/lectures', require('./routes/lectures'));
app.use('/api/search', require('./routes/search'));
app.use('/api/ai', require('./routes/ai'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Lecture Notes API is running' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
