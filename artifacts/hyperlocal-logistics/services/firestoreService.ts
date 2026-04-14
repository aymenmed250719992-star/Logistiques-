import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";

import { db, COLLECTIONS } from "./firebase";
import type { CourierMode } from "@/context/AppContext";

export type DeliveryStatus = "pending" | "in_transit" | "delivered" | "cancelled";
export type TransportMode = CourierMode;

// ─── Delivery ───────────────────────────────────────────────────────────────

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
  transportMode: TransportMode;
  pickup: { address: string; lat: number; lng: number };
  dropoff: { address: string; lat: number; lng: number };
  estimatedMinutes: number;
  distance: number;
  earnings: number;
  createdAt: unknown;
  updatedAt: unknown;
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
  const updates: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
  if (courierId) updates.courierId = courierId;
  if (courierName) updates.courierName = courierName;
  await updateDoc(doc(db, COLLECTIONS.DELIVERIES, deliveryId), updates);
}

export function subscribeToSenderDeliveries(
  senderId: string,
  callback: (deliveries: FirestoreDelivery[]) => void
): Unsubscribe {
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
): Unsubscribe {
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
): Unsubscribe {
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

export async function getDeliveryById(deliveryId: string): Promise<FirestoreDelivery | null> {
  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, COLLECTIONS.DELIVERIES, deliveryId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as FirestoreDelivery) : null;
}

// ─── Location ────────────────────────────────────────────────────────────────

export interface CourierLocation {
  courierId: string;
  latitude: number;
  longitude: number;
  timestamp: unknown;
  transportMode: TransportMode;
}

export async function updateCourierLocation(
  courierId: string,
  latitude: number,
  longitude: number,
  transportMode: TransportMode
): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.LOCATIONS, courierId), {
    courierId,
    latitude,
    longitude,
    timestamp: serverTimestamp(),
    transportMode,
  });
}

export function subscribeToAllCourierLocations(
  callback: (locations: CourierLocation[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.LOCATIONS), (snap) => {
    const locs = snap.docs.map((d) => d.data() as CourierLocation);
    callback(locs);
  });
}

export function subscribeToCourierLocation(
  courierId: string,
  callback: (location: CourierLocation | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.LOCATIONS, courierId), (snap) => {
    callback(snap.exists() ? (snap.data() as CourierLocation) : null);
  });
}

// ─── Courier mode ────────────────────────────────────────────────────────────

export async function updateCourierMode(uid: string, mode: TransportMode): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    courierMode: mode,
    updatedAt: serverTimestamp(),
  });
}
