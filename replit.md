# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Hyper-Local AI Logistics (Mobile App)
- **Type**: Expo (React Native / Web)
- **Path**: `artifacts/hyperlocal-logistics/`
- **Preview**: `/` (root)
- **Language**: Arabic (العربية) — default language
- **Purpose**: Connects senders with micro-couriers (Walking, Bicycle, E-Scooter, Car)

#### Roles & Users
- **Admin**: `aymenmed25071999@gmail.com` — has full access to admin dashboard
- **Sender (مرسل)**: Regular customers who post delivery requests. Auto-approved.
- **Courier (عامل توصيل)**: Delivery workers. Must be approved by admin before accessing the app.

#### Admin Panel (`/admin`)
- View all users (senders, couriers)
- Approve or reject new courier registrations
- Search users by customerId, name, or email
- Each user has a unique ID (format: USR-XXXXXX)

#### Key Files
- `context/AuthContext.tsx` — Auth state + isAdmin flag
- `context/AppContext.tsx` — Global state: user, deliveries, courier mode
- `services/authService.ts` — Auth service with admin detection, customerId generation, courier approval status
- `services/firestoreService.ts` — Firestore CRUD, real-time subscriptions, courier locations
- `services/geminiService.ts` — Gemini AI route optimization
- `services/firebase.ts` — Firebase config template (needs API keys)
- `constants/colors.ts` — Dark navy + electric blue theme, dark/light mode

#### Screens
- `app/index.tsx` — Root: redirects admin to /admin, users to /(tabs)
- `app/admin/index.tsx` — Admin dashboard: user management, courier approval
- `app/auth/login.tsx` — Login screen (Arabic)
- `app/auth/register.tsx` — Register screen (Arabic, courier gets pending message)
- `app/(tabs)/index.tsx` — Home: role-based dashboard, pending/rejected states
- `app/(tabs)/map.tsx` — Map: react-native-maps (native) / placeholder (web)
- `app/(tabs)/profile.tsx` — Profile: customerId display, approval status, settings
- `app/delivery/new.tsx` — New delivery form (modal)
- `app/delivery/[id].tsx` — Delivery detail + status management

#### Transport Modes
- Foot, Bicycle, E-Scooter, Car — selectable in profile and new delivery form

#### AI Integration
- Gemini 1.5 Flash for route optimization
- Set `EXPO_PUBLIC_GEMINI_API_KEY` to enable live AI; falls back to mock data

#### Firebase (Template)
- See `services/firebase.ts` for setup instructions
- Required env vars: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, etc.

#### User Registration Flow
1. User registers as Sender → immediate access
2. User registers as Courier → gets "pending" status, waits for admin approval
3. Admin logs in → sees pending couriers, approves or rejects
4. Approved courier → gains access to the delivery dashboard

#### Admin Detection
- Email-based: if `email === 'aymenmed25071999@gmail.com'` → role = admin
- Admin flag is also stored in Firestore user document (`role: "admin"`)
