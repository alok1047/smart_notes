const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Option 1: Using service account JSON file (recommended for production)
// Option 2: Using environment variables (used here for simplicity)
const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    // If FIREBASE_SERVICE_ACCOUNT_KEY env var is set, use it
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Fallback: use application default credentials or individual env vars
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    console.log('✅ Firebase Admin initialized');
  }
  return admin;
};

module.exports = initializeFirebase;
