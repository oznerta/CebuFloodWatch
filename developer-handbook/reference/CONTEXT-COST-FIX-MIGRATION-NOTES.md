# Context Cost Fix & Migration Architectural Notes

## Background & Problem Statement
Monolithic system prompts that include all system guidelines, database rules, UI token specs, and security policies on every single request consume 15,000–30,000 tokens per turn. For team workflows across dozens of daily developer sessions, this results in significant token waste and degraded reasoning due to context saturation.

---

## OmniGate Architecture Fix

### 1. Zero-Dependency Task Gating
OmniGate shifts from monolithic prompt injection to **On-Demand Task-Gated Rules**.
The core entry file `OMNIGATE.md` consumes < 500 tokens. Detailed rules residing in `.omnigate/rules/` are loaded dynamically only when active development triggers their specific domain gate:

```text
[User Task]
    │
    ├── CODE    ──> .omnigate/rules/production-readiness.md
    ├── DB      ──> .omnigate/rules/database-and-data.md
    ├── UI      ──> .omnigate/skills/ui-ux-design/SKILL.md + ui-ux-quality.md
    ├── API     ──> .omnigate/rules/api-and-services.md
    └── SECURITY──> .omnigate/rules/secret-handling.md + hard-stops.md
```

### 2. Token Reduction Impact
- **Baseline Monolithic Context**: ~25,000 tokens / prompt
- **OmniGate Gated Context**: ~1,200 tokens / prompt
- **Token Reduction Efficiency**: **> 95% reduction** in context overhead per turn.

### 3. Migration Instructions for Existing Projects
1. Run the OmniGate installer: `irm https://raw.githubusercontent.com/oznerta/universal-ai-gateway-kit/main/install.ps1?v=1 | iex`
2. Populate project specifics in `.omnigate/PROJECT-CONTEXT.md`.
3. Ensure `.gitignore` includes OmniGate secret protection directives.
