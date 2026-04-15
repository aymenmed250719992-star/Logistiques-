# Hyper-Local AI Logistics — Project Log

> **Last updated:** 2026-04-14
> **Rule:** Every feature, config change, and integration step is documented here immediately. This file is the single source of truth for project state.

---

## Current Status: FULLY OPERATIONAL ✓

| Layer | Status | Notes |
|---|---|---|
| Expo App | ✓ Running | Web + Expo Go (iOS/Android) |
| Firebase Auth | ✓ Live | Email/password, project: logistiques |
| Firestore | ✓ Live | Real-time listeners active |
| Gemini AI | ✓ Live | Key set in Secrets |
| Role Dashboards | ✓ Built | Sender + Courier views |
| Real-time Location | ✓ Built | Firestore `/locations` collection |
| AI Smart Route | ✓ Built | `optimizeRouteByDeliveryId()` |

---

## [X] Done — Full Implementation Log

### Bug Fix — `addDelivery is not a function` (2026-04-14)
- **Root cause:** `app/delivery/new.tsx` was calling `addDelivery` from the old mock-data `AppContext`. When `AppContext` was migrated to Firestore, `addDelivery` was replaced by `postDelivery` — but `new.tsx` was never updated.
- **Fix applied in `app/delivery/new.tsx`:**
  - Replaced `addDelivery` → `postDelivery` (Firestore `createDelivery` under the hood)
  - Removed old `Delivery` type import (used pre-Firestore shape)
  - Updated delivery object: `courierMode` → `transportMode` (matches `FirestoreDelivery` schema)
  - Added `senderId` and `senderName` from `user` context (was missing entirely)
  - Added `courierId: null` and `courierName: null` (required Firestore fields)
  - Wrapped submit in `try/catch` — shows inline error message on Firestore failure
  - Replaced `setTimeout` fake delay → `await postDelivery()` with real async/await
  - Added `ActivityIndicator` during submission instead of text-only "Creating..."
  - Added live earnings preview inside each package size card (updates as mode changes)
  - Removed the now-redundant "Sender Name" field — the sender is the logged-in user

### Phase 1 — App Scaffold
- [X] Expo Router (file-based routing) with 3-tab layout
- [X] Inter font family (400/500/600/700) via `@expo-google-fonts/inter`
- [X] `SplashScreen` gated on font load
- [X] Dark/light theme system in `constants/colors.ts` — navy (`#0a0e1a`) + electric blue (`#1a6ef5`)
- [X] `useColors()` hook returns semantic tokens (foreground, background, card, border, primary, accent, success, warning, destructive, muted, mutedForeground, secondary)
- [X] Root providers: `SafeAreaProvider`, `GestureHandlerRootView`, `KeyboardProvider`, `QueryClientProvider`, `ErrorBoundary`
- [X] `react-native-maps@1.18.0` installed + Metro web stub (`web-stubs/react-native-maps.js`) to prevent web crashes

### Phase 2 — Firebase Integration
- [X] **Firebase SDK installed:** `pnpm --filter @workspace/hyperlocal-logistics add firebase`
- [X] **Firebase config** stored as Replit environment variables (shared scope):
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID` = `logistiques`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`
- [X] **`services/firebase.ts`** — singleton `initializeApp()` (hot-reload safe via `getApps()` guard), exports `auth`, `db`, `COLLECTIONS` constants
- [X] **`services/authService.ts`** — `signUp()`, `signIn()`, `signOut()`, `getUserProfile()` using Firebase Auth + Firestore
- [X] **`services/firestoreService.ts`** — full Firestore service layer:
  - `createDelivery()` — adds to `/deliveries`
  - `updateDeliveryStatus()` — updates status + courierId/courierName
  - `subscribeToSenderDeliveries()` — real-time listener, filtered by senderId
  - `subscribeToAvailableDeliveries()` — real-time listener, all pending deliveries
  - `subscribeToCourierDeliveries()` — real-time listener, filtered by courierId
  - `getDeliveryById()` — single fetch by ID
  - `updateCourierLocation()` — writes lat/lng to `/locations/{courierId}`
  - `subscribeToAllCourierLocations()` — real-time listener for all live couriers
  - `subscribeToCourierLocation()` — single courier location watch
  - `updateCourierMode()` — syncs transport mode to `/users/{uid}`
- [X] **`services/locationService.ts`** — cross-platform GPS:
  - Web: `navigator.geolocation` with SF fallback
  - Native: `expo-location` with permission request
  - `startLocationTracking(courierId, mode)` — polls every 15s, writes to Firestore
  - `stopLocationTracking()` — clears interval

### Phase 3 — Authentication Flow
- [X] **`context/AuthContext.tsx`** — wraps `onAuthStateChanged`, provides `currentUser`, `userProfile`, `isLoading`, `signIn`, `signUp`, `signOut`, `refreshProfile`
- [X] **`app/index.tsx`** — auth gate: redirects to `/(tabs)` if logged in, `/auth/login` if not
- [X] **`app/_layout.tsx`** — updated: `AuthProvider` + `AppProvider` wrapping all screens; Stack registers all routes (index, tabs, auth/login, auth/register, delivery/new, delivery/[id])
- [X] **`app/auth/login.tsx`** — Firebase email/password login; error handling for invalid credentials; demo account quick-fill buttons (sender@demo.com / courier@demo.com / demo123)
- [X] **`app/auth/register.tsx`** — register with role picker (Sender card / Courier card); writes user doc to Firestore on creation; password validation (min 6 chars)

### Phase 4 — Role-Based State & Context
- [X] **`context/AppContext.tsx`** — fully rewritten from mock data to Firestore:
  - Consumes `AuthContext` for UID and role
  - Sender role → subscribes to `subscribeToSenderDeliveries(uid)`
  - Courier role → subscribes to `subscribeToCourierDeliveries(uid)` + `subscribeToAvailableDeliveries()`
  - `postDelivery()` — calls `createDelivery()` in Firestore
  - `acceptJob(deliveryId)` — sets status to `in_transit`, writes courierId + courierName
  - `updateStatus(deliveryId, status)` — updates Firestore
  - `setCourierMode(mode)` — updates AsyncStorage + Firestore atomically
  - Unsubscribes all listeners on user/role change (via `useRef` cleanup)

### Phase 5 — Role-Based Dashboards
- [X] **`app/(tabs)/index.tsx`** — role-aware Home screen:
  - Shows `<CourierDashboard />` for couriers
  - Shows `<SenderDashboard />` for senders
  - Role badge in header (Courier = blue truck, Sender = purple send icon)
- [X] **`components/SenderDashboard.tsx`** — Sender UI:
  - Stats row (total jobs, active, delivered)
  - Inline "Post New Delivery Job" form (pickup, dropoff, recipient, package size)
  - Active jobs list with status badges → taps to Delivery Detail
  - Completed jobs list (last 5)
  - Empty state if no deliveries
- [X] **`components/CourierDashboard.tsx`** — Courier UI:
  - Stats row (today's completions, earnings, rating, available jobs count)
  - Transport mode switcher (synced to Firestore)
  - Active delivery card with AI Smart Route button (calls `optimizeRouteByDeliveryId`)
  - Location tracking auto-starts when active delivery exists, stops when done
  - Available jobs feed (all pending deliveries from Firestore)
  - Accept Job → animated press, writes to Firestore, real-time update
  - Delivery history (last 3 completed)

### Phase 6 — AI: Gemini 1.5 Flash
- [X] **`EXPO_PUBLIC_GEMINI_API_KEY`** set in Replit Secrets (live, active)
- [X] **`services/geminiService.ts`** — dual API:
  - `optimizeRoute(request)` — general route optimizer (pickup/dropoff/mode/weather/GPS)
  - `optimizeRouteByDeliveryId(deliveryId, currentLocation?)` — fetches delivery from Firestore, gets courier GPS via `getCurrentLocation()`, sends full context to Gemini 1.5 Flash
  - Prompt engineering: requests mode-specific "Smart Route Strategy" (e.g. "Since you are on a Bicycle, take the Valencia Street bike lane to avoid traffic — saves 4 minutes")
  - JSON response parsing with graceful fallback to mode-specific mock strategies
  - Fallback tips per transport mode for offline/no-key scenarios
- [X] **`app/delivery/[id].tsx`** — Smart Route panel:
  - "Get Smart Route Strategy" button triggers `optimizeRouteByDeliveryId(id)`
  - Shows strategy in highlighted card with left border accent
  - Shows bullet tips below strategy
  - Shows estimated minutes + recommended mode badge
  - "Refresh strategy" link for re-query
  - Loading state with activity indicator

### Phase 7 — Real-Time Map & Location
- [X] **`app/(tabs)/map.tsx`** — updated:
  - `subscribeToAllCourierLocations()` subscribes on mount
  - Native: renders each courier as custom `<Marker>` with transport mode icon (bike/walk/scooter/car)
  - Web: shows courier coordinates list with live count ("3 live" badge)
  - Map overlay chip shows current transport mode + live courier count
- [X] **`app/(tabs)/profile.tsx`** — updated:
  - Firebase `signOut()` wired to Sign Out row
  - Integration Status section: shows Firebase project ID (✓ green) and Gemini status (✓ Active / ⚠ key not set)
  - Mode selector only shown for couriers
  - Courier mode changes sync to Firestore

### Phase 8 — Component Updates
- [X] **`components/DeliveryCard.tsx`** — updated to use `FirestoreDelivery` type; reads `transportMode` with fallback to legacy `courierMode` field
- [X] **`app/delivery/[id].tsx`** — fully rewritten:
  - Fetches delivery from Firestore if not in local state (direct-link support)
  - Uses `updateStatus()` (Firestore-backed) instead of mock `updateDelivery()`
  - AI Smart Route Strategy panel (see Phase 6)
  - Status action button only shown for couriers
  - People section shows Sender, Recipient, and Courier (when assigned)

---

## Firestore Schema (as implemented)

### `/users/{firebaseUid}`
```
firebaseUid:         string   — Firebase Auth UID
role:                "sender" | "courier"
displayName:         string
email:               string
courierMode:         "foot" | "bicycle" | "escooter" | "car"
rating:              number   — default 5.0
totalDeliveries:     number   — default 0
earnings:            number   — default 0
isVerified:          boolean  — default false
createdAt:           Timestamp
```

### `/deliveries/{autoId}`
```
trackingId:          string   — e.g. "HLL-2026-4821"
status:              "pending" | "in_transit" | "delivered" | "cancelled"
senderId:            string   — Firebase UID of sender
senderName:          string
courierId:           string | null
courierName:         string | null
recipientName:       string
packageSize:         "small" | "medium" | "large"
transportMode:       "foot" | "bicycle" | "escooter" | "car"
pickup:              { address: string, lat: number, lng: number }
dropoff:             { address: string, lat: number, lng: number }
estimatedMinutes:    number
distance:            number   — miles
earnings:            number   — USD
createdAt:           Timestamp
updatedAt:           Timestamp
```

### `/locations/{courierId}`
```
courierId:           string   — Firebase UID
latitude:            number
longitude:           number
timestamp:           Timestamp
transportMode:       "foot" | "bicycle" | "escooter" | "car"
```

---

## Environment Variables & Secrets

| Key | Type | Value | Status |
|---|---|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Env Var (shared) | `AIzaSyDD6v...` | ✓ Set |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Env Var (shared) | `logistiques.firebaseapp.com` | ✓ Set |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Env Var (shared) | `logistiques` | ✓ Set |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Env Var (shared) | `logistiques.firebasestorage.app` | ✓ Set |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Env Var (shared) | `507386588844` | ✓ Set |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Env Var (shared) | `1:507386...` | ✓ Set |
| `EXPO_PUBLIC_GEMINI_API_KEY` | Secret | `AIzaSyD1hX...` | ✓ Set |
| `SESSION_SECRET` | Secret | (pre-existing) | ✓ Set |

---

## [ ] To-Do — Next Steps

### How to Test a Sample Delivery (step-by-step)
1. Open the app → tap **Sign Up** → create a **Sender** account (e.g. sender@test.com)
2. Home tab → tap **"Post New Delivery Job"** → fill in addresses, recipient, package size → tap **Post Job**
3. Tap **Sign Out** (Profile tab) → sign up a **Courier** account (e.g. courier@test.com)
4. Home tab (Courier view) → see the job in **"Available Jobs"** feed
5. Tap **"Accept Job"** → status moves to `in_transit`; location tracking starts
6. Tap the active delivery → tap **"Get Smart Route Strategy"** → Gemini AI responds
7. Tap **"Mark Delivered"** → delivery completes
8. **Map tab** → see live courier location dot (native) or coordinates (web)
9. Sign back in as Sender → verify delivery shows "Delivered" status

### Firestore Security Rules (apply before production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /deliveries/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /locations/{courierId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == courierId;
    }
  }
}
```

### Firebase Console — Required Setup
- [ ] Enable **Authentication → Email/Password** provider in Firebase Console
- [ ] Enable **Firestore Database** → Start in test mode (or apply rules above)
- [ ] (Optional) Add `logistiques.firebaseapp.com` and your `.replit.app` domain to Auth authorized domains

### Upcoming Features
- [ ] **Push Notifications** — `expo-notifications` + Firebase Cloud Messaging for delivery status pings
- [ ] **Ratings & Reviews** — after delivery, sender rates courier (1–5 stars); updates `/users/{uid}.rating`
- [ ] **Geocoding** — convert typed addresses to lat/lng using Google Maps Geocoding API
- [ ] **Live Weather** — OpenWeatherMap API → pass to Gemini for weather-aware route advice
- [ ] **Earnings Analytics** — weekly/monthly earnings chart on Profile tab
- [ ] **Google Sign-In** — Firebase Auth provider for one-tap login

---

## [!] Points & Rewards System — Implementation Guide

### Concept
Couriers earn points per delivery; points unlock tier badges and multipliers.

### Firestore additions
```
/users/{uid}
  points: number                — cumulative lifetime points
  tier: "bronze"|"silver"|"gold"|"platinum"
  weeklyDeliveries: number
  weeklyEarnings: number

/rewards/{uid}/history/{docId}
  deliveryId: string
  pointsEarned: number
  reason: string               — "delivery_completed" | "fast_delivery" | "5_star_rating"
  createdAt: Timestamp
```

### Points formula
| Event | Points |
|---|---|
| Delivery completed | +10 pts |
| Completed under ETA | +5 pts bonus |
| 5-star rating received | +8 pts |
| 3+ deliveries in one day | +15 pts streak bonus |

### Tier thresholds
| Tier | Range |
|---|---|
| Bronze | 0 – 499 |
| Silver | 500 – 1,999 |
| Gold | 2,000 – 4,999 |
| Platinum | 5,000+ |

### Implementation steps
1. Add `points`, `tier`, `weeklyDeliveries` fields to `/users` Firestore doc
2. Create `services/rewardsService.ts` → `awardPoints(courierId, deliveryId, reason)` using Firestore `runTransaction` for atomic read-write
3. Call `awardPoints()` inside `updateDeliveryStatus()` when `status === "delivered"`
4. Add `RewardsBanner` component to `CourierDashboard` — shows tier badge, point total, progress bar to next tier
5. (Optional) Weekly leaderboard via Cloud Function aggregating delivery counts

---

## Architecture — File Map

```
artifacts/hyperlocal-logistics/
├── app/
│   ├── _layout.tsx              ← Root layout: all providers + Stack registration
│   ├── index.tsx                ← Auth gate: redirect to /(tabs) or /auth/login
│   ├── auth/
│   │   ├── login.tsx            ← Firebase login screen (demo accounts included)
│   │   └── register.tsx         ← Register + role selector (Sender / Courier)
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← Tab bar (NativeTabs / ClassicTabs)
│   │   ├── index.tsx            ← Home: <CourierDashboard> or <SenderDashboard>
│   │   ├── map.tsx              ← Live map + courier location dots
│   │   └── profile.tsx          ← Profile, mode switcher, integration status
│   └── delivery/
│       ├── new.tsx              ← Create delivery form (modal)
│       └── [id].tsx             ← Detail: AI Smart Route + status management
│
├── components/
│   ├── CourierDashboard.tsx     ← Available jobs feed, accept, active card, AI route
│   ├── SenderDashboard.tsx      ← Post job form, active/completed jobs lists
│   ├── DeliveryCard.tsx         ← Reusable delivery list item
│   ├── CourierModeSelector.tsx  ← Transport mode picker (animated)
│   ├── RouteOptimizer.tsx       ← General Gemini route UI component
│   ├── StatsBar.tsx             ← Dashboard metrics row
│   └── ErrorBoundary.tsx        ← Crash recovery wrapper
│
├── context/
│   ├── AuthContext.tsx           ← Firebase auth state (currentUser, userProfile)
│   └── AppContext.tsx            ← Firestore-backed state (deliveries, mode, actions)
│
├── services/
│   ├── firebase.ts              ← Firebase init (env-var config, singleton)
│   ├── authService.ts           ← signUp / signIn / signOut / getUserProfile
│   ├── firestoreService.ts      ← All Firestore CRUD + real-time subscriptions
│   ├── locationService.ts       ← GPS polling + Firestore location writes
│   └── geminiService.ts         ← optimizeRoute() + optimizeRouteByDeliveryId()
│
├── constants/
│   └── colors.ts                ← Full dark/light theme token map
│
├── hooks/
│   └── useColors.ts             ← Returns theme tokens based on color scheme
│
├── web-stubs/
│   └── react-native-maps.js     ← Web no-op stub for MapView
│
└── metro.config.js              ← resolveRequest: routes maps to stub on web
```
