const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * POST /api/auth/google
 * Authenticate user via Firebase Google OAuth token
 * Creates or updates user in MongoDB
 */
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Firebase token is required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    const { uid, name, email, picture } = decodedToken;

    // Upsert user in MongoDB
    let user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        firebaseUid: uid,
        name: name || 'User',
        email: email || '',
        avatar: picture || '',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: 'Authentication successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Authentication failed: ' + error.message });
  }
});

module.exports = router;
