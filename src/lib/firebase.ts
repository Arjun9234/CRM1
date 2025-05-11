
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
  } else if (!firebaseConfig.authDomain) {
    console.error('Firebase config is missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN. This is crucial for authentication. Check your .env file. Authentication will likely fail with "auth/unauthorized-domain" or similar errors.');
  }
  else {
    console.log(`Attempting to initialize Firebase with projectId: ${firebaseConfig.projectId} and authDomain: ${firebaseConfig.authDomain}`);
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    authInstance = getAuth(app);
    console.log(`Firebase initialized successfully for projectId: ${authInstance.app.options.projectId}.`);
    console.warn(
      "IMPORTANT - If you see 'auth/unauthorized-domain' errors:\n" +
      "1. Go to your Firebase project console.\n" +
      "2. Navigate to Authentication -> Settings -> Authorized domains.\n" +
      "3. Click 'Add domain' and add the domain from which your app is served (e.g., localhost, your-app-name.vercel.app, etc.).\n" +
      `   Your current Firebase config uses authDomain: '${firebaseConfig.authDomain}', ensure related domains are authorized.`
    );
  }
} catch (error) {
  console.error("CRITICAL: Firebase initialization failed in firebase.ts:", error);
  console.error("Firebase config (structure check):", {
    apiKey: firebaseConfig.apiKey ? 'Exists' : 'MISSING!',
    authDomain: firebaseConfig.authDomain ? 'Exists' : 'MISSING!',
    projectId: firebaseConfig.projectId ? 'Exists' : 'MISSING!',
  });
  // If you're still facing issues, double-check that Google Sign-In (or other providers)
  // are enabled in Firebase Console -> Authentication -> Sign-in method.
}

export { app, db, authInstance as auth, googleProvider };
