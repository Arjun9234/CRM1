
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth as FirebaseAuthType, GoogleAuthProvider } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, 
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let authInstance: FirebaseAuthType | undefined; 
const googleProvider = new GoogleAuthProvider(); // This can be initialized regardless

console.log("Firebase module loaded. Configuration used:", {
    apiKey: firebaseConfig.apiKey ? 'Exists' : 'MISSING!',
    authDomain: firebaseConfig.authDomain ? 'Exists' : 'MISSING!',
    projectId: firebaseConfig.projectId ? 'Exists' : 'MISSING!',
    storageBucket: firebaseConfig.storageBucket ? 'Exists' : 'Exists',
    messagingSenderId: firebaseConfig.messagingSenderId ? 'Exists' : 'Exists',
    appId: firebaseConfig.appId ? 'Exists' : 'Exists',
    measurementId: firebaseConfig.measurementId ? 'Exists' : 'Exists (Optional)',
});


if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('CRITICAL Firebase config is missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID. Firebase SDK will not be initialized. Check your .env file and ensure it is loaded correctly.');
} else if (!firebaseConfig.authDomain) {
    console.error('CRITICAL Firebase config is missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN. Authentication will likely fail. Check .env file.');
} else {
  try {
    console.log(`Attempting to initialize Firebase with projectId: ${firebaseConfig.projectId} and authDomain: ${firebaseConfig.authDomain}`);
    if (typeof window !== 'undefined') { // Log client-side hostname if available
        console.log(`Current app domain (window.location.hostname): ${window.location.hostname}`);
    }

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized for the first time.");
    } else {
      app = getApp();
      console.log("Firebase app already initialized, getting existing instance.");
    }
    
    db = getFirestore(app);
    authInstance = getAuth(app);
    console.log(`Firebase services (Firestore, Auth) obtained successfully for projectId: ${authInstance.app.options.projectId}.`);
    
    // Informational warnings for common auth issues
    console.warn(
      "IMPORTANT - If you see 'auth/unauthorized-domain' errors:\n" +
      "1. Go to your Firebase project console.\n" +
      "2. Navigate to Authentication -> Settings tab -> Authorized domains.\n" +
      "3. Click 'Add domain' and add the domain your app is currently running on (e.g., localhost, your-app-name.vercel.app, specific_cloud_workstation_domain.dev). \n" +
      `   Your current Firebase config uses authDomain: '${firebaseConfig.authDomain}'. The domain you add must be able to host this authDomain or be the authDomain itself.\n`+
      "   For development, `localhost` is often needed. For deployed apps, ensure your production domain is listed."
    );
    console.warn(
      "If you see 'auth/configuration-not-found' errors:\n" +
      "1. In Firebase Console -> Authentication -> Sign-in method, ensure 'Google' (and any other providers you use) is ENABLED.\n" +
      "2. Ensure your project has a 'Public-facing name' and 'Project support email' configured in Firebase Console -> Project settings -> General."
    );

  } catch (error: any) {
    console.error("CRITICAL: Firebase initialization failed within try-catch block in firebase.ts:", error.message, error.stack);
    // `app`, `db`, `authInstance` will remain undefined
  }
}

export { app, db, authInstance as auth, googleProvider };
