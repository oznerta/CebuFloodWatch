# Project Intake & Context Generation Prompt

Copy and paste this prompt when initializing a new project with specifications or raw documentation:

```text
Please inspect all specification files or raw project notes. Based on these documents, populate and update .omnigate/PROJECT-CONTEXT.md:

1. Update Section 1 (Basic Project Identity & Commands) with the project name, description, repository URL, and tech stack.
2. Update Section 2 (Phased Implementation Roadmap) with phased milestones, a Mermaid Gantt chart, and task checklists.
3. Update Section 3 (System Architecture Diagram) with a Mermaid graph TD component diagram.
4. Update Section 4 (Database Schema & Entity Relationships) with a Mermaid erDiagram.
5. Update Section 5 (Living Memory) with initial architectural decision records (ADRs).

Confirm once .omnigate/PROJECT-CONTEXT.md is fully populated and ready!
```
