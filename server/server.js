require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization ---
try {
  // Check if Firebase Admin SDK is already initialized to prevent re-initialization errors (e.g., during hot-reloads)
  if (admin.apps.length === 0) {
    // Option 1: Use environment variables for Firebase Admin SDK config (Recommended for Vercel/production)
    // GOOGLE_APPLICATION_CREDENTIALS environment variable should point to the path of your service account key JSON file.
    // Or, for some environments, you can set FIREBASE_CONFIG as a JSON string.
    // For Vercel, you can set GOOGLE_APPLICATION_CREDENTIALS as an environment variable containing the JSON key itself.
    
    // Option 2: Explicitly use a service account key file (Ensure this file is secure and not committed to public repo)
    // const serviceAccount = require(process.env.FIREBASE_ADMIN_SDK_PATH || './path/to/your-service-account-key.json'); // Update path
    // admin.initializeApp({
    //   credential: admin.credential.cert(serviceAccount)
    // });

    // Option 3: (Simpler for environments where GOOGLE_APPLICATION_CREDENTIALS is set directly with JSON content)
    // This is often how Vercel handles it if you paste the JSON content into an env var.
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
        const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS_JSON.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
         // Assumes GOOGLE_APPLICATION_CREDENTIALS points to the file path
         admin.initializeApp({
             credential: admin.credential.applicationDefault() // Uses GOOGLE_APPLICATION_CREDENTIALS env var for path
         });
         console.log('Firebase Admin SDK initialized using GOOGLE_APPLICATION_CREDENTIALS path.');
    } else {
        console.warn('Firebase Admin SDK not initialized: GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS_JSON not set.');
        // For local development without the env var, you might fall back to a local file,
        // but be careful with committing the key.
        // Example fallback for local dev (not recommended for production without secure env var management):
        // const localServiceAccountPath = './serviceAccountKey.json'; // ensure this file exists and is gitignored
        // if (require('fs').existsSync(localServiceAccountPath)) {
        //   const serviceAccount = require(localServiceAccountPath);
        //   admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        //   console.log('Firebase Admin SDK initialized using local serviceAccountKey.json.');
        // } else {
        //    console.error('Local serviceAccountKey.json not found and Firebase Admin env vars not set.');
        // }
    }
  } else {
    console.log('Firebase Admin SDK already initialized.');
  }
} catch (e) {
  console.error('Firebase Admin SDK initialization failed:', e.message);
  // Consider if the app should exit or run with limited functionality
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
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/', (req, res) => {
  res.send('EngageSphere API Server is running!');
});

const PORT = process.env.SERVER_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
