const admin = require('firebase-admin');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Authorization header must be: Bearer <token>' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);

    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
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
