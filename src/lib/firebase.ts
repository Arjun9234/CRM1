
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth as FirebaseAuthType, GoogleAuthProvider } from 'firebase/auth'; // Renamed Auth type import

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;
let db: Firestore;
let authInstance: FirebaseAuthType; // Use the renamed type FirebaseAuthType
const googleProvider = new GoogleAuthProvider();

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase config is missing critical values (apiKey or projectId). Check your .env file and Firebase project setup. Firebase features might not work.');
    // app, db, authInstance will remain undefined if this condition is met early.
    // This is a critical setup error. The application might not function correctly regarding Firebase services.
  } else {
    // Initialize Firebase
    // Ensures Firebase is initialized only once, common pattern for Next.js
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    authInstance = getAuth(app); // Initialize the auth instance
    console.log("Firebase initialized successfully.");
  }
} catch (error) {
  console.error("CRITICAL: Firebase initialization failed in firebase.ts:", error);
  // Log the config without exposing sensitive keys if possible, or just confirm structure
  console.error("Firebase config (structure check):", {
    apiKey: firebaseConfig.apiKey ? 'Exists' : 'MISSING!',
    authDomain: firebaseConfig.authDomain ? 'Exists' : 'MISSING!',
    projectId: firebaseConfig.projectId ? 'Exists' : 'MISSING!',
    // It's generally good practice not to log the actual keys in production logs.
  });
  // In case of an error, app, db, and authInstance might not be initialized.
  // Components using them should ideally handle potential undefined values,
  // or the application should have a global error state/boundary for such critical failures.
}

// Export the renamed auth instance as 'auth' for consistent use in other files (e.g., useAuth hook)
export { app, db, authInstance as auth, googleProvider };
