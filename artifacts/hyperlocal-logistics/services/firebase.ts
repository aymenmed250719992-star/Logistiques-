/**
 * Firebase Configuration Template
 *
 * [!] SETUP REQUIRED:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project or select an existing one
 * 3. Add a Web app to your project
 * 4. Copy the Firebase config object below
 * 5. Set these values as environment variables in your .env file:
 *    EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
 *    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
 *    EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
 *    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
 *    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 *    EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
 *
 * 6. Enable Authentication in Firebase Console:
 *    - Go to Authentication > Sign-in method
 *    - Enable Email/Password
 *    - Enable Google (optional)
 *
 * 7. Enable Firestore Database:
 *    - Go to Firestore Database > Create database
 *    - Start in test mode for development
 *
 * 8. Install Firebase SDK:
 *    pnpm --filter @workspace/hyperlocal-logistics add firebase
 */

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
};

/**
 * Firestore Collection Structure:
 *
 * /users/{userId}
 *   - name: string
 *   - email: string
 *   - role: "sender" | "courier"
 *   - courierMode: "foot" | "bicycle" | "escooter" | "car"
 *   - rating: number
 *   - totalDeliveries: number
 *   - earnings: number
 *   - isVerified: boolean
 *   - createdAt: Timestamp
 *
 * /deliveries/{deliveryId}
 *   - trackingId: string
 *   - status: "pending" | "in_transit" | "delivered" | "cancelled"
 *   - pickup: { address: string, lat: number, lng: number }
 *   - dropoff: { address: string, lat: number, lng: number }
 *   - senderId: string
 *   - courierId: string | null
 *   - packageSize: "small" | "medium" | "large"
 *   - courierMode: CourierMode
 *   - estimatedMinutes: number
 *   - distance: number
 *   - earnings: number
 *   - createdAt: Timestamp
 *   - updatedAt: Timestamp
 *
 * /routes/{routeId}
 *   - deliveryId: string
 *   - waypoints: Array<{ lat: number, lng: number }>
 *   - optimizedBy: "gemini-1.5-flash"
 *   - weather: string
 *   - createdAt: Timestamp
 */

export const COLLECTIONS = {
  USERS: "users",
  DELIVERIES: "deliveries",
  ROUTES: "routes",
} as const;
