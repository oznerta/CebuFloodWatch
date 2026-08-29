# API & Interface Specification — CebuFloodWatch

## 1. REST Endpoints

Base URL: `/api/v1`

### 1.1 Health & Diagnostics
- `GET /health` — Check database, PostGIS, and FCM connectivity.

### 1.2 Crowdsourced Citizen Reports (`/reports`)
- `GET /reports` — Fetch flood incident reports (filtered by `barangay_id`, `status`, `since`).
- `POST /reports` — Submit a citizen flood report with GPS coordinates and optional photo.
- `PATCH /reports/:id/status` — Update report status (`verified`, `rejected`, `resolved`) — *Requires `barangay_focal` or `admin`*.

### 1.3 Evacuation Centers (`/shelters`)
- `GET /shelters` — Fetch evacuation centers list with live occupancy and status.
- `GET /shelters/nearby?lat={lat}&lon={lon}` — Find nearest open shelters.
- `POST /shelters` — Create a new shelter — *Requires `admin`*.
- `PATCH /shelters/:id/occupancy` — Update occupancy / status — *Requires `first_responder`, `barangay_focal`, or `admin`*.

### 1.4 Dynamic Road Network (`/roads`)
- `GET /roads` — List road segments and blocked status.
- `PATCH /roads/:id/block` — Toggle road blockage / passability flag — *Requires `barangay_focal` or `admin`*.

### 1.5 Emergency Alerts & AI Drafter (`/alerts`)
- `GET /alerts/active` — Fetch all published alerts.
- `POST /alerts/draft` — AI-assisted bilingual (EN/TL) alert drafting via Gemini 2.5 Flash — *Requires `barangay_focal` or `admin`*.
- `POST /alerts/:id/publish` — Publish approved alert and trigger FCM push notification — *Requires `admin`*.

---

## 2. WebSocket Events (Socket.IO)

Clients connect to `wss://<API_HOST>/socket.io/` with auth token.

### Server-to-Client Broadcasts
- `report:new` — Broadcasts when a new citizen report is submitted.
- `road:status_change` — Broadcasts when a road segment is blocked or opened.
- `shelter:occupancy_update` — Broadcasts when evacuation center occupancy changes.
- `alert:published` — Broadcasts high-priority emergency alerts to command dashboards.

---

## 3. Standard Response & Error Contracts

```json
// Success Response
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "2026-08-29T15:00:00.000Z" }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "User does not have jurisdiction over Barangay Mabolo.",
    "details": {}
  }
}
```
