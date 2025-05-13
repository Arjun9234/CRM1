require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization ---
try {
  if (admin.apps.length === 0) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        const serviceAccountJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        // Attempt to parse, handle potential errors if not valid JSON
        try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS_JSON.');
        } catch (parseError) {
            console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Ensure it is a valid JSON string.', parseError.message);
            console.error('GOOGLE_APPLICATION_CREDENTIALS_JSON (first 100 chars):', serviceAccountJson.substring(0,100));
             // Fallback or exit if critical
        }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
         admin.initializeApp({
             credential: admin.credential.applicationDefault()
         });
         console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS path.');
    } else {
        console.warn('Firebase Admin SDK not initialized: GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON not set.');
        const localServiceAccountPath = './serviceAccountKey.json'; 
        if (require('fs').existsSync(localServiceAccountPath)) {
          const serviceAccount = require(localServiceAccountPath);
          admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
          console.log('Firebase Admin SDK initialized using local serviceAccountKey.json as a fallback.');
        } else {
           console.error('Local serviceAccountKey.json not found and Firebase Admin env vars not set. Admin SDK will not function.');
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
app.use(cors()); 
app.use(express.json()); 

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.send('EngageSphere API Server is running!');
});

const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Export app for Vercel
