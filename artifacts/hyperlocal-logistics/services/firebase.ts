import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  limit,
  query,
} from "firebase/firestore";

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
  POSTS: "posts",
} as const;

// ── Connection health check ────────────────────────────────────────────────
export type FirestoreStatus = "checking" | "connected" | "not-found" | "error";

/**
 * Pings Firestore and returns its status.
 * "not-found" → database doesn't exist for this project
 * "connected" → database is reachable
 * "error"     → some other error (permissions, network, …)
 */
export async function checkFirestoreConnection(): Promise<FirestoreStatus> {
  try {
    const q = query(collection(db, COLLECTIONS.USERS), limit(1));
    await getDocs(q);
    return "connected";
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (
      e.code === "not-found" ||
      e.message?.toLowerCase().includes("not_found") ||
      e.message?.toLowerCase().includes("does not exist")
    ) {
      return "not-found";
    }
    return "error";
  }
}
