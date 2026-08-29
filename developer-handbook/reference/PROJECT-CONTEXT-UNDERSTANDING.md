# PROJECT-CONTEXT Field Definitions & Intake Guide

This handbook reference explains every field, section, and schema requirement in `.omnigate/PROJECT-CONTEXT.md`. AI agents read `PROJECT-CONTEXT.md` as the single source of truth for project identity, architecture, roadmap, and governance.

---

## Field Dictionary & Guidance

### 1. Required Intake Status
- **Solution Cluster**: The overarching business domain (e.g., `Agentic CRM`, `Fintech Gateway`, `HealthTech EMR`).
- **Module**: The specific functional module within the cluster (e.g., `Leads Generator (LGN)`, `Payment Gateway`, `Patient Portal`).
- **Business Purpose**: High-level problem statement and value proposition of the software.
- **Primary Users**: End-user personas operating the system (e.g., `Sales Representatives`, `System Administrators`).
- **Application Type**: Architectural classification (`Single Page Application (SPA)`, `Server-Rendered Monolith`, `CLI Tool`, `Agentic Workflow`).

### 2. Tech Stack & Dependencies
- **Backend Stack & Version**: Language, runtime, and framework floors (e.g., `PHP 8.4 / Laravel 13`, `Node 22 LTS / Express`).
- **Frontend Stack & Version**: Client library and language (e.g., `React 19 / TypeScript 5.7`, `Vue 3`).
- **Database Engine & Version**: Database engine, deployment model, and ORM pattern (e.g., `Azure SQL Database`, `PostgreSQL 16`).
- **Validation Commands**: Exact shell commands to format, lint, test, and build the project (`vendor/bin/pint`, `npm run lint`, `php artisan test`, `npm run build`).

### 3. Current Sprint Tasks
- Structured breakdown of active sprint work items:
  - Feature name & description
  - Validation commands to execute before marking complete
  - Success criteria defining completion

### 4. Scope & Non-Goals
- Explicit enumeration of features **out of scope** for the current phase to prevent scope creep by AI agents or developers.

### 5. System Boundaries
- **What the system does vs. what it does NOT do**.
- External integration seams (e.g., `Apollo API`, `Stripe Payments`).
- Allowed dependency direction (e.g., `Frontend (SPA) → Backend (API)` over HTTP only; zero cross-imports).

### 6. System Architecture & ERD Diagrams
- Mermaid diagrams rendering system components, data flows, and database entity-relationship tables.

### 7. UI Application Definition & Navigation Tree
- **App Identity**: Name, title bar format, tagline, brand asset paths.
- **Navigation Tree**: Config-driven sidebar tree using standardized formatting:
  `Name [type] \`IconName\` → /route — Description`
  - Types: `[leaf]`, `[accordion]`, `[action leaf]`.
- **Entities Table**: Complete listing of managed domain entities, database tables, screens, ownership, and state machines.

### 8. Roles, Tenancy & Security
- **Roles Matrix**: System roles, tiers, and record-level scopes (`admin`, `team`, `self`, `read-only`).
- **Authentication Model**: SSO integration, token handoff pattern, lifetime, and key vault secrets.

### 9. Deployment & Operations
- CI/CD workflow targets, environment URLs (DEV/QA/STAG/PROD), and production release restrictions.
