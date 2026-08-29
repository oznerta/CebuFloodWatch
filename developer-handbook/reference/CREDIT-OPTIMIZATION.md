# Credit & Context Window Optimization Guide

This guide outlines principles for minimizing LLM token consumption and maximizing prompt performance across team members using OmniGate AI.

---

## Core Optimization Principles

### 1. Lazy / Progressive Rule Loading
Never dump all governance rules into every prompt. OmniGate uses **task-gated loading** — rules are loaded into context only when a specific gate condition is triggered (e.g., loading `.omnigate/rules/database-and-data.md` only when touching database schemas or ORMs).

### 2. Standardized Single Source of Truth
Maintain a single `.omnigate/PROJECT-CONTEXT.md` file rather than pasting project context repeatedly into chat prompts. AI models read this file on demand.

### 3. Model Routing & Tier Selection
Select the correct AI model tier for each task to minimize API costs:
- **Tier 1 (Fast / Lightweight)**: Minor edits, formatting, docstrings, unit test boilerplate.
- **Tier 2 (Standard / Balanced)**: Feature implementation, REST endpoints, UI components.
- **Tier 3 (High Reasoning)**: Multi-file refactoring, system architecture, root-cause debugging.

### 4. Direct File & Search Tool Usage
Prefer targeted tools (`view_file` with line ranges, `grep_search`) over dumping entire directory trees or large source files into prompt context.

### 5. Context Pruning & Session Discipline
For long pair-programming sessions, summarize conversation checkpoints periodically to prevent context bloat. Use `.omnigate/developer-handbook/prompts/DAY_HANDOFF_PROMPT.md` for clean session handoffs.
