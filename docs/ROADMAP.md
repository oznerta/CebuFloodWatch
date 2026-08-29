# 10-Week Implementation Roadmap — CebuFloodWatch

## 1. Overview & Phasing

A 10-week capstone delivery plan broken down into 2-week agile sprints.

```mermaid
gantt
    title CebuFloodWatch Capstone Roadmap
    dateFormat YYYY-MM-DD
    section Sprint 1: Setup & DB
    Scaffolding & CI/CD          :done, s1_1, 2026-09-01, 7d
    PostGIS Schema & Migrations  :active, s1_2, 2026-09-04, 7d
    Firebase Auth & RBAC Guard   :active, s1_3, 2026-09-07, 7d

    section Sprint 2: Maps & Reports
    MapLibre & UP NOAH Layers    :s2_1, 2026-09-15, 7d
    Citizen Reporting [MOB-4]    :s2_2, 2026-09-18, 7d
    Live Web Dashboard [WEB-1]   :s2_3, 2026-09-22, 7d

    section Sprint 3: Alerts & Ops
    Gemini 2.5 Flash Alert Drafter [WEB-2] :s3_1, 2026-09-29, 7d
    Shelter Ops CRUD [WEB-4]               :s3_2, 2026-10-02, 6d
    Road Closure Network [WEB-3]           :s3_3, 2026-10-06, 6d
    Safety Network [MOB-5]                 :s3_4, 2026-10-09, 5d

    section Sprint 4: Offline & AI
    Offline SQLite Shelters [MOB-3]        :s4_1, 2026-10-13, 7d
    Localized Push Broadcast [MOB-1]       :s4_2, 2026-10-16, 5d
    Extended: AI Deduplication [EXT-2]     :s4_3, 2026-10-20, 7d

    section Sprint 5: Testing & Polish
    E2E Integration & Stress Testing       :s5_1, 2026-10-27, 7d
    Capstone Demo Polish & Submission      :s5_2, 2026-11-03, 7d
```

---

## 2. Sprint Deliverables & Acceptance Criteria

### Sprint 1 (Weeks 1–2): Foundation, Auth & Spatial Database
- **Deliverables**: Monorepo scaffolding, PostgreSQL 15 + PostGIS 3.4 migrations, Express API skeleton, Firebase Auth token verification, RBAC middleware.
- **Acceptance Criteria**: Database migration scripts run cleanly; valid JWTs pass authentication; invalid role claims return HTTP 403.

### Sprint 2 (Weeks 3–4): Core Geospatial Engine & Citizen Reporting
- **Deliverables**: MapLibre GL integration on Web and Mobile; UP NOAH GeoJSON hazard overlays; `[MOB-4]` Citizen Reporting; `[WEB-1]` Central Monitoring Dashboard.
- **Acceptance Criteria**: Citizen report submitted in < 3 taps appears on admin dashboard map in < 15 seconds.

### Sprint 3 (Weeks 5–6): AI Alert Drafting, Operations & Safety Network
- **Deliverables**: `[WEB-2]` Gemini 2.5 Flash bilingual alert drafter; FCM push dispatch; `[WEB-4]` Evacuation Center operations; `[WEB-3]` Dynamic road closure manager; `[MOB-5]` Safety network.
- **Acceptance Criteria**: Admin creates structured EN+TL alert draft from raw text in < 5 seconds; push alert arrives at target barangay mobile devices within 30 seconds of approval.

### Sprint 4 (Weeks 7–8): Offline Resilience Mode & Extended Features
- **Deliverables**: `[MOB-3]` Offline SQLite shelter directory and 3 safe corridors; `[MOB-1]` localized push optimization; `[EXT-2]` AI semantic report deduplication.
- **Acceptance Criteria**: When in Airplane Mode, mobile app renders shelter directory and at least 1 safe evacuation corridor.

### Sprint 5 (Weeks 9–10): Integration Testing, Simulation & Final Submission
- **Deliverables**: End-to-end integration testing, 20 concurrent report simulation, peer review, documentation packaging.
- **Acceptance Criteria**: Zero critical test failures; complete capstone presentation package.
