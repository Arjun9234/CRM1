
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;

// Ensure this runs only on the client side
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    try {
      if (
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId
      ) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        console.log(
          `Firebase initialized successfully for projectId: ${firebaseConfig.projectId}. Auth Domain: ${firebaseConfig.authDomain}`
        );

        // Log current domain for debugging auth/unauthorized-domain issues
        console.log(`Current app domain (window.location.hostname): ${window.location.hostname}`);
        console.log(`IMPORTANT - If you see 'auth/unauthorized-domain' errors:
1. Go to your Firebase project console.
2. Navigate to Authentication -> Settings tab -> Authorized domains.
3. Click 'Add domain' and add the domain your app is currently running on (e.g., localhost, your-app-name.vercel.app, ${window.location.hostname}).
   Your current Firebase config uses authDomain: '${firebaseConfig.authDomain}'. The domain you add must be able to host this authDomain or be the authDomain itself.
   For development, \`localhost\` is often needed. For deployed apps, ensure your production domain is listed.`);
   
        console.log(`
If you see 'auth/configuration-not-found' errors:
1. In Firebase Console -> Authentication -> Sign-in method, ensure 'Google' (and any other providers you use) is ENABLED.
2. Ensure your project has a 'Public-facing name' and 'Project support email' configured in Firebase Console -> Project settings -> General.`);


      } else {
        console.error(
          'Firebase config missing. Ensure all NEXT_PUBLIC_FIREBASE_ environment variables are set.'
        );
        // Fallback to prevent app crash, but Firebase services won't work
        // @ts-ignore - app and auth will be undefined but code expects them
        app = undefined;
        // @ts-ignore
        auth = undefined;
      }
    } catch (error: any) {
      console.error('Firebase client-side initialization failed:', error.code, error.message);
      // @ts-ignore
      app = undefined;
      // @ts-ignore
      auth = undefined;
    }
  } else {
    app = getApp();
    auth = getAuth(app);
  }
} else {
  // Server-side or non-browser environment
  // @ts-ignore
  app = undefined;
  // @ts-ignore
  auth = undefined;
}

// Add a check to ensure auth is a valid Firebase Auth instance, not a dummy object
if (auth && auth.name === undefined && typeof window !== 'undefined') { // `auth.name` is a property of a valid Auth instance
  console.warn("Firebase Auth might not be properly initialized. Check Firebase config (NEXT_PUBLIC_FIREBASE_... variables in .env) and initialization logs.");
}


export { app, auth as firebaseAuthService };
