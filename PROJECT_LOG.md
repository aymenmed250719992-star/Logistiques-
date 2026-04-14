# Hyper-Local AI Logistics — Project Log

## Project Overview
A hyper-local delivery platform connecting senders with micro-couriers in the US market.
Built with Expo (React Native) for cross-platform mobile + web, using Clean Architecture with:
- **Firebase Auth + Firestore** as the real-time backend
- **Gemini 1.5 Flash** AI for Smart Route Strategy
- **Role-based dashboards** (Sender vs Courier)
- React Context as the state bridge

---

## [X] Done — Implemented

### Core App Structure (Expo / React Native)
- [X] Project scaffolded with Expo Router (file-based routing)
- [X] Inter font family (400/500/600/700) with SplashScreen gating
- [X] Dark/light theme via `constants/colors.ts` (navy + electric blue)
- [X] `useColors()` hook for semantic design tokens
- [X] `GestureHandlerRootView`, `SafeAreaProvider`, `KeyboardProvider` wired
- [X] `ErrorBoundary` with crash recovery

### Navigation
- [X] **Home Tab** — Role-based dashboard (Sender / Courier)
- [X] **Map Tab** — Live map with courier location dots + route polylines
- [X] **Profile Tab** — Profile card, transport mode switcher, integration status
- [X] **Delivery Detail** (`/delivery/[id]`) — Full info, status management, AI Smart Route
- [X] **Auth Stack** (`/auth/login`, `/auth/register`) — Firebase-backed login/register

### Firebase & AI Integration
- [X] Firebase SDK (`firebase` package) installed and initialized via env vars
- [X] Firebase config stored in Replit Secrets (EXPO_PUBLIC_FIREBASE_*)
- [X] `services/firebase.ts` — singleton app + auth + db exports
- [X] `services/authService.ts` — signUp, signIn, signOut, getUserProfile
- [X] `services/firestoreService.ts` — createDelivery, updateDeliveryStatus, real-time subscriptions
- [X] `services/locationService.ts` — expo-location / web geolocation + Firestore location writes
- [X] `services/geminiService.ts` — `optimizeRoute()` + `optimizeRouteByDeliveryId(deliveryId)`
- [X] `context/AuthContext.tsx` — Firebase onAuthStateChanged, currentUser, userProfile
- [X] `context/AppContext.tsx` — Firestore-backed deliveries with role-based onSnapshot listeners

### Authentication (Firebase Auth)
- [X] Login screen with email/password + demo account quick-fill
- [X] Register screen with role picker (Sender / Courier)
- [X] Auto-redirect: unauthenticated → `/auth/login`, authenticated → `/(tabs)`
- [X] Sign Out wired to Firebase signOut in Profile tab

### Firestore Schema
- [X] **`/users/{uid}`** — firebaseUid, role, displayName, email, courierMode, rating, earnings, isVerified
- [X] **`/deliveries/{id}`** — senderId, courierId, senderName, recipientName, pickup{address,lat,lng}, dropoff{address,lat,lng}, status[pending|in_transit|delivered|cancelled], transportMode, packageSize, distance, earnings
- [X] **`/locations/{courierId}`** — courierId, latitude, longitude, timestamp, transportMode

### Role-Based Dashboards
- [X] **Sender Dashboard** — Post new delivery jobs (inline form), view active/completed jobs, track status
- [X] **Courier Dashboard** — Available jobs feed (all pending deliveries), accept jobs, active delivery card, history
- [X] Mode switcher for couriers — synced to Firestore `/users` doc

### AI — Gemini 1.5 Flash
- [X] `optimizeRoute(request)` — general route optimization with pickup/dropoff/mode/location inputs
- [X] `optimizeRouteByDeliveryId(deliveryId)` — fetches delivery from Firestore, gets courier GPS, sends to Gemini
- [X] Smart Route Strategy: mode-specific actionable sentences (e.g. "Since you are on a Bicycle, take the Valencia Street bike lane…")
- [X] Graceful fallback to mock strategies when no API key configured
- [X] Used in: Delivery Detail screen (on-demand), CourierDashboard active job card

### Real-Time Map
- [X] `subscribeToAllCourierLocations()` feeds live courier dots on the map
- [X] Couriers write GPS to Firestore every 15 seconds when on an active delivery
- [X] Map shows live courier count badge ("3 live")
- [X] Web preview shows location data in text form; native uses MapView markers

### Transport Mode Switcher
- [X] Four modes: Walking, Bicycle, E-Scooter, Car
- [X] Updates AsyncStorage + Firestore `/users` doc atomically
- [X] Used in CourierDashboard, Profile Tab, CourierModeSelector component

---

## [ ] To-Do — Next Steps

### How to Test a Sample Delivery
1. **Register two accounts** — one as Sender, one as Courier
2. **Login as Sender** → Home tab → tap "Post New Delivery Job"
   - Enter pickup address, dropoff address, recipient name, package size
   - Tap "Post Job" → it appears in Firestore `/deliveries` with status `pending`
3. **Login as Courier** → Home tab → see the new job in "Available Jobs" feed
   - Tap "Accept Job" → status moves to `in_transit`, courier ID is written
   - Location tracking starts automatically every 15 seconds
4. **On Delivery Detail** → tap "Get Smart Route Strategy" to invoke Gemini AI
5. **Tap "Mark Delivered"** → status moves to `delivered`
6. **Sender side** — refresh to see the job marked Delivered
7. **Map Tab** — see the courier's live location dot in real-time (native) or coordinates list (web)

### Firestore Rules (set before production)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} { allow read, write: if request.auth.uid == uid; }
    match /deliveries/{id} { allow read, write: if request.auth != null; }
    match /locations/{courierId} { allow read, write: if request.auth != null; }
  }
}
```

---

## [!] Guide — Adding "Points & Rewards" System

### Concept
Couriers earn points per delivery; points unlock tier badges and bonus multipliers.

### Firestore Schema additions
```
/users/{uid}
  points: number          ← cumulative lifetime points
  tier: "bronze"|"silver"|"gold"|"platinum"
  weeklyDeliveries: number
  weeklyEarnings: number

/rewards/{uid}/history/{docId}
  deliveryId: string
  pointsEarned: number
  reason: string          ← "delivery_completed", "fast_delivery", "5_star_rating"
  createdAt: Timestamp
```

### Points formula (suggested)
| Event | Points |
|---|---|
| Delivery completed | 10 pts |
| Completed in <ETA | +5 pts bonus |
| 5-star rating received | +8 pts |
| Streak (3+ deliveries/day) | +15 pts |

### Tier thresholds
| Tier | Points |
|---|---|
| Bronze | 0–499 |
| Silver | 500–1999 |
| Gold | 2000–4999 |
| Platinum | 5000+ |

### Implementation steps
1. Add `points`, `tier`, `weeklyDeliveries` to `/users` schema
2. Create `services/rewardsService.ts` with `awardPoints(courierId, deliveryId, reason)` — writes to `/rewards` and updates user doc atomically using Firestore `runTransaction`
3. Call `awardPoints(...)` inside `updateDeliveryStatus()` when status → `delivered`
4. Add `RewardsBanner` component to `CourierDashboard` showing tier badge, point total, and progress bar
5. Optional: weekly leaderboard via a Cloud Function that aggregates `/locations` writes
6. Optional: Gemini-powered "tip of the day" based on courier performance data

---

## Architecture

```
app/
├── _layout.tsx              ← Root: AuthProvider + AppProvider + Gesture/Keyboard
├── index.tsx                ← Auth redirect gate
├── auth/
│   ├── login.tsx            ← Firebase email/password login
│   └── register.tsx         ← Register with role selection (Sender/Courier)
├── (tabs)/
│   ├── _layout.tsx          ← Tab navigator
│   ├── index.tsx            ← Role-based dashboard (SenderDashboard / CourierDashboard)
│   ├── map.tsx              ← Live map + courier location dots
│   └── profile.tsx          ← Profile, mode switcher, Firebase/Gemini status
└── delivery/
    ├── new.tsx              ← Create delivery form (modal)
    └── [id].tsx             ← Delivery detail + AI Smart Route + status management

context/
├── AuthContext.tsx           ← Firebase auth state + userProfile
└── AppContext.tsx            ← Firestore-backed deliveries, role-aware subscriptions

services/
├── firebase.ts              ← Firebase app init (env-var config)
├── authService.ts           ← signUp / signIn / signOut / getUserProfile
├── firestoreService.ts      ← Delivery CRUD, real-time listeners, location writes
├── locationService.ts       ← GPS (expo-location / web geolocation) + Firestore sync
└── geminiService.ts         ← optimizeRoute() + optimizeRouteByDeliveryId()

components/
├── SenderDashboard.tsx      ← Job posting form + active/completed jobs list
├── CourierDashboard.tsx     ← Available jobs feed + active job card + history
├── DeliveryCard.tsx         ← Delivery list item (status, mode, earnings)
├── CourierModeSelector.tsx  ← Transport mode picker (animated)
├── RouteOptimizer.tsx       ← Gemini AI route suggestions UI
└── StatsBar.tsx             ← Dashboard metrics row
```
