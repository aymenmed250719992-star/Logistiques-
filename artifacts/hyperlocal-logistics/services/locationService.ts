import { Platform } from "react-native";

import type { CourierMode } from "@/context/AppContext";
import { updateCourierLocation } from "./firestoreService";

let locationInterval: ReturnType<typeof setInterval> | null = null;

export interface LatLng {
  latitude: number;
  longitude: number;
}

export async function getCurrentLocation(): Promise<LatLng | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(getSFDefaultLocation());
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(getSFDefaultLocation()),
        { timeout: 5000 }
      );
    });
  }

  try {
    const ExpoLocation = await import("expo-location");
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== "granted") return getSFDefaultLocation();
    const loc = await ExpoLocation.getCurrentPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced });
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return getSFDefaultLocation();
  }
}

function getSFDefaultLocation(): LatLng {
  // Default: downtown San Francisco, with minor jitter for demo purposes
  return {
    latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
    longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
  };
}

export function startLocationTracking(
  courierId: string,
  transportMode: CourierMode,
  onLocation?: (loc: LatLng) => void
): void {
  stopLocationTracking();

  const tick = async () => {
    const loc = await getCurrentLocation();
    if (!loc) return;
    onLocation?.(loc);
    try {
      await updateCourierLocation(courierId, loc.latitude, loc.longitude, transportMode);
    } catch {
      // silently ignore — user may not have Firestore set up yet
    }
  };

  tick();
  locationInterval = setInterval(tick, 15000); // update every 15s
}

export function stopLocationTracking(): void {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
}
