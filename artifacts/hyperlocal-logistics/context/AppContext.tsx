import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  FirestoreDelivery,
  DeliveryStatus,
} from "@/services/firestoreService";
import {
  subscribeToSenderDeliveries,
  subscribeToAvailableDeliveries,
  subscribeToCourierDeliveries,
  createDelivery,
  updateDeliveryStatus,
  updateCourierMode as fbUpdateCourierMode,
} from "@/services/firestoreService";
import { useAuth } from "./AuthContext";

export type CourierMode = "foot" | "bicycle" | "escooter" | "car";

// Re-export for legacy compatibility
export type { FirestoreDelivery as Delivery };
export type { DeliveryStatus };

const STORAGE_KEY = "hyperlocal_app_state_v2";

// Keep compatibility with existing components that use the old Delivery shape
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "sender" | "courier";
  courierMode: CourierMode;
  rating: number;
  totalDeliveries: number;
  earnings: number;
  isVerified: boolean;
}

interface AppContextValue {
  user: UserProfile | null;
  deliveries: FirestoreDelivery[];
  availableJobs: FirestoreDelivery[];
  activeDelivery: FirestoreDelivery | null;
  courierMode: CourierMode;
  isLoading: boolean;
  setCourierMode: (mode: CourierMode) => Promise<void>;
  postDelivery: (data: Omit<FirestoreDelivery, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  acceptJob: (deliveryId: string) => Promise<void>;
  updateStatus: (deliveryId: string, status: DeliveryStatus) => Promise<void>;
  setActiveDelivery: (d: FirestoreDelivery | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile } = useAuth();
  const [deliveries, setDeliveries] = useState<FirestoreDelivery[]>([]);
  const [availableJobs, setAvailableJobs] = useState<FirestoreDelivery[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<FirestoreDelivery | null>(null);
  const [courierMode, setCourierModeState] = useState<CourierMode>("bicycle");
  const [isLoading, setIsLoading] = useState(false);
  const unsubRefs = useRef<Array<() => void>>([]);

  // Sync courierMode from profile
  useEffect(() => {
    if (userProfile?.courierMode) {
      setCourierModeState(userProfile.courierMode as CourierMode);
    } else {
      AsyncStorage.getItem(STORAGE_KEY).then((s) => {
        if (s) {
          const p = JSON.parse(s);
          if (p.courierMode) setCourierModeState(p.courierMode);
        }
      });
    }
  }, [userProfile]);

  // Subscribe to Firestore based on role
  useEffect(() => {
    unsubRefs.current.forEach((u) => u());
    unsubRefs.current = [];

    if (!currentUser || !userProfile) {
      setDeliveries([]);
      setAvailableJobs([]);
      return;
    }

    if (userProfile.role === "sender") {
      const unsub = subscribeToSenderDeliveries(currentUser.uid, (docs) => {
        setDeliveries(docs);
        setIsLoading(false);
      });
      unsubRefs.current.push(unsub);
    } else {
      // Courier: subscribe to their accepted deliveries + all pending jobs
      const unsub1 = subscribeToCourierDeliveries(currentUser.uid, (docs) => {
        setDeliveries(docs);
        const active = docs.find((d) => d.status === "in_transit");
        if (active) setActiveDelivery(active);
        setIsLoading(false);
      });
      const unsub2 = subscribeToAvailableDeliveries((docs) => {
        setAvailableJobs(docs);
      });
      unsubRefs.current.push(unsub1, unsub2);
    }

    return () => {
      unsubRefs.current.forEach((u) => u());
    };
  }, [currentUser?.uid, userProfile?.role]);

  const user: UserProfile | null = userProfile
    ? {
        id: currentUser?.uid ?? "",
        name: userProfile.displayName,
        email: userProfile.email,
        role: userProfile.role,
        courierMode: (userProfile.courierMode as CourierMode) ?? "bicycle",
        rating: userProfile.rating ?? 5.0,
        totalDeliveries: userProfile.totalDeliveries ?? 0,
        earnings: userProfile.earnings ?? 0,
        isVerified: userProfile.isVerified ?? false,
      }
    : null;

  const setCourierMode = useCallback(
    async (mode: CourierMode) => {
      setCourierModeState(mode);
      try {
        const s = await AsyncStorage.getItem(STORAGE_KEY);
        const e = s ? JSON.parse(s) : {};
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...e, courierMode: mode }));
        if (currentUser) {
          await fbUpdateCourierMode(currentUser.uid, mode);
        }
      } catch {
        // ignore
      }
    },
    [currentUser]
  );

  const postDelivery = useCallback(
    async (data: Omit<FirestoreDelivery, "id" | "createdAt" | "updatedAt">) => {
      return createDelivery(data);
    },
    []
  );

  const acceptJob = useCallback(
    async (deliveryId: string) => {
      if (!currentUser || !userProfile) return;
      await updateDeliveryStatus(deliveryId, "in_transit", currentUser.uid, userProfile.displayName);
    },
    [currentUser, userProfile]
  );

  const updateStatus = useCallback(
    async (deliveryId: string, status: DeliveryStatus) => {
      await updateDeliveryStatus(deliveryId, status);
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        user,
        deliveries,
        availableJobs,
        activeDelivery,
        courierMode,
        isLoading,
        setCourierMode,
        postDelivery,
        acceptJob,
        updateStatus,
        setActiveDelivery,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
