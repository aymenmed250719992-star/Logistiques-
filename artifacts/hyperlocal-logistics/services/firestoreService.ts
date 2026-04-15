import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db, COLLECTIONS } from "./firebase";
import type { CourierMode } from "@/context/AppContext";

export type DeliveryStatus = "pending" | "in_transit" | "delivered" | "cancelled";

export interface FirestoreDelivery {
  id?: string;
  trackingId: string;
  status: DeliveryStatus;
  senderId: string;
  senderName: string;
  courierId: string | null;
  courierName: string | null;
  recipientName: string;
  packageSize: "small" | "medium" | "large";
  transportMode: CourierMode;
  pickup: { address: string; lat: number; lng: number };
  dropoff: { address: string; lat: number; lng: number };
  estimatedMinutes: number;
  distance: number;
  earnings: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function subscribeToSenderDeliveries(
  senderId: string,
  callback: (deliveries: FirestoreDelivery[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.DELIVERIES),
    where("senderId", "==", senderId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreDelivery));
    callback(docs);
  });
}

export function subscribeToAvailableDeliveries(
  callback: (deliveries: FirestoreDelivery[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.DELIVERIES),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreDelivery));
    callback(docs);
  });
}

export function subscribeToCourierDeliveries(
  courierId: string,
  callback: (deliveries: FirestoreDelivery[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.DELIVERIES),
    where("courierId", "==", courierId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FirestoreDelivery));
    callback(docs);
  });
}

export async function createDelivery(
  data: Omit<FirestoreDelivery, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTIONS.DELIVERIES), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus,
  courierId?: string,
  courierName?: string
): Promise<void> {
  const ref = doc(db, COLLECTIONS.DELIVERIES, deliveryId);
  const updates: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
  if (courierId) updates.courierId = courierId;
  if (courierName) updates.courierName = courierName;
  await updateDoc(ref, updates);
}

export async function updateCourierMode(uid: string, mode: CourierMode): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(ref, { courierMode: mode });
}

export async function updateCourierLocation(
  uid: string,
  lat: number,
  lng: number,
  mode: CourierMode
): Promise<void> {
  const ref = doc(db, COLLECTIONS.LOCATIONS, uid);
  await updateDoc(ref, {
    lat,
    lng,
    mode,
    timestamp: Timestamp.now(),
  }).catch(async () => {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(ref, { uid, lat, lng, mode, timestamp: Timestamp.now() });
  });
}

export interface CourierLocation {
  courierId: string;
  latitude: number;
  longitude: number;
  transportMode: CourierMode;
  timestamp: unknown;
}

export async function getDeliveryById(id: string): Promise<FirestoreDelivery | null> {
  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, COLLECTIONS.DELIVERIES, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreDelivery) : null;
}

export function subscribeToAllCourierLocations(
  callback: (locations: CourierLocation[]) => void
): () => void {
  return onSnapshot(collection(db, COLLECTIONS.LOCATIONS), (snap) => {
    const locs = snap.docs.map((d) => {
      const data = d.data();
      return {
        courierId: d.id,
        latitude: data.lat ?? 0,
        longitude: data.lng ?? 0,
        transportMode: data.mode as CourierMode,
        timestamp: data.timestamp,
      } as CourierLocation;
    });
    callback(locs);
  });
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, COLLECTIONS.USERS));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function approveCourier(uid: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(ref, { approvalStatus: "approved", isVerified: true });
}

export async function rejectCourier(uid: string): Promise<void> {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  await updateDoc(ref, { approvalStatus: "rejected" });
}
