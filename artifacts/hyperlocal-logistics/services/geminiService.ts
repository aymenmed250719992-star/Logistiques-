import type { CourierMode } from "@/context/AppContext";

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export interface RouteOptimizationRequest {
  pickupAddress: string;
  dropoffAddress: string;
  courierMode: CourierMode;
  weatherCondition?: string;
  distance: number;
}

export interface RouteOptimizationResult {
  recommendedMode: CourierMode;
  estimatedMinutes: number;
  routeSummary: string;
  weatherAdvice: string;
  tips: string[];
  alternativeMode?: CourierMode;
  alternativeMinutes?: number;
}

const COURIER_MODE_LABELS: Record<CourierMode, string> = {
  foot: "Walking",
  bicycle: "Bicycle",
  escooter: "E-Scooter",
  car: "Car",
};

export async function optimizeRoute(
  req: RouteOptimizationRequest
): Promise<RouteOptimizationResult> {
  const prompt = `You are an AI logistics assistant for a hyper-local delivery platform in the US.

Analyze this delivery and provide route optimization advice:
- Pickup: ${req.pickupAddress}
- Dropoff: ${req.dropoffAddress}
- Distance: ${req.distance} miles
- Current courier mode: ${COURIER_MODE_LABELS[req.courierMode]}
- Weather: ${req.weatherCondition || "Clear, sunny"}

Provide a JSON response with these exact fields:
{
  "recommendedMode": "foot" | "bicycle" | "escooter" | "car",
  "estimatedMinutes": number,
  "routeSummary": "2-3 sentence description of the best route",
  "weatherAdvice": "one sentence weather-based tip",
  "tips": ["tip1", "tip2", "tip3"],
  "alternativeMode": "foot" | "bicycle" | "escooter" | "car",
  "alternativeMinutes": number
}

Consider traffic, weather, and package size. Keep tips concise and actionable.`;

  if (!GEMINI_API_KEY) {
    return getMockResponse(req);
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini");

    const parsed = JSON.parse(text);
    return parsed as RouteOptimizationResult;
  } catch {
    return getMockResponse(req);
  }
}

function getMockResponse(req: RouteOptimizationRequest): RouteOptimizationResult {
  const baseMinutes: Record<CourierMode, number> = {
    foot: Math.round(req.distance * 20),
    bicycle: Math.round(req.distance * 8),
    escooter: Math.round(req.distance * 6),
    car: Math.round(req.distance * 4),
  };

  const tips: Record<CourierMode, string[]> = {
    foot: [
      "Use sidewalks and pedestrian paths",
      "Watch for traffic at intersections",
      "Take breaks if carrying heavy packages",
    ],
    bicycle: [
      "Use dedicated bike lanes when available",
      "Lock your bike securely at pickup",
      "Signal turns clearly to motorists",
    ],
    escooter: [
      "Stay in bike lanes or on the road",
      "Wear a helmet for safety",
      "Check battery before long routes",
    ],
    car: [
      "Enable GPS for turn-by-turn navigation",
      "Use parking apps to find quick spots",
      "Avoid rush hour if possible",
    ],
  };

  return {
    recommendedMode: req.courierMode,
    estimatedMinutes: baseMinutes[req.courierMode],
    routeSummary: `Head ${req.pickupAddress} to ${req.dropoffAddress}. The most efficient route uses main streets with light traffic. Total distance is approximately ${req.distance} miles.`,
    weatherAdvice: "Current conditions are ideal for your selected transport mode.",
    tips: tips[req.courierMode],
    alternativeMode: req.courierMode === "bicycle" ? "escooter" : "bicycle",
    alternativeMinutes: req.courierMode === "bicycle" ? baseMinutes["escooter"] : baseMinutes["bicycle"],
  };
}
