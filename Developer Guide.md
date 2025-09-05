# Top Care Fashion – Developer Guide

This document provides an overview of the technology stack, project structure, and workflow guidelines for developers working on **Top Care Fashion**.

---

## 1. Tech Stack

### Frontend
- **Web App:** React.js (Next.js for SSR & SEO)
- **Mobile App:** React Native
- **Styling:** TailwindCSS / Styled Components
- **State Management:** Redux Toolkit / Context API

### Backend
- **Server:** Node.js (Express.js / NestJS)
- **API:** REST (JSON-based)
- **Auth & Storage:** Firebase Auth, Firebase Storage
- **Database:** 
  - MySQL (transactions, user data, listings)
  - Firestore (real-time features, chat/messages)

### AI Module
- **Language:** Python
- **Framework:** FastAPI / Flask
- **Models:**
  - YOLOv5 / DeepFashion2 (clothing classification)
  - OutfitGAN / Graph Neural Networks (Mix & Match)
- **Deployment:** Dockerized microservice, exposed via REST API

---

## 2. Project Structure

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

## 3. Database (Simplified Schema)

**Users**
- id (PK), email, password_hash, role, profile (age_group, gender, preferences)

**Listings**
- id (PK), user_id (FK), title, description, category, price, created_at

**Transactions**
- id (PK), buyer_id (FK), seller_id (FK), listing_id (FK), amount, status, timestamp

**Feedback**
- id (PK), user_id (FK), rating, comment, created_at

---

## 4. Development Workflow

### Tools
- **Version Control:** GitHub
- **Design:** Figma
- **Project Management:** Notion + Telegram
- **CI/CD:** GitHub Actions, Firebase Hosting, Expo for Mobile

### Process
1. **Plan:** Define sprint tasks in Notion
2. **Develop:** Work on isolated feature branches
3. **Test:** Unit testing with Jest (JS) / Pytest (Python)
4. **Integrate:** Connect frontend ↔ backend ↔ AI services
5. **Review:** Pull request + code review before merge
6. **Deploy:** Deploy web to Firebase Hosting, mobile via Expo

---

## 5. Security Guidelines
- All data must be dynamic, **no hardcoded values**
- Use **Firebase Auth** for login/registration
- Apply **JWT tokens** for API authentication
- Input validation on both client and server
- Separate roles: Guest, Registered, Premium, Admin

---

## 6. Prototype Guidelines
- Prototypes must be implemented using **React.js (web)** and **React Native (mobile)**
- Figma is for design only, not for submission
- Prototype should include:
  - Landing Page → Registration → Marketplace flow
  - Mocked API calls with static JSON allowed at this stage

---

## 7. Contribution Rules
- Branch naming: `feature/<name>`, `fix/<name>`
- Commit style: short and descriptive (e.g., `feat: add user profile form`)
- All merges go through pull requests
- Keep code modular and reusable

---

## 8. Next Steps
- Finalize wireframes and link with dynamic data sources
- Build registration & profile setup flow
- Implement AI service endpoints for testing
- Deliver prototype (React.js + React Native) before **13 Sept 2025**