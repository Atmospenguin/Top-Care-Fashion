# TOP App – Development Doc

> Theme: Primary brand color is #F54B3D. Use for CTAs, highlights, and primary buttons.

This guide outlines setup, architecture, conventions, workflows, and operational practices for Top Care Fashion.

---

## 1. Quick Start

> IMPORTANT: Use Node 18+ and Python 3.10+. Install dependencies per app before running.

- Clone and bootstrap
  ```bash
  git clone <repo-url>
  cd Top-Care-Fashion
  ```
- Install per package
  - Web: `cd web && npm i`
  - Mobile: `cd mobile && npm i`
- Environment
  - Copy `.env.example` to `.env` in each package
  - Request secrets from an admin
- Run (dev)
  - Web: `cd web && npm run dev`
  - Mobile: `cd mobile && npx expo start`
  - Expo will now point API calls at the local Next.js server on port 3000 during development; keep the web dev server running or override the port via `EXPO_PUBLIC_DEV_API_PORT`.
  - If Expo reports the bundler host as `localhost`, set `EXPO_LOCAL_HOST_ADDRESS` (for example `10.0.2.2` on Android emulators) so the mobile client can reach your machine.

> TIP: In UI, prefer brand accents (hex #F54B3D) for interactive states and links.

---

## 2. Tech Stack

### Frontend
- **Web App**: Next.js 15.5.2 (React 19.1.0) with App Router
- **Mobile App**: React Native 0.81.4 with Expo 54
- **Styling**: TailwindCSS 4
- **State Management**: React Context API

### Backend & Database
- **Framework**: Next.js API Routes (`/api/*`) deployed on Vercel
- **ORM**: Prisma 6.16.2 with PostgreSQL
- **Database**: Supabase PostgreSQL (managed)
- **Authentication**: Supabase Auth + local user sync
- **File Storage**: Supabase Storage buckets
- **API Style**: REST JSON endpoints

### AI Module (Future)
- **Language**: Python 3.10+
- **Framework**: FastAPI
- **Models**: YOLOv5 / DeepFashion2 (clothing classification), OutfitGAN (Mix & Match)
- **Deployment**: Dockerized microservice

---

## 3. Repository Structure

```
root/
├── web/                # Next.js web app with API routes
├── mobile/             # React Native mobile app (Expo)
├── docs/               # Documentation (PRD, SRS, TDM, etc.)
└── ai-services/        # Python FastAPI services (future)
```

---

## Brand Assets
- Three static logo files (placed in web/public)
- web/public/icon.svg — Small icon/favicon/app icon (for small sizes like 32x32/64x64)
- web/public/logo_brandcolor.svg — Primary brand color version (for light backgrounds/page headers)
- web/public/logo_white.svg — White version (for dark backgrounds/overlay images)
- Recommended usage:
- icon.svg: Use for favicons, mobile icons, and social media card thumbnails.
- logo_brandcolor.svg: Preferred for site headers, landing pages, and marketing pages on light backgrounds.
- logo_white.svg: Use for footers on dark backgrounds or when overlaying images to ensure accessible contrast. - Reference example (Web): Use a public path to reference directly, such as `/icon.svg` or `/logo_brandcolor.svg`.
- Mobile app asset pipeline:
  - All runtime assets are centralised in `mobile/constants/assetUrls.ts`; import from this module instead of referencing `assets/` directly.
  - SVG rendering is backed by `react-native-svg` + `react-native-svg-transformer` and requires the Metro adjustments in `mobile/metro.config.js` plus the type declarations in `mobile/svg.d.ts`.
  - Expo configuration (`mobile/app.json`) still expects PNG files for the app icon/adaptive icon/splash; keep those files in sync with the latest brand artwork.

---

## 4. Environments & Configuration

- Files: `.env` per package; never commit secrets
- Required vars (indicative)
  - WEB: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, `DIRECT_URL`
  - Server-side jobs/scripts: `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `SUPABASE_JWT_SECRET`
  - AI: `MODEL_PATH`, `SERVICE_PORT`
- Profiles
  - Development: verbose logs, sample data allowed
  - Staging: production-like, seeded data, feature flags enabled
  - Production: strict auth, rate limiting, observability on

> SECURITY: Rotate keys every 90 days. Access via least-privilege service accounts.

---

## 5. Database Setup & Recent Updates

### Quick Database Access (Supabase)
```bash
cd web
cp .env.example .env.local  # fill DATABASE_URL / DIRECT_URL from Supabase
npm install
npx prisma generate
```

The shared Supabase instance is already seeded using `database/schema.sql` and `database/seed.sql`.
- `DATABASE_URL` should point to the pooled connection (port 6543, `pgbouncer=true`). If pooling is unavailable on your plan, reuse the direct connection string for both `DATABASE_URL` and `DIRECT_URL` (current Vercel setup).
- `DIRECT_URL` is required for migrations and should target the direct Postgres port (5432).

> Legacy MySQL bootstrap scripts (e.g. `init-db.js`) are deprecated and kept for archival purposes only. Use Prisma + Supabase for all new work.

### Recent Major Update: Testimonials Integration (v2.1.0)

**Overview**: Integrated testimonials into a unified feedback system for better content management.

**Key Changes**:
- **Unified Schema**: Merged `testimonials` table into `feedback` table
- **Enhanced Types**: Added `feedback_type` enum ('feedback'|'testimonial')
- **New Fields**: Added `user_name`, `rating`, `tags`, `featured` to feedback table
- **API Updates**: All testimonials APIs now use unified feedback system
- **Admin Interface**: Complete rewrite for managing both content types

**Database Schema**:
> Legacy MySQL example preserved for history. Refer to `web/prisma/schema.prisma` for the active Supabase definition.
```sql
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_email VARCHAR(191) NULL,
  user_name VARCHAR(100) NULL COMMENT 'Display name for testimonials',
  message TEXT NOT NULL,
  rating TINYINT NULL COMMENT 'Rating 1-5 for testimonials',
  tags JSON NULL COMMENT 'Array of tags for testimonials',
  featured TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Featured on homepage',
  feedback_type ENUM('feedback', 'testimonial') NOT NULL DEFAULT 'feedback',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Sample Data Included

The database now contains comprehensive sample data:

**Users (10 accounts)** - Ready to login with real passwords:
- `admin` / `admin@topcare.com` / `admin123` (Admin, Premium)
- `fashionista_emma` / `emma@example.com` / `password123` (Premium User)
- `vintage_hunter` / `vintage@gmail.com` / `password123` (Regular User)
- `style_guru_alex` / `alex@fashion.co` / `password123` (Premium User)
- `casual_buyer` / `buyer@email.com` / `password123` (Regular User)
- `premium_seller` / `seller@pro.com` / `password123` (Premium User)
- `trend_setter` / `trends@style.net` / `password123` (Regular User)
- `eco_warrior` / `eco@green.org` / `password123` (Premium User)
- `budget_shopper` / `budget@student.edu` / `password123` (Regular User)
- `luxury_lover` / `luxury@designer.com` / `password123` (Premium User)

**📋 详细测试信息**: 查看 `TEST_ACCOUNTS.md` 获取完整的测试账户信息和使用建议。

**Content Data**:
- **29 Feedback/Testimonials**: 21 testimonials (8 featured) + 8 user feedback
- **10 Categories**: Tops, Bottoms, Dresses, Outerwear, Shoes, etc.
- **15 Listings**: Various clothing items ($25-200 price range)
- **10 Transactions**: Different statuses (completed, shipped, pending)
- **8 Reviews**: User reviews with ratings
- **8 FAQ Entries**: Common questions and answers
- **4 Reports**: Sample moderation cases
- **Site Stats**: 25,847 downloads, 15,674 listings, 8,932 sold

### Environment Configuration
```bash
# .env.local (web)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
DATABASE_URL="postgresql://USERNAME:PASSWORD@aws-1-...pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USERNAME:PASSWORD@db.YOUR-ID.supabase.co:5432/postgres?sslmode=require"
PRISMA_DISABLE_PREPARED_STATEMENTS=1
```

> Prisma reads DATABASE_URL/DIRECT_URL automatically. Supabase env vars are required for auth and storage.

### Supabase Auth & Storage

- **Auth**: Configure email and social providers from the Supabase dashboard. Set the Site URL to your Vercel deployment domain to ensure redirect flows work in production. Use the anon key on the client and keep the service role key server-side only.
- **Storage**: Provision buckets (e.g., `product-images`) and grant read access via RLS policies that reference Supabase Auth user IDs. Uploads from the web app should flow through Supabase Storage APIs.
- **Edge Functions (optional)**: For background jobs, consider Supabase edge functions triggered via database events instead of Firebase Cloud Functions.

---

### Automated Testing (Web)

- Run unit tests with `npm run test` inside `web/`.
- Tests are powered by Vitest and focus on Prisma bridging helpers.
- Set `RUN_API_TESTS=1` to execute the Supabase-backed API integration suite (writes are auto-cleaned).
- Coverage reports are emitted to `web/coverage/`.

---

## 6. API Architecture

### Next.js API Routes
- **Location**: `web/src/app/api/*`
- **Style**: REST JSON endpoints
- **Database**: Prisma Client (`@/lib/db`)
- **Auth**: Supabase Auth + local user sync
- **Error Handling**: Standardized error responses

- Practical API hygiene (short):
  - Use the centralized helper `getSessionUser(req)` for server-route auth checks instead of ad-hoc parsing.
  - In Next 15 App Router dynamic routes, `context.params` may be a Promise — await it inside handlers and normalize param names to avoid type collisions.
  - Avoid selecting nonexistent Prisma fields (e.g., `avatar_path`) and guard nullable relations before accessing properties.
  - Guard `Date | null` fields before calling `.toISOString()` and return `null` in JSON when appropriate.

### API Standards
- **Status Codes**: RFC 9110-aligned semantics
- **Error Format**:
  ```json
  { "error": "Database error", "details": "..." }
  ```
- **Pagination**: `?page=1&pageSize=20` (future)
- **Filtering**: `?status=active&category=tops` (future)
- **Auth**: Session cookies + Supabase JWT

### Current Endpoints
- `GET /api/listings` - Fetch all active listings
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Current user profile
- `GET /api/profile` - User profile data
- `GET /api/landing-content` - Homepage content

---

## 7. Coding Conventions

- Language targets
  - TypeScript for web/backend; ES2022 module syntax
  - Python 3.10+ with type hints
- Style
  - Lint: ESLint + Prettier (web, backend); Ruff/Black (AI)
  - Folder-by-feature; keep components/hooks/services cohesive
- Naming
  - Functions: verbs; Variables: nouns; Avoid abbreviations
- Testing
  - Web/Backend: Jest + React Testing Library / Supertest
  - AI: Pytest; fixture-based model stubs

- Typecheck-first workflow: when touching API types run `npx -y tsc -p web/tsconfig.json --noEmit` and prefer small, focused fixes to make the typecheck pass before opening a PR.

> ACCESSIBILITY: Ensure color contrast AA; brand color #F54B3D on white is acceptable for large text/CTAs.

---

## 8. Development Workflow

Tools
- Version Control: GitHub
- Design: Figma
- Project Management: Notion + Telegram
- CI/CD: GitHub Actions, Vercel (web), Expo for Mobile

Process
1. Plan: Define sprint tasks in Notion
2. Develop: Work on isolated feature branches
3. Test: Unit tests + minimal e2e where risky
4. Integrate: Frontend ↔ Backend ↔ AI services
5. Review: Pull request + code review before merge
6. Deploy: Web to Vercel (auto-linked to Supabase), mobile via Expo

Branching
- `main`: production-ready
- `develop`: integration
- `feature/<name>`, `fix/<name>`

Commit format
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`

---

## 9. Local Scripts

Web (Next.js)
- `npm run dev` – dev server with Turbopack
- `npm run build` – production build (includes Prisma generate)
- `npm run start` – production server
- `npm run lint` – ESLint
- `npm run test` – Vitest unit tests

Mobile (Expo)
- `npm start` – Expo DevTools
- `npm run android` – Android build
- `npm run ios` – iOS build
- `npm run web` – Web preview

---

## 10. Security Guidelines

- All data must be dynamic, no hardcoded secrets
- Supabase Auth for login/registration; issue JWT via Supabase for server-to-server calls
- Validate inputs at client and server
- Roles: Guest, Registered, Premium, Admin
- Rate limit sensitive endpoints; log auth events

> PRIVACY: PII must be encrypted in transit and at rest. Avoid storing unnecessary PII.

---

## 11. Prototype Guidelines

- Prototypes: React.js (web) and React Native (mobile)
- Figma is for design only, not for submission
- Include flow: Landing → Registration → Marketplace
- Early prototypes may use temporary endpoints; upgrade to live APIs before release

---

## 12. Observability & Quality

- Logging: Structured logs (JSON) with levels
- Tracing: Include `x-request-id` and propagate
- Metrics: basic latency and error rate per service
- Error tracking: Sentry/Crashlytics where available
- QA checklist: a11y, responsiveness, i18n placeholders, empty states

> SLO: Aim for p95 web TTFB < 400ms; backend p95 latency < 250ms.

---

## 13. Deployment

- **Web**: Vercel (auto-deploy from GitHub, connected to Supabase)
- **Mobile**: Expo EAS Build & Submit workflows
- **Database**: Supabase PostgreSQL (managed)
- **Storage**: Supabase Storage buckets

> RELEASE: Tag with `vX.Y.Z`. Maintain changelog. Roll back via previous Vercel deployment snapshot.

---

## 14. Contribution Rules

- Branch naming: `feature/<name>`, `fix/<name>`
- Commit style: short, descriptive Conventional Commits
- All merges go through pull requests and reviews
- Keep code modular, reusable, and typed

---

## 15. Contact & Resources

- Design system tokens and theme color: primary `#F54B3D`
- Links: Figma, Notion board, CI dashboard (see `docs/links.md`)
- Maintainers: @frontend, @backend, @ai

---

## 16. Operational lessons & quick fixes (2025-10-25)

This project keeps evolving; below are concise operational lessons from a recent maintenance session that are useful for reviewers and contributors.

- Auth: Consolidate authentication into `web/src/lib/auth` helpers (use `getSessionUser(req)`). Avoid inline token parsing in individual routes.
- Next 15 App Router: Route handlers must `await context.params` in dynamic routes. Standardize handler signatures across `web/src/app/api/*` to avoid type mismatches.
- Prisma safety:
  - Do not select non-existent fields (example: remove `avatar_path` selects).
  - Guard nullable relations before accessing properties (e.g., `listing.seller?.username`).
  - Guard date fields before calling `.toISOString()` and return `null` in JSON responses when DB date is nullable.
- Mobile: keep `expo-image-picker` and use `ImagePicker.MediaTypeOptions.Images` in TypeScript code. Implement FormData primary upload and a base64 fallback for avatars.
- Typecheck-first workflow: run `npx -y tsc -p web/tsconfig.json --noEmit` before submitting PRs that touch API types. Prefer small, focused fixes to make the typecheck pass.

Quick checklist for small API fixes

1. Update route signature to Next 15 style and `await context.params`.
2. Replace any `avatar_path` selects with `avatar_url` and check client usage.
3. Add `x?.toISOString()` guards where `x` is possibly `null`.
4. Re-run TypeScript checks and fix only the minimal related errors in the same PR.

If you want, we can add a lightweight `CHECKLIST.md` under `docs/` that PR authors must run before requesting review; I can create it in a follow-up PR.
