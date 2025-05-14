require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const admin = require('firebase-admin');
const fs = require('fs');

// --- Firebase Admin SDK Initialization ---
try {
  if (admin.apps.length === 0) {
    console.log('Attempting to initialize Firebase Admin SDK...');
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized successfully using GOOGLE_APPLICATION_CREDENTIALS_JSON.');
      } catch (parseError) {
        console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Ensure it is a valid JSON string and properly escaped if necessary.', parseError.message);
        console.error('GOOGLE_APPLICATION_CREDENTIALS_JSON (first 100 chars):', serviceAccountJson.substring(0, 100) + "...");
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
      console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS file path.');
    } else {
      console.warn('Firebase Admin SDK initialization: No env var set for credentials.');
      const localServiceAccountPath = './firebase-service-account.json';
      if (fs.existsSync(localServiceAccountPath)) {
        const serviceAccount = require(localServiceAccountPath);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log(`Firebase Admin SDK initialized using local ${localServiceAccountPath} as a fallback.`);
      } else {
        console.error(`Local ${localServiceAccountPath} not found. Firebase Admin SDK will not function.`);
      }
    }
  } else {
    console.log('Firebase Admin SDK already initialized.');
  }
} catch (e) {
  console.error('Firebase Admin SDK initialization failed catastrophically:', e.message, e.stack);
}
// --- End Firebase Admin SDK Initialization ---

const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaigns');
const customerRoutes = require('./routes/customers');
const taskRoutes = require('./routes/tasks');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Add COOP header
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('EngageSphere API Server is running!');
});

// === ✅ Fix for Render deployment ===
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app (optional, for serverless platforms like Vercel)
module.exports = app;
