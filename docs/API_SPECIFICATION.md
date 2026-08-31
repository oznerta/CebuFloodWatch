# API & Interface Specification — CebuFloodWatch

## 1. REST Endpoints

Base URL: `/api/v1`

### 1.1 Authentication & Session (`/auth`)
- `POST /auth/login` — Sign in as Administrator or Barangay Focal (`email`, `password`). Returns signed HMAC-SHA256 JWT session token and user profile.
- `POST /auth/register` — Citizen registration (`email`, `password`, `fullName`, `phone`, `barangayId`).
- `GET /auth/session` — Verify active Bearer JWT token and retrieve current user context.

### 1.2 System Health & Diagnostics (`/health`)
- `GET /health` — Check Supabase PostgreSQL, PostGIS spatial extension, Gemini AI status, Cloudinary storage, and API gateway connectivity.

### 1.3 Crowdsourced Citizen Reports (`/reports`)
- `GET /reports` — Fetch flood incident reports (filterable by `barangay_id`, `status`, `since`, `limit`).
- `POST /reports` — Submit a citizen flood observation with GPS coordinates (`latitude`, `longitude`), `flood_depth_level`, `description`, and optional photo URL.
- `POST /reports/triage` — Submit citizen report with AI Vision auto-verification.
- `PATCH /reports/:id/status` — Update report status (`verified`, `rejected`, `resolved`) with optional verification notes — *Requires `barangay_focal` or `admin`*.

### 1.4 Evacuation Centers & Shelters (`/shelters`)
- `GET /shelters` — Fetch all 27 designated DepEd public school evacuation centers with live occupancy, total capacity, and status (`open`, `full`, `closed`).
- `GET /shelters/nearby?lat={lat}&lon={lon}` — Find the nearest open evacuation centers using PostGIS spatial KNN (`<->`) distance ordering.
- `POST /shelters` — Provision a new evacuation center — *Requires `admin`*.
- `PATCH /shelters/:id/occupancy` — Update shelter headcount with direct value or delta increments (`current_occupancy`, `status`) — *Requires `first_responder`, `barangay_focal`, or `admin`*.

### 1.5 River Telemetry, Tides & Sensors (`/sensors`)
- `GET /sensors/telemetry` — Retrieve live stream gauge readings for the 5 major Cebu City river basins:
  - **Guadalupe River** (Guadalupe / Capitol Site)
  - **Mahiga Creek** (Mabolo / Subangdaku border)
  - **Lahug / Kamputhaw River** (Lahug / Kamputhaw)
  - **Kinalumsan River** (Mambaling / Labangon)
  - **Bulacao River** (Bulacao / Inayawan)
- `GET /sensors/tides` — Retrieve Cebu Port tidal height gauge (`tide_level_m`, `trend`, `high_tide_time`, `low_tide_time`).

### 1.6 Dynamic Road Passability (`/roads`)
- `GET /roads` — List monitored road segments, passability status, flood depth, and vehicle clearance criteria (Sedan, SUV, Heavy Truck).
- `PATCH /roads/:id/block` — Toggle road blockage / passability flag with timestamp and reason — *Requires `barangay_focal` or `admin`*.

### 1.7 Emergency Alerts & AI Drafter (`/alerts`)
- `GET /alerts` — Fetch all emergency alerts (filterable by `status`, `severity`).
- `GET /alerts/active` — Fetch currently published active public alerts.
- `POST /alerts/draft` — AI-assisted bilingual emergency advisory drafting (English + Cebuano Bisaya) via Gemini 2.5 Flash / Pro — *Requires `barangay_focal` or `admin`*.
- `POST /alerts/:id/publish` — Publish approved emergency alert and broadcast via SMS / push simulation — *Requires `admin`*.

### 1.8 Media & Photo Uploads (`/upload`)
- `POST /upload` — Upload citizen flood photos (Multipart form data or Base64 URI) directly to Cloudinary storage bucket with automatic optimization and CDN URL return.

### 1.9 Administrative Governance & Gateway Settings (`/admin`)
- `GET /admin/settings` — Fetch all dynamic system settings from PostgreSQL `public.system_settings` table.
- `POST /admin/settings` — Update global system settings (`key`, `value`) with automatic JSONB persistence — *Requires `admin`*.
- `GET /admin/gateways` — List external API gateway states (PAGASA Radar, DOST Stream Gauges, Cebu Port Tide Sensor, OCD-7 Uplink).
- `POST /admin/gateways` — Update external gateway status and polling intervals — *Requires `admin`*.
- `GET /admin/ai-models` — List available AI triage and drafting models (Gemini 2.5 Flash, Gemini 2.5 Pro, Claude 3.5 Sonnet, GPT-4o, DeepSeek-V3).
- `POST /admin/ai-models` — Set active production AI model for vision triage and alert drafting — *Requires `admin`*.

---

## 2. Standard Response & Error Contracts

```json
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-08-31T12:00:00.000Z" }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Valid authentication token is required."
  }
}
```
