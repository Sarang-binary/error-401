# Faculty Burnout Risk & Workload Analyzer

Analyzes faculty workload, class schedules, duties and deadlines to detect overload and burnout risk, and suggests workload adjustments.

## Stack

- **Frontend:** React 19 + Vite, Tailwind CSS v4, React Router, Recharts, Three.js via @react-three/fiber
- **Backend:** Node.js / Express + Mongoose (JWT auth, server-side sessions)
- **Database:** MongoDB Atlas

## Setup

### 1. MongoDB Atlas

Your connection string lives in `backend/.env` (key `MONGO_URL` or `MONGODB_URI`). The server loads it automatically — no duplicate config needed. Ensure the Atlas network allowlist includes your IP (or `0.0.0.0/0`).

### 2. Backend

```bash
cd server
npm install
npm run seed      # creates accounts + assigns universities/campuses + computes risk scores
npm start         # API on http://localhost:8000
```

Server config: `server/.env` (`JWT_SECRET`, `JWT_EXPIRES_IN`, `SESSION_TTL_DAYS`, `PORT`).

### 3. Frontend

```bash
npm install
npm run dev       # http://localhost:5173
```

## Getting started

No accounts are pre-seeded. On the first screen choose one of:

- **Sign in** — existing users (University → Campus → Email/Password).
- **Create account** — choose a role: **Teacher** (pick your department) or **Principal / HOD**; registration signs you in automatically.
- **Skip the login and enter the site** — browse as a guest (read-only; recompute disabled).

> Guest mode and registered Principal/HOD accounts see the HOD dashboard. Teacher accounts see only their own metrics.

## Features

- **Onboarding gateway:** entry screen (Sign in / Create account / Skip login) → University → Campus → form, with validation and error states; transitions to the dashboard without a page reload.
- **Self-service registration:** role selection differentiates **Teachers** from **Principal (schools) / HOD (college departments)**; teachers are linked to (or auto-created as) a faculty record.
- **Glassmorphism dashboard:** department risk alert, teaching-hours summary, consecutive-class flags, 14-day deadline density, pending admin task queue, at-risk list.
- **3D workload density visualizer:** prop-driven `@react-three/fiber` bars; height + color map to risk score; lazy-loaded chunk; orbit controls.
- **Accessibility toggle (top-left switch):** Design mode (glass) vs W3C-aligned mode (high contrast, larger text); persisted in `localStorage`.
- **JWT auth:** `jsonwebtoken` sign/verify, sessions stored as SHA-256 hashed tokens with TTL auto-expiry, role-based access (faculty / hod / guest / admin).

## API

| Method | Endpoint | Auth | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/health` | — | Server + DB status |
| GET | `/api/meta` | — | Universities → campuses → departments (from `faculties`) |
| GET | `/api/meta/departments` | — | Departments for a university + campus |
| POST | `/api/auth/register` | — | Create account (role `teacher` or `hod`), returns JWT + user |
| POST | `/api/auth/guest` | — | Guest session (read-only HOD view) |
| POST | `/api/auth/login` | — | Login, returns JWT + user |
| POST | `/api/auth/logout` | ✓ | Revokes session |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/faculties` | hod/admin/guest | All faculty with risk |
| GET | `/api/faculties/me` | faculty | Own metrics |
| GET | `/api/faculties/:id` | hod/admin/guest or self | Detail: schedule, duties, deadlines, risk, suggestions |
| GET | `/api/dashboard` | hod/admin/guest | Widget data: risk distribution, summary, consecutive classes, deadline density, pending tasks, workload |
| POST | `/api/recompute` | hod/admin | Recompute risk scores + suggestions |

Auth header: `Authorization: Bearer <token>`. Errors: `401` invalid/expired/revoked token, `403` insufficient role, clear messages in `{ "error": "..." }`.

## Risk scoring

Weighted factors (0–100):

- Load ratio vs contract (30%)
- Schedule quality — consecutive classes, longest block, shortest break (25%)
- Administrative duty load (20%)
- Deadline pressure next 14 days (15%)
- Utilization stretch (10%)

Levels: Low < 30 · Moderate 30–49 · High 50–69 · Critical ≥ 70

## Project structure

```
server/
  .env                    # JWT secret, session TTL, port
  src/
    config.js             # env loading (server/.env + backend/.env)
    jwtUtils.js           # signToken / verifyToken / hashToken / newSessionId
    authMiddleware.js     # authenticate + requireRole
    models/
      User.js             # university/campus/email, bcrypt hash, role, facultyId
      Session.js          # sessionId, tokenHash, role, expiresAt (TTL index)
      data.js             # faculties, classes, duties, deadlines, risk_scores, suggestions
    services/
      risk.js             # scoring engine (port of backend/app/risk.py)
      suggest.js          # suggestions (port of backend/app/suggest.py)
    routes/
      auth.js             # register / guest / login / logout / me
      meta.js             # universities + campuses + departments
      faculties.js        # list / detail / me
      dashboard.js        # HOD widget payloads
      recompute.js        # full recompute
    index.js              # app bootstrap
    seed.js               # org assignment + recompute (no user accounts)
src/
  context/                # AuthContext, UiModeContext
  components/
    onboarding/           # UniversityStep, CampusStep, LoginStep, RegisterStep
    widgets/              # RiskAlert, SummaryGrid, ConsecutiveClasses, DeadlineDensity, AdminTasks
    three/WorkloadDensity.jsx
    Navbar.jsx, ui.js
  pages/                  # Onboarding, Dashboard, FacultyDetail
  api.js                  # fetch client with JWT injection
```

The original Python backend (`backend/`) remains in the repo as a reference implementation; the Express server in `server/` is the active API.