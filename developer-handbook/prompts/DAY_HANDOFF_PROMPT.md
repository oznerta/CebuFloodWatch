# Daily Handoff Prompt

Copy and paste this prompt when wrapping up a session or handing off work to another developer/assistant:

```text
Please summarize today's work for handoff:
1. What was completed and verified (with test evidence).
2. Files modified or created.
3. In-flight work or open items requiring follow-up.
4. Next recommended steps for the resuming session.

Project Context & Memory Update:
- Update active task checklists and roadmap progress in .omnigate/PROJECT-CONTEXT.md.
- If database models or API structures changed, update the Mermaid diagrams in .omnigate/PROJECT-CONTEXT.md.
- If architectural decisions or tricky gotchas were discovered today, record them under Living Memory in .omnigate/PROJECT-CONTEXT.md.
```
