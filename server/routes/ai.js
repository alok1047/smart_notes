const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { suggestCompletion } = require('../services/aiService');

router.use(authenticate);

module.exports = router;
