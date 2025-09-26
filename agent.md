# Codex CLI Agent Guidelines (Simplified)

These conventions apply to the whole repo unless a more specific AGENTS.md exists in a subfolder.

1) Editing & IO
- Prefer MCP or VS Code file APIs for reading/writing files.
- If those are unavailable in the current harness, use the built‑in patch mechanism (apply_patch) to modify files atomically. Avoid shell commands for file IO.
- Keep changes minimal and focused; don’t refactor unrelated code.

2) Planning & Responsiveness
- For multi‑step work, keep a short plan and update progress as you go.
- Share concise preambles before running tools; keep the tone clear and friendly.

3) Code Style
- Follow existing patterns. Avoid one‑letter names and inline license headers.
- Prefer Prisma ORM for database access; avoid ad‑hoc SQL unless strictly necessary.
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

Thanks! Keep it tidy and pragmatic.

