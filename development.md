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
  - Backend: `cd backend && npm i`
  - AI services: `cd ai-services && pip install -r requirements.txt`
- Environment
  - Copy `.env.example` to `.env` in each package
  - Request secrets from an admin
- Run (dev)
  - Web: `npm run dev`
  - Mobile: `npx expo start`
  - Backend: `npm run start:dev`
  - AI: `uvicorn app.main:app --reload`

> TIP: In UI, prefer brand accents (hex #F54B3D) for interactive states and links.

---

## 2. Tech Stack

### Frontend
- Web App: React.js (Next.js for SSR & SEO)
- Mobile App: React Native
- Styling: TailwindCSS / Styled Components
- State Management: Redux Toolkit / Context API

### Backend
- Server: Node.js (Express.js / NestJS)
- API: REST (JSON-based)
- Auth & Storage: Firebase Auth, Firebase Storage
- Database:
  - MySQL (transactions, user data, listings)
  - Firestore (real-time features, chat/messages)

### AI Module
- Language: Python
- Framework: FastAPI / Flask
- Models:
  - YOLOv5 / DeepFashion2 (clothing classification)
  - OutfitGAN / Graph Neural Networks (Mix & Match)
- Deployment: Dockerized microservice, exposed via REST API

---

## 3. Repository Structure

```
root/
├── web/                # React.js web app
├── mobile/             # React Native mobile app
├── backend/            # Node.js API server
├── ai-services/        # Python FastAPI services (object detection, outfit recommender)
├── docs/               # Documentation (PRD, SRS, TDM, etc.)
└── scripts/            # Deployment and automation scripts
```

---

## Brand Assets

- Three static logo files (placed in web/public)
- web/public/Icon.svg — Small icon/favicon/app icon (for small sizes like 32x32/64x64)
- web/public/Logo_BrandColor.svg — Primary brand color version (for light backgrounds/page headers)
- web/public/Logo_White.svg — White version (for dark backgrounds/overlay images)
- Recommended usage:
- Icon.svg: Use for favicons, mobile icons, and social media card thumbnails.
- Logo_BrandColor.svg: Preferred for site headers, landing pages, and marketing pages on light backgrounds.
- Logo_White.svg: Use for footers on dark backgrounds or when overlaying images to ensure accessible contrast. - Reference example (Web): Use a public path to reference directly, such as `/Icon.svg` or `/Logo_BrandColor.svg`.

---

## 4. Environments & Configuration

- Files: `.env` per package; never commit secrets
- Required vars (indicative)
  - WEB: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_FIREBASE_CONFIG`
  - BACKEND: `DATABASE_URL`, `JWT_SECRET`, `FIREBASE_ADMIN_CREDENTIALS`
  - AI: `MODEL_PATH`, `SERVICE_PORT`
- Profiles
  - Development: verbose logs, sample data allowed
  - Staging: production-like, seeded data, feature flags enabled
  - Production: strict auth, rate limiting, observability on

> SECURITY: Rotate keys every 90 days. Access via least-privilege service accounts.

---

## 5. Database Setup & Recent Updates

### Quick Database Initialization
```bash
cd web
node init-db.js
```

This script automatically:
1. Creates the `top_care_fashion` database
2. Sets up all tables with unified schema
3. Populates with comprehensive sample data

### Recent Major Update: Testimonials Integration (v2.1.0)

**Overview**: Integrated testimonials into a unified feedback system for better content management.

**Key Changes**:
- **Unified Schema**: Merged `testimonials` table into `feedback` table
- **Enhanced Types**: Added `feedback_type` enum ('feedback'|'testimonial')
- **New Fields**: Added `user_name`, `rating`, `tags`, `featured` to feedback table
- **API Updates**: All testimonials APIs now use unified feedback system
- **Admin Interface**: Complete rewrite for managing both content types

**Database Schema**:
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
# .env.local (web directory)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=top_care_fashion
```

---

## 6. API Standards

- REST JSON; version under `/api/v1`
- Status codes: use RFC 9110-aligned semantics
- Error format
  ```json
  { "error": { "code": "RESOURCE_NOT_FOUND", "message": "...", "details": {} } }
  ```
- Pagination: `?page=1&pageSize=20`
- Filtering: `?status=active&category=tops`
- Auth: Bearer JWT; include `x-request-id` for tracing

> NOTE: For public endpoints, enforce read-only and strict CORS.

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

> ACCESSIBILITY: Ensure color contrast AA; brand color #F54B3D on white is acceptable for large text/CTAs.

---

## 8. Development Workflow

Tools
- Version Control: GitHub
- Design: Figma
- Project Management: Notion + Telegram
- CI/CD: GitHub Actions, Firebase Hosting, Expo for Mobile

Process
1. Plan: Define sprint tasks in Notion
2. Develop: Work on isolated feature branches
3. Test: Unit tests + minimal e2e where risky
4. Integrate: Frontend ↔ Backend ↔ AI services
5. Review: Pull request + code review before merge
6. Deploy: Web to Firebase Hosting, mobile via Expo

Branching
- `main`: production-ready
- `develop`: integration
- `feature/<name>`, `fix/<name>`

Commit format
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`

---

## 9. Local Scripts

Web
- `npm run dev` – dev server
- `npm run build` – production build
- `npm run lint` – linting

Backend
- `npm run start:dev` – watch mode
- `npm run test` – unit tests
- `npm run lint` – linting

AI Services
- `make serve` or `uvicorn app.main:app --reload`
- `pytest -q`

---

## 10. Security Guidelines

- All data must be dynamic, no hardcoded secrets
- Firebase Auth for login/registration; JWT for API
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

- Web: GitHub Actions → Firebase Hosting
- Mobile: Expo build & submit workflows
- Backend: GitHub Actions → chosen host (e.g., Render/VM)
- AI: Docker image pushed; service restarted with zero-downtime

> RELEASE: Tag with `vX.Y.Z`. Maintain changelog. Roll back via previous artifact.

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