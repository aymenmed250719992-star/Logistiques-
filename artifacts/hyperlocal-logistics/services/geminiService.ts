import type { CourierMode } from "@/context/AppContext";
import type { LatLng } from "./locationService";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// ─── Route optimization (general) ────────────────────────────────────────────

export interface RouteOptimizationRequest {
  pickupAddress: string;
  dropoffAddress: string;
  courierMode: CourierMode;
  weatherCondition?: string;
  distance: number;
  currentLocation?: LatLng;
}

export interface RouteOptimizationResult {
  recommendedMode: CourierMode;
  estimatedMinutes: number;
  routeSummary: string;
  weatherAdvice: string;
  tips: string[];
  alternativeMode?: CourierMode;
  alternativeMinutes?: number;
  smartStrategy?: string;
}

const MODE_LABELS: Record<CourierMode, string> = {
  foot: "Walking",
  bicycle: "Bicycle",
  escooter: "E-Scooter",
  car: "Car",
};

async function callGemini(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 768,
          responseMimeType: "application/json",
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

export async function optimizeRoute(
  req: RouteOptimizationRequest
): Promise<RouteOptimizationResult> {
  const locationStr = req.currentLocation
    ? `Courier's current GPS: lat ${req.currentLocation.latitude.toFixed(4)}, lng ${req.currentLocation.longitude.toFixed(4)}`
    : "Current location: not available";

  const prompt = `You are an AI logistics assistant for a hyper-local delivery app in the US.

Delivery details:
- Pickup: ${req.pickupAddress}
- Dropoff: ${req.dropoffAddress}
- Distance: ${req.distance} miles
- Courier mode: ${MODE_LABELS[req.courierMode]}
- Weather: ${req.weatherCondition || "Clear, sunny"}
- ${locationStr}

Give a "Smart Route Strategy" that is mode-specific (e.g. "Since you are on a Bicycle, take the park shortcut to avoid traffic on 5th Ave").

Respond ONLY with valid JSON:
{
  "recommendedMode": "foot"|"bicycle"|"escooter"|"car",
  "estimatedMinutes": number,
  "routeSummary": "2-3 sentence route description",
  "weatherAdvice": "one sentence weather tip",
  "smartStrategy": "one vivid actionable strategy sentence specific to the transport mode",
  "tips": ["tip1","tip2","tip3"],
  "alternativeMode": "foot"|"bicycle"|"escooter"|"car",
  "alternativeMinutes": number
}`;

  const text = await callGemini(prompt);
  if (text) {
    try {
      return JSON.parse(text) as RouteOptimizationResult;
    } catch {
      // fall through to mock
    }
  }
  return getMockResponse(req);
}

// ─── optimizeRoute(deliveryId) — Firestore-integrated ───────────────────────

export interface SmartRouteStrategy {
  deliveryId: string;
  strategy: string;
  tips: string[];
  estimatedMinutes: number;
  recommendedMode: CourierMode;
}

export async function optimizeRouteByDeliveryId(
  deliveryId: string,
  currentLocation?: LatLng
): Promise<SmartRouteStrategy> {
  // Lazy-import to avoid circular deps
  const { getDeliveryById } = await import("./firestoreService");
  const delivery = await getDeliveryById(deliveryId);

  if (!delivery) {
    return {
      deliveryId,
      strategy: "Delivery not found. Please check the tracking ID.",
      tips: [],
      estimatedMinutes: 0,
      recommendedMode: "bicycle",
    };
  }

  const locationStr = currentLocation
    ? `Courier current GPS: lat ${currentLocation.latitude.toFixed(4)}, lng ${currentLocation.longitude.toFixed(4)}`
    : "Courier location: not available";

  const prompt = `You are an AI logistics assistant for a hyper-local delivery platform in the US.

Delivery ID: ${deliveryId}
Pickup: ${delivery.pickup.address}
Dropoff: ${delivery.dropoff.address}
Distance: ${delivery.distance} miles
Transport mode: ${MODE_LABELS[delivery.transportMode]}
Package size: ${delivery.packageSize}
${locationStr}

Create a "Smart Route Strategy" — a vivid, actionable, mode-specific navigation tip.
Examples of good strategies:
- "Since you are on a Bicycle, take the Valencia Street bike lane to avoid Mission traffic — saves 4 minutes"
- "As a Walker, cut through Union Square park on the north side — quicker than sidewalks and avoids construction"
- "On your E-Scooter, use the Embarcadero waterfront path — smoother surface and no traffic lights"

Respond ONLY with valid JSON:
{
  "strategy": "one vivid, specific, actionable mode-tailored strategy sentence",
  "tips": ["short tip 1","short tip 2","short tip 3"],
  "estimatedMinutes": number,
  "recommendedMode": "foot"|"bicycle"|"escooter"|"car"
}`;

  const text = await callGemini(prompt);
  if (text) {
    try {
      const parsed = JSON.parse(text);
      return {
        deliveryId,
        strategy: parsed.strategy || "Take the most direct route available.",
        tips: parsed.tips || [],
        estimatedMinutes: parsed.estimatedMinutes || delivery.estimatedMinutes,
        recommendedMode: parsed.recommendedMode || delivery.transportMode,
      };
    } catch {
      // fall through
    }
  }

  // Fallback mock strategies by mode
  const modeStrategies: Record<CourierMode, string> = {
    foot: `As a Walker, take pedestrian shortcuts through ${delivery.pickup.address.split(",")[1]?.trim() || "downtown"} — use crosswalks and avoid main avenues during rush hour`,
    bicycle: `Since you are on a Bicycle, use dedicated bike lanes and take the park shortcut if available — saves time vs main roads`,
    escooter: `On your E-Scooter, use the bike-lane network and stay off sidewalks — the direct route along main streets is fastest`,
    car: `Driving to ${delivery.dropoff.address.split(",")[0]}: use navigation to avoid peak-hour streets and find metered parking near the dropoff`,
  };

  const mins: Record<CourierMode, number> = { foot: 20, bicycle: 8, escooter: 6, car: 4 };

  return {
    deliveryId,
    strategy: modeStrategies[delivery.transportMode],
    tips: getMockTips(delivery.transportMode),
    estimatedMinutes: Math.round(delivery.distance * mins[delivery.transportMode]),
    recommendedMode: delivery.transportMode,
  };
}

function getMockTips(mode: CourierMode): string[] {
  const tips: Record<CourierMode, string[]> = {
    foot: ["Use sidewalks and marked crossings", "Watch for traffic at intersections", "Take breaks if carrying heavy packages"],
    bicycle: ["Use dedicated bike lanes where available", "Lock your bike securely at pickup", "Signal turns clearly to motorists"],
    escooter: ["Stay in bike lanes, not on sidewalks", "Wear a helmet for safety", "Check battery charge before long routes"],
    car: ["Enable GPS for turn-by-turn navigation", "Use parking apps for quick spots", "Avoid rush hour streets if possible"],
  };
  return tips[mode];
}

function getMockResponse(req: RouteOptimizationRequest): RouteOptimizationResult {
  const mins: Record<CourierMode, number> = {
    foot: Math.round(req.distance * 20),
    bicycle: Math.round(req.distance * 8),
    escooter: Math.round(req.distance * 6),
    car: Math.round(req.distance * 4),
  };
  const altMode: CourierMode = req.courierMode === "bicycle" ? "escooter" : "bicycle";
  return {
    recommendedMode: req.courierMode,
    estimatedMinutes: mins[req.courierMode],
    routeSummary: `Heading from ${req.pickupAddress} to ${req.dropoffAddress}. The most efficient route uses main streets with light current traffic. Total distance is approximately ${req.distance} miles.`,
    weatherAdvice: "Current conditions are ideal for your selected transport mode.",
    smartStrategy: `Since you are on ${MODE_LABELS[req.courierMode]}, take the most direct path and avoid construction zones — check local signage near the destination.`,
    tips: getMockTips(req.courierMode),
    alternativeMode: altMode,
    alternativeMinutes: mins[altMode],
  };
}
