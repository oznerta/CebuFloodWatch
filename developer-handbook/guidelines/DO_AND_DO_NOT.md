# Developer & AI Do and Do-Not Guidelines

| Category | DO | DO NOT |
| --- | --- | --- |
| **Secrets & Safety** | Use placeholders (`<TOKEN>`, `<DATABASE_NAME>`) in docs, chat, and code. | Commit or log real secrets, keys, JWTs, or production PII. |
| **Git & PR Review** | Suggest Conventional Commit messages, summarize diffs, and provide pre-formatted PR links/descriptions for developer review. | Execute `git commit`, `git push`, `git merge`, or auto-merge PRs without presenting proposed titles/messages and obtaining developer review. |
| **Database & Schema** | Inspect existing schema files, ORM models, and migration history before writing data-backed code. | Execute raw DDL or invent table/column names without verification. |
| **Deployments** | Obtain explicit developer confirmation before production deploys or migrations. | Run live deployments or migrations automatically. |
| **UI Development** | Re-use approved design tokens, fonts, and component specifications per `.omnigate/rules/ui-ux-quality.md`. | Re-invent color palettes, ad-hoc inline styling, or unapproved menu structures. |
| **Verification** | Execute validation commands and provide concrete output evidence. | Claim work is complete or bug-free without running tests or verification. |
