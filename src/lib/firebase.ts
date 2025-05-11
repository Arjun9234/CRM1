
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

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
let auth: Auth;
const googleProvider = new GoogleAuthProvider();

try {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('Firebase config is missing critical values (apiKey or projectId). Check your .env file and Firebase project setup.');
    // Potentially throw an error here or handle it gracefully depending on desired behavior
    // For now, we'll let initializeApp potentially fail and log it.
  }
  
  console.log("Attempting to initialize Firebase with config:", {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'NOT SET',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    // Add other sensitive fields carefully if needed for debugging, or just check their presence
  });

  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  
  console.log("Firebase initialized successfully.");

} catch (error) {
  console.error("CRITICAL: Firebase initialization failed in firebase.ts:", error);
  console.error("Firebase config used:", firebaseConfig); // Log the config that caused the error
  // In a real app, you might want to throw this error to stop the app or set db/auth to null
  // and handle that state in your components/API routes.
  // For now, this will log the error prominently. If db/auth are used while undefined, it will lead to runtime errors.
  // This ensures that if `db` or `auth` are used later and are undefined, the root cause (init failure) is logged.
  // To prevent further errors, we could assign placeholder/mock objects or ensure db/auth are checked before use.
  // However, if Firebase init fails, the app is likely unusable for DB/auth features.
  // Re-throwing can make the server crash explicitly, which might be desired for critical services.
  // throw error; // Uncomment to make the app crash hard on init failure.
}

export { app, db, auth, googleProvider };

