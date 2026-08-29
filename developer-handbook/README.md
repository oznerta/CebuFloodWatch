# Universal AI Developer Handbook

Human-facing guides for developers using the Universal AI Agent Gateway Kit across any AI assistant (Claude Code, Cursor, Windsurf, Antigravity, GitHub Copilot, Codex, Aider, Continue.dev, etc.). The gateway configuration lives in `.omnigate/`; these files explain how to work with it effectively.

## Getting Started

- [getting-started/HOW_TO_USE.md](getting-started/HOW_TO_USE.md) — How to deploy and use the kit: install scripts, gateway setup, rules overview, and intake checklists.
- [getting-started/WORKING_WITH_AI.md](getting-started/WORKING_WITH_AI.md) — The team mindset and best practices for AI pair programming.

## Prompts

- [prompts/PROJECT_INTAKE_PROMPT.md](prompts/PROJECT_INTAKE_PROMPT.md) — Intake prompt to generate project timelines, Mermaid diagrams, and feature specs from documents in `.omnigate/docs/`.
- [prompts/DAY_START_PROMPT.md](prompts/DAY_START_PROMPT.md) — Daily session start primer: set model tier, confirm sprint items, and enforce lazy context loading.
- [prompts/DAY_HANDOFF_PROMPT.md](prompts/DAY_HANDOFF_PROMPT.md) — Session handoff prompts (mid-session, end-of-day, and developer-to-developer), each paired with its resume prompt.
- [prompts/GIT_PROMPTS.md](prompts/GIT_PROMPTS.md) — Copy-ready prompts for Git and GitHub workflows: sync, branch, Pull Request, promotion, and release.

## Guidelines

- [guidelines/DO_AND_DO_NOT.md](guidelines/DO_AND_DO_NOT.md) — Behavioral mirror of the gateway rules in a quick-reference table.
- [guidelines/APPROVED_PLUGINS.md](guidelines/APPROVED_PLUGINS.md) — Template for approved tools, IDE extensions, CLI tools, and linters.
- [guidelines/MODEL-ROUTING.md](guidelines/MODEL-ROUTING.md) — Multi-tier model routing strategy (Fast/Light vs. Standard vs. High-Reasoning) to control AI usage costs.

## Reference

- [reference/PROJECT-CONTEXT-UNDERSTANDING.md](reference/PROJECT-CONTEXT-UNDERSTANDING.md) — Intake field definitions for `.omnigate/PROJECT-CONTEXT.md`.
- [reference/CREDIT-OPTIMIZATION.md](reference/CREDIT-OPTIMIZATION.md) — Canonical guide on optimizing context windows, prompt caching, and LLM API cost across teams.
- [reference/CONTEXT-COST-FIX-MIGRATION-NOTES.md](reference/CONTEXT-COST-FIX-MIGRATION-NOTES.md) — Architectural notes on lazy context loading.
