import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import { auth, db, COLLECTIONS } from "./firebase";
import type { CourierMode } from "@/context/AppContext";

export type UserRole = "sender" | "courier";

export interface FirestoreUser {
  firebaseUid: string;
  role: UserRole;
  displayName: string;
  email: string;
  courierMode: CourierMode;
  rating: number;
  totalDeliveries: number;
  earnings: number;
  isVerified: boolean;
  createdAt: unknown;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<FirestoreUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  const userDoc: FirestoreUser = {
    firebaseUid: cred.user.uid,
    role,
    displayName,
    email,
    courierMode: "bicycle",
    rating: 5.0,
    totalDeliveries: 0,
    earnings: 0,
    isVerified: false,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), userDoc);
  return userDoc;
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string): Promise<FirestoreUser | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snap.exists() ? (snap.data() as FirestoreUser) : null;
}
