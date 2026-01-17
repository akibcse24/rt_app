// ============================================================================
// FIREBASE CONFIGURATION AND INITIALIZATION (Enhanced with Messaging)
// ============================================================================
// This file serves as the bridge between our React application and the Firebase backend.
// It initializes the Firebase app instance and exports specific services (Auth, Firestore, Messaging)
// so they can be easily imported and used throughout the application.

// 1. IMPORT FIREBASE SDKs
// ----------------------------------------------------------------------------
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

// 2. FIREBASE CONFIGURATION OBJECT
// ----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-MOCK000000"
};

// VAPID Key for Push Notifications
// This key is used to identify your server to FCM
// Generate this in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
export const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

// 3. INITIALIZATION AND EXPORTS
// ----------------------------------------------------------------------------
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Initialize Firestore with offline persistence enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Messaging (only in browsers where it's supported)
export const getMessagingClient = async () => {
  const supported = await isSupported();
  if (supported && typeof window !== "undefined") {
    return getMessaging(app);
  }
  return null;
};

export default app;
