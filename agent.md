# Codex CLI Agent Guidelines

These conventions apply to the whole repo unless a more specific AGENTS.md exists in a subfolder.

1) Editing & IO
- Prefer to use your built-in patch/IO mechanisms (e.g., apply_patch or atomic read/write APIs) for file operations.
- If your internal patch/IO is unavailable, fall back to MCP or VS Code file APIs.
- Avoid using shell commands for file IO.

2) Planning & Responsiveness
- For multi-step work, keep a short plan and update progress as you go.
- Share concise preambles before running tools; keep the tone clear and friendly.

3) Code Style
- Follow existing patterns. Avoid one-letter names and inline license headers.
- Prefer Prisma ORM for database access; avoid ad-hoc SQL unless strictly necessary.
- Write simple, defensive code; validate inputs at API boundaries.

4) Safety
- Don’t run destructive commands (e.g., rm -rf, resets) unless explicitly requested.
- No network installs unless required and agreed.

5) Validation
- Run linters/tests if they exist, but do not “fix” unrelated issues.
- Update or add minimal docs when behavior changes.

6) Git Hygiene
- Group related changes in a single commit with a clear message.
- Avoid committing generated artifacts.
- Commit locally and do NOT push to any remote unless you have explicit permission.
  - Example local workflow:
    - git add -A
    - git commit -m "Describe the change clearly"
    - (do not run `git push`)
  - If a push is required, get explicit approval and confirm the target remote/branch before pushing.

Thanks! Keep it tidy and pragmatic.

