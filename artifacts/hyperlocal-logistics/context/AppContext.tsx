import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type CourierMode = "foot" | "bicycle" | "escooter" | "car";

export interface Delivery {
  id: string;
  trackingId: string;
  status: "pending" | "in_transit" | "delivered" | "cancelled";
  pickup: {
    address: string;
    lat: number;
    lng: number;
  };
  dropoff: {
    address: string;
    lat: number;
    lng: number;
  };
  senderName: string;
  recipientName: string;
  packageSize: "small" | "medium" | "large";
  courierMode: CourierMode;
  estimatedMinutes: number;
  distance: number;
  createdAt: string;
  earnings: number;
}

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

interface AppState {
  user: UserProfile | null;
  deliveries: Delivery[];
  activeDelivery: Delivery | null;
  courierMode: CourierMode;
  isLoading: boolean;
}

interface AppContextValue extends AppState {
  setUser: (user: UserProfile | null) => void;
  setCourierMode: (mode: CourierMode) => void;
  addDelivery: (delivery: Delivery) => void;
  updateDelivery: (id: string, updates: Partial<Delivery>) => void;
  setActiveDelivery: (delivery: Delivery | null) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "hyperlocal_app_state";

const MOCK_USER: UserProfile = {
  id: "user_001",
  name: "Alex Rivera",
  email: "alex@example.com",
  role: "courier",
  courierMode: "bicycle",
  rating: 4.8,
  totalDeliveries: 142,
  earnings: 2340.5,
  isVerified: true,
};

const MOCK_DELIVERIES: Delivery[] = [
  {
    id: "del_001",
    trackingId: "HLL-2024-001",
    status: "in_transit",
    pickup: { address: "123 Main St, San Francisco", lat: 37.7749, lng: -122.4194 },
    dropoff: { address: "456 Market St, San Francisco", lat: 37.7935, lng: -122.3966 },
    senderName: "Sarah K.",
    recipientName: "Mike T.",
    packageSize: "small",
    courierMode: "bicycle",
    estimatedMinutes: 12,
    distance: 2.4,
    createdAt: new Date().toISOString(),
    earnings: 8.5,
  },
  {
    id: "del_002",
    trackingId: "HLL-2024-002",
    status: "pending",
    pickup: { address: "789 Mission St, San Francisco", lat: 37.7833, lng: -122.4167 },
    dropoff: { address: "101 Howard St, San Francisco", lat: 37.788, lng: -122.3974 },
    senderName: "Emma L.",
    recipientName: "Jake R.",
    packageSize: "medium",
    courierMode: "escooter",
    estimatedMinutes: 18,
    distance: 3.1,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    earnings: 11.25,
  },
  {
    id: "del_003",
    trackingId: "HLL-2024-003",
    status: "delivered",
    pickup: { address: "200 2nd St, San Francisco", lat: 37.787, lng: -122.3988 },
    dropoff: { address: "350 Townsend St, San Francisco", lat: 37.775, lng: -122.3962 },
    senderName: "David M.",
    recipientName: "Lisa P.",
    packageSize: "large",
    courierMode: "car",
    estimatedMinutes: 22,
    distance: 4.7,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    earnings: 16.0,
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(MOCK_USER);
  const [deliveries, setDeliveries] = useState<Delivery[]>(MOCK_DELIVERIES);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(MOCK_DELIVERIES[0]);
  const [courierMode, setCourierModeState] = useState<CourierMode>("bicycle");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPersistedState();
  }, []);

  const loadPersistedState = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.courierMode) setCourierModeState(parsed.courierMode);
      }
    } catch {
    }
  };

  const setUser = useCallback((u: UserProfile | null) => {
    setUserState(u);
  }, []);

  const setCourierMode = useCallback(async (mode: CourierMode) => {
    setCourierModeState(mode);
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const existing = saved ? JSON.parse(saved) : {};
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, courierMode: mode }));
    } catch {
    }
  }, []);

  const addDelivery = useCallback((delivery: Delivery) => {
    setDeliveries((prev) => [delivery, ...prev]);
  }, []);

  const updateDelivery = useCallback((id: string, updates: Partial<Delivery>) => {
    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  }, []);

  const logout = useCallback(async () => {
    setUserState(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        deliveries,
        activeDelivery,
        courierMode,
        isLoading,
        setUser,
        setCourierMode,
        addDelivery,
        updateDelivery,
        setActiveDelivery,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
