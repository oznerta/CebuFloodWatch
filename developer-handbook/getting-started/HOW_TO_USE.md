# How To Use OmniGate AI

## 1. Drop Into Any Project

Copy these 3 items into the root of any repository (Web app, REST API, Mobile app, CLI tool, Monorepo, Microservice):

```text
your-project/
├── OMNIGATE.md                    # Master Authoritative Loader (v1.0.0)
├── .omnigate/                     # OmniGate AI Configuration
│   ├── PROJECT-CONTEXT.md         # 60-Second Setup / Auto-Detection
│   ├── rules/                     # 12 Governance Rules (task-gated)
│   └── agents/                    # 6 Subagent Personas
├── AGENTS.md                      # (or your assistant's adapter file)
└── developer-handbook/            # Human Guides & Prompts (optional)
```

---

## 2. 60-Second Setup or Auto-Detection

Open `.omnigate/PROJECT-CONTEXT.md` and enter basic facts about your project:
- **Project Name & Purpose**
- **Validation Commands** (build, test, lint)
- **Active Tasks**

> **Auto-Detection Feature**: If you leave `.omnigate/PROJECT-CONTEXT.md` with default `<AUTO_DETECT>` values, your AI coding assistant will automatically inspect project manifest files (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.) to discover tech stack, linting, and build commands!

---

## 3. Daily AI Pair Programming Workflow

1. **Session Start**: Send the daily start primer prompt (`developer-handbook/prompts/DAY_START_PROMPT.md`).
2. **Coding & Verification**: The AI assistant lazily loads rules under `.omnigate/rules/` only when triggered by task gates defined in `OMNIGATE.md`.
3. **Session Handoff**: Use `developer-handbook/prompts/DAY_HANDOFF_PROMPT.md` at the end of the day or when switching developers.

---

## 4. Customization

- **Add rules**: Create new `.md` files in `.omnigate/rules/` and add a gate row to `OMNIGATE.md`.
- **Remove rules**: Delete unused rule files and their gate rows.
- **Add agents**: Create new persona files in `.omnigate/agents/` following the structured format.
- **Targeted adapter selection**: Use `adapters/<tool>/` to pick only the adapter file required for your team's assistant.
