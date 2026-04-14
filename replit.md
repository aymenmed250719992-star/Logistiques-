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
- **Purpose**: Connects senders with micro-couriers (Walking, Bicycle, E-Scooter, Car)

#### Key Files
- `context/AppContext.tsx` — Global state: user, deliveries, courier mode
- `services/geminiService.ts` — Gemini AI route optimization
- `services/firebase.ts` — Firebase config template (needs API keys)
- `constants/colors.ts` — Dark navy + electric blue theme, dark/light mode
- `metro.config.js` — Custom resolver to stub react-native-maps on web
- `web-stubs/react-native-maps.js` — Web stub for react-native-maps

#### Screens
- `app/(tabs)/index.tsx` — Home: stats, active delivery, delivery list
- `app/(tabs)/map.tsx` — Map: react-native-maps (native) / placeholder (web)
- `app/(tabs)/profile.tsx` — Profile: courier mode selector, settings
- `app/delivery/new.tsx` — New delivery form (modal)
- `app/delivery/[id].tsx` — Delivery detail + status management

#### Transport Modes
- Foot, Bicycle, E-Scooter, Car — selectable in profile and new delivery form

#### AI Integration
- Gemini 1.5 Flash for route optimization
- Set `EXPO_PUBLIC_GEMINI_API_KEY` to enable live AI; falls back to mock data

#### Firebase (Template)
- See `services/firebase.ts` for setup instructions
- Set env vars: `EXPO_PUBLIC_FIREBASE_*`
- Install: `pnpm --filter @workspace/hyperlocal-logistics add firebase`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/hyperlocal-logistics run dev` — run mobile app

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
See `PROJECT_LOG.md` for full implementation status, to-do list, and configuration steps.
