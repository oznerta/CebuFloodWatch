# Project Context — CebuFloodWatch (StormGate)

Durable, non-secret project facts. AI agents read this before making changes. Leave unknown fields as `<ASK_DEVELOPER>`; never guess.

Never store secrets here. Use placeholders such as `<HOSTING_RESOURCE>`, `<DATABASE_NAME>`, `<DATABASE_USER>`, and `<MCP_ALIAS>`.

---

## 1. Required Intake Status

- **Solution Cluster**: Disaster Risk Reduction & Emergency Management (DRRM)
- **Module**: Flood Warning, Evacuation Management, Citizen Crowdsourcing & Disaster Operations
- **Business purpose**: Provide a dual-platform (mobile + web) disaster response and monitoring system for Metro Cebu during flood events—empowering citizens with localized bilingual alerts, offline shelter directories, and crowdsourced reporting, while equipping City DRRMO admins and Barangay focal persons with real-time geospatial dashboards, AI-assisted alert generation, road closure controls, and shelter occupancy management.
- **Primary users**:
  - **General Public / Citizens**: Cebu City households, commuters, and evacuees accessing localized flood warnings, offline evacuation routes, hazard maps, and reporting flood depths.
  - **City DRRMO Admins**: Central Disaster Risk Reduction & Management Office operators overseeing city-wide flood maps, publishing emergency alerts, managing road passability, and monitoring evacuation facilities.
  - **Barangay Focal Persons**: Local barangay officials monitoring localized incidents, updating shelter status, and flagging local road blockages.
  - **First Responders**: Search and rescue units receiving real-time spatial incidents, navigation corridors, and field shelter updates.
- **Application type**: Dual-Platform System (Mobile App: React Native Expo; Web Dashboard: Next.js 14 App Router; Backend: Node.js Express REST API + WebSockets; Database: PostgreSQL 15 + PostGIS 3.4).

---

## 2. Tech Stack & Dependencies

- **Backend stack and version**: Node.js 20+ LTS / Express 4.x / TypeScript 5.x / Socket.IO 4.x
- **Frontend stack and version**:
  - **Web Dashboard**: Next.js 14 (App Router) / React 18 / TypeScript 5.x / MapLibre GL JS / TailwindCSS
  - **Mobile Application**: React Native (Expo SDK 51) / TypeScript 5.x / MapLibre React Native / `expo-sqlite` / `@react-native-firebase/messaging`
- **Database engine and version**: PostgreSQL 15 with PostGIS 3.4 extension (Hosted on Supabase / Railway)
- **Package manager / runtime versions**: `npm` / Node.js `v20.x` LTS
- **Authentication model**: Signed HMAC-SHA256 JWT tokens & Firebase Authentication with strict RBAC (`admin`, `barangay_focal`, `first_responder`, `citizen`)
- **Data sensitivity / PII**: Medium (User phone numbers, real-time GPS locations, emergency contact directories, and citizen flood report photos)

### Validation Commands

- **Backend API**:
  - Type Check: `npx tsc --noEmit --project apps/api/tsconfig.json`
  - Local Dev: `npm run dev:api`
- **Web Dashboard**:
  - Type Check: `npx tsc --noEmit --project apps/web/tsconfig.json`
  - Local Dev: `npm run dev:web`
- **Mobile Application**:
  - Type Check: `npx tsc --noEmit --project apps/mobile/tsconfig.json`
  - Local Dev: `npx expo start --prefix apps/mobile`

### Stack & Library Decisions

- **Framework choice rationale**:
  - **React Native (Expo SDK 51)**: Enables cross-platform mobile deployment for iOS/Android, offline storage through `expo-sqlite`, camera uploads, and rapid prototyping via Expo Go.
  - **Next.js 14 (App Router)**: Provides optimal server-side rendering and high-density GIS monitoring with MapLibre GL JS and 3D extruded building geometries.
  - **Node.js + Express + Socket.IO**: Ensures event-driven bidirectional communication between citizen report submissions and DRRMO operational dispatchers.
  - **PostgreSQL 15 + PostGIS 3.4**: Native spatial geometry types (`POINT`, `LINESTRING`, `MULTIPOLYGON`) and spatial indexing (`GIST`) enabling lightning-fast `ST_DWithin` spatial proximity queries and `<->` KNN nearest shelter searches.
  - **Google Gemini 2.5 Flash / Pro**: High throughput inference for real-time bilingual English/Cebuano alert drafting and AI vision photo triage.
  - **Cloudinary**: Dedicated cloud media store for citizen flood verification photos with automatic optimization.
- **Approved libraries**:
  - Mapping: `maplibre-gl` (web), `openmaptiles` vector building source, `@turf/turf` (geospatial operations)
  - Data & DB: `pg`, `expo-sqlite` (mobile offline cache)
  - AI: `@google/genai` (Google Gen AI SDK for Gemini 2.5 Flash / Pro)
  - Media: `cloudinary`
  - UI & Utilities: `lucide-react` / `lucide-react-native`, `zod`, `date-fns`
- **Security & Secret Integrity**:
  - Zero hardcoded fallback strings for sensitive secrets (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_INITIAL_PASSWORD`).
  - Strict fail-fast validator throwing immediate runtime exceptions if required environment variables are absent.
  - All local secrets restricted strictly to gitignored `.env` files.

---

## 3. Core System Data & Assets Inventory

All geospatial datasets are 100% sourced directly from official government shapefiles and models in `D:\Matt\UC-B\4TH YEAR - CAPSTONE 1\maps assets`:

| Dataset | File Source on Disk | Origin Agency | Record Count |
| :--- | :--- | :--- | :--- |
| **Flood Inundation (100-Yr)** | `\New folder\ph072217000_fh100yr_10m.shp` | **DOST-UP NOAH** (`ph072217000` = Cebu City) | Multi-polygon return model |
| **Evacuation Shelters** | `\phl_schp_deped\phl_schp_deped.shp` | **Department of Education (DepEd)** & CDRRMO | **27 Public Schools** |
| **80 Barangay Boundaries** | `\phl_admin_boundaries.geojson\phl_admin4.geojson`| **PSA / UN OCHA (HDX)** | **80 Administrative Barangays** |
| **Roads & Waterways** | `\ROAD NETWORK\philippines-260829-free.shp` | **OpenStreetMap / Geofabrik** | Full metro street network |
| **River Basin Gauges** | Monitored LGU Catchments | **DOST-PAGASA & CDRRMO** | **5 River Basins + Port Tide** |

---

## 4. Operational Modules & Capabilities

### 4.1 Situation Room & 3D Command Map (`apps/web/src/app/dashboard`)
- **3D Building Extrusions**: MapLibre GL JS `fill-extrusion` rendering dynamic building heights with natural shadows.
- **$45^\circ$ Axonometric Tactical Pitch**: Pitched perspective showcasing street-level flood depths around building foundations.
- **UP NOAH Inundation Layer**: Official 100-Year Flood Return simulation positioned beneath buildings so water flows across the road grid.
- **Google Clean Basemap**: Automated `apistyle` POI stripping removing commercial pins (resorts, hotels, malls) to prioritize disaster markers.
- **5 River Basin Telemetry Gauges**: Live water levels for Guadalupe, Mahiga, Lahug/Kamputhaw, Kinalumsan, and Bulacao rivers + Cebu Port tidal gauge.

### 4.2 Evacuation Centers & Shelters Registry (`apps/web/src/app/evacuation`)
- **27 Official DepEd Public Schools**: Seeded with real classroom counts and realistic capacities (400 to 3,500 evacuees).
- **PostGIS Spatial KNN Routing**: `<->` distance operator instantly finds the closest open shelter with available capacity.
- **Direct Headcount Management**: Inline editable occupancy numbers + `+1`, `−1`, `+10`, and `+Custom` increment steppers.

### 4.3 Citizen Incident Triage & Vision Verification (`apps/web/src/app/reports`)
- **Live Incident Stream**: Crowdsourced flood submissions with GPS coordinates, flood depth, and timestamp.
- **AI Vision Triage**: Gemini Vision analyzes uploaded flood photos to verify water levels and flag false reports.
- **Approval & Verification Queue**: One-click status updates (`verified`, `rejected`, `resolved`) updating public map layers in real time.

### 4.4 Emergency Bilingual Broadcasts (`apps/web/src/app/alerts`)
- **AI Bilingual Drafting**: Gemini 2.5 Flash / Pro drafts instant emergency advisories in **English** and **Cebuano (Bisaya)**.
- **One-Tap Presets**: Instant generation for Flash Floods, Dam Spillways, Tidal Storm Surges, and Mountain Landslides.
- **Simulated Multi-Channel Broadcast**: Broadcasts approved warnings to responder dashboards, SMS gateways, and citizen push notifications.

### 4.5 Dynamic System Settings & Gateway Management (`apps/web/src/app/admin`)
- **PostgreSQL Persistence**: Dynamic AI model selection (Gemini, Claude, GPT-4o, DeepSeek) and IoT gateway toggles stored in `public.system_settings`.

---

## 5. Mobile Citizen Application (`apps/mobile`)

- **Live Map Screen**: Real-time river gauges, tide readings, and UP NOAH flood return overlays.
- **Offline Report Submission**: Citizen reports queued in local **SQLite** cache when mobile networks are offline; auto-synced upon reconnect.
- **Safe Evacuation Navigator**: Turn-by-turn routing to nearest open DepEd evacuation center avoiding submerged roads.
- **Safety Network**: One-tap *"I am Safe"* / *"Needs Assistance"* SOS broadcast to family emergency contacts.

---

## 6. Living Memory & Architecture Gotchas

- **[Gotcha] 3D Vector Layer Ordering**: In MapLibre GL JS, vector flood inundation layers must be added *before* `'3d-buildings'` layer so water renders on the terrain ground below building structures.
- **[Gotcha] Google Clean Raster Styling**: To strip commercial POIs without breaking disaster markers, append `&apistyle=s.t:49|p.v:off|s.t:6|p.v:off|s.t:3|p.v:off|s.t:1|p.v:off` to Google tile URLs.
- **[Gotcha] Fail-Fast Secrets**: Never provide hardcoded fallback strings for sensitive config (e.g. `JWT_SECRET` or `DATABASE_URL`). Always require them from `.env` or throw immediately during startup.
