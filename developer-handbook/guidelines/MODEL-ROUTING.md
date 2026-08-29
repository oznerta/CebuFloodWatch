# AI Model Routing Guidelines

This document outlines team guidelines for selecting AI model tiers across coding assistants to optimize response quality and credit/token costs.

> **Note**: Model names evolve rapidly. The examples below are illustrative — use whatever current models your provider offers that match the tier characteristics.

## Model Tiers

### Tier 1: Fast / Lightweight Models

**Characteristics**: Low latency, low cost, good for routine tasks.

**Examples** (update as models evolve):
- Gemini Flash series, Claude Haiku series, GPT-4o-mini, or equivalent fast models

**When to Use**:
- Small feature edits & boilerplate generation
- Unit test writing & docstring formatting
- Syntax error fixes & linting cleanups
- Simple git commit message drafting
- Code formatting and import organization

### Tier 2: Standard / Balanced Models

**Characteristics**: Good reasoning, moderate cost, suitable as the daily default.

**Examples** (update as models evolve):
- Claude Sonnet series, GPT-4o, Gemini Pro series, or equivalent balanced models

**When to Use**:
- Routine feature development & refactoring
- API endpoint creation & UI component building
- Complex bug investigations & code reviews
- General daily pair programming (**default tier**)
- Database query writing and optimization

### Tier 3: High-Reasoning / Large Models

**Characteristics**: Deep reasoning, highest cost, reserve for complex tasks.

**Examples** (update as models evolve):
- Claude Opus series, Sonnet (Thinking mode), o1/o3 series (High reasoning), Gemini with extended thinking, or equivalent reasoning models

**When to Use**:
- High-level system architecture & design
- Database schema migration planning
- Hard root-cause debugging across multiple services
- Critical security & compliance auditing
- Complex refactoring spanning many files

## Cost Control Tips

1. **Default to Tier 1–2** for 90%+ of daily tasks.
2. **Escalate to Tier 3** only when Tier 2 struggles or the task requires deep reasoning.
3. **Reset context** between unrelated tasks to avoid sending stale context on every request.
4. **Use progressive loading** — let the gateway's task gates control what context is loaded rather than dumping everything upfront.
