const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies Firebase ID token and attaches the MongoDB user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Authorization header must be: Bearer <token>' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Find existing user or create placeholder (full user creation happens in /auth/google)
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      // Auto-create user from token claims if they authenticated but haven't hit /auth/google yet
      user = await User.create({
        firebaseUid: decodedToken.uid,
        name: decodedToken.name || 'User',
        email: decodedToken.email || '',
        avatar: decodedToken.picture || '',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }

    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
