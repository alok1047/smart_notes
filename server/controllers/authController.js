const admin = require('firebase-admin');
const User = require('../models/User');

const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Firebase token is required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, name, email, picture } = decodedToken;

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
};

module.exports = { googleAuth };
