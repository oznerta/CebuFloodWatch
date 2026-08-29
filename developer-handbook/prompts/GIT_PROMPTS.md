# Git & PR Review Workflow Prompts

## 1. Prepare Commit Prompt
```text
Please inspect git status and git diff. Propose a Conventional Commit message and diff summary for my review before committing per .omnigate/rules/git-and-workflow.md.
```

## 2. Prepare Pull Request Prompt
```text
Please construct a complete Pull Request package for my branch against DEV per .omnigate/rules/git-and-workflow.md. Include the suggested PR title, structured body (summary, context, validation evidence), and direct GitHub PR compare link.
```

## 3. Create Feature Branch Prompt
```text
Please check out a new feature branch from DEV following .omnigate/rules/git-and-workflow.md. Name pattern: feature/<feature-name>.
```

## 4. Production Release Tag Prompt
```text
Please propose a production release tag following calendar versioning (vYYYY.R.P) from PROD for my review.
```
