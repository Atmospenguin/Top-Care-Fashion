# Codex CLI Agent Guidelines

These conventions apply to the whole repo unless a more specific AGENTS.md exists in a subfolder.

1) Editing & IO
- Prefer to use your built-in patch/IO mechanisms (e.g., apply_patch or atomic read/write APIs) for file operations.
- If your internal patch/IO is unavailable, fall back to MCP or VS Code file APIs.
- Avoid using shell commands for file IO.

2) Planning & Responsiveness
- For multi-step work, keep a short plan and update progress as you go.
- Share concise preambles before running tools; keep the tone clear and friendly.
 - For Next.js App Router dynamic routes, `context.params` may be a Promise in newer runtimes — await it inside handlers and avoid destructuring collisions with local variables.

3) Code Style
- Follow existing patterns. Avoid one-letter names and inline license headers.
- Prefer Prisma ORM for database access; avoid ad-hoc SQL unless strictly necessary.
- Write simple, defensive code; validate inputs at API boundaries.
 - Prisma tips: do not select non-existent fields (e.g., `avatar_path`); prefer `avatar_url` and guard nullable relations like `listing.seller` before accessing properties.
 - Dates & nullables: always guard `Date | null` before calling `.toISOString()`; consider returning `null` in JSON when database values are nullable.
 - Reviews: when creating `reviews` include the required `reviewer_type` and respect unique-per-order constraints enforced in the schema.

4) Safety
- Don't run destructive commands (e.g., rm -rf, resets) unless explicitly requested.
- No network installs unless required and agreed.

5) Validation
- Run linters/tests if they exist, but do not "fix" unrelated issues.
- Update or add minimal docs when behavior changes.
 - Typecheck-first: run `npx -y tsc -p web/tsconfig.json --noEmit` before opening a PR that touches API types; prefer small, focused fixes in the same PR to make the typecheck pass.

6) Git Hygiene
- Group related changes in a single commit with a clear message.
- Avoid committing generated artifacts.
- Commit locally and do NOT push to any remote unless you have explicit permission.
  - Example local workflow:
    - git add -A
    - git commit -m "Describe the change clearly"
    - (do not run `git push`)
  - If a push is required, get explicit approval and confirm the target remote/branch before pushing.

7) Navigation Refactors
- When introducing new navigation stacks (e.g., `BuyStack`), expose them via an `index.ts` that mirrors existing patterns such as `PremiumStack/index.tsx`.
- Keep legacy stack names stable unless the spec demands renaming; add new stacks alongside the old ones and wire screens through the new index entry.
- Avoid duplicating safe-area wrappers: if shared headers already include a `SafeAreaView`, do not wrap the screen body in another `SafeAreaView` unless there is a concrete layout need.
Thanks! Keep it tidy and pragmatic.

