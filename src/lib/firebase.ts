// Firebase related utilities, if any are still needed (e.g., for Genkit or other services)
// For now, primary Auth and Firestore usage is removed due to migration to Node.js/MongoDB backend.

// If Genkit still relies on some Firebase project context or other Firebase services not related to user auth/database,
// that initialization might remain here. Otherwise, this file might become very minimal or be removed.

// Example: If Firebase Storage was used, its initialization would remain.
// import { getStorage } from 'firebase/storage';

// For now, keeping it minimal as the core request is to move data and auth.

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, 
// };

// let app: FirebaseApp | undefined;
// if (typeof window !== 'undefined' && !getApps().length) {
//   try {
//     if (firebaseConfig.apiKey && firebaseConfig.projectId) {
//        app = initializeApp(firebaseConfig);
//        console.log("Firebase app initialized (client-side only, for non-auth/db services if any).");
//     } else {
//        console.warn("Firebase config missing for non-auth/db services, client-side app not initialized.");
//     }
//   } catch (error) {
//     console.error("Firebase client-side initialization for other services failed:", error);
//   }
// } else if (typeof window !== 'undefined') {
//   app = getApp();
// }

// export { app }; // Export app if needed by other Firebase services like Storage or Genkit plugins

console.log("Firebase.ts: Auth and Firestore have been migrated to a custom Node.js backend.");
// Ensure this file doesn't try to initialize Firebase services that are no longer used.
// Genkit's GoogleAI plugin does not require Firebase client SDK initialization.

export {}; // Placeholder to make it a module if nothing else is exported.
