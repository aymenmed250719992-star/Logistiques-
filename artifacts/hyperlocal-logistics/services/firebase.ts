import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration — values loaded from environment variables (Secrets)
// Set these in your Replit Secrets tab or .env file:
//   EXPO_PUBLIC_FIREBASE_API_KEY
//   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
//   EXPO_PUBLIC_FIREBASE_PROJECT_ID
//   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
//   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
//   EXPO_PUBLIC_FIREBASE_APP_ID
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize only once (hot reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

// Firestore collection names
export const COLLECTIONS = {
  USERS: "users",
  DELIVERIES: "deliveries",
  LOCATIONS: "locations",
} as const;
