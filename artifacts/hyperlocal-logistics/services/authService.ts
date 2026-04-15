import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

import { auth, db, COLLECTIONS } from "./firebase";
import type { CourierMode } from "@/context/AppContext";

export type UserRole = "sender" | "courier" | "admin";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export const ADMIN_EMAIL = "aymenmed25071999@gmail.com";

export interface FirestoreUser {
  firebaseUid: string;
  customerId: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  displayName: string;
  email: string;
  courierMode: CourierMode;
  rating: number;
  totalDeliveries: number;
  earnings: number;
  isVerified: boolean;
  createdAt: unknown;
}

function generateCustomerId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "USR-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  role: UserRole
): Promise<FirestoreUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });

  const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const actualRole: UserRole = isAdmin ? "admin" : role;
  const approvalStatus: ApprovalStatus =
    actualRole === "courier" ? "pending" : "approved";

  const customerId = generateCustomerId();

  const userDoc: FirestoreUser = {
    firebaseUid: cred.user.uid,
    customerId,
    role: actualRole,
    approvalStatus,
    displayName,
    email,
    courierMode: "bicycle",
    rating: 5.0,
    totalDeliveries: 0,
    earnings: 0,
    isVerified: isAdmin || actualRole === "sender",
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
