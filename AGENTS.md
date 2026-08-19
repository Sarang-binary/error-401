# AGENTS.md

Guidance for AI agents and developers working in this repository.

## Commands

- Frontend dev server: `npm run dev` (root, port 5173)
- Frontend build: `npm run build` (root)
- Frontend lint: `npm run lint` (root — checks `src/` and `server/`)
- Backend API: `npm start` or `npm run dev` (in `server/`, port 8000)
- Backend seed: `npm run seed` (in `server/` — resets users/sessions, assigns orgs, recomputes risk)
- Backend test: `node e2e-check.mjs` in the temp dir is ad-hoc; no test runner is configured

## Architecture notes

- `server/` is the active Express + Mongoose API. `backend/` is the legacy Python FastAPI reference — do not modify unless asked.
- DB connection string is read from `backend/.env` (`MONGO_URL` or `MONGODB_URI`) by `server/src/config.js`; JWT config lives in `server/.env`. Never log or print connection strings or tokens.
- Auth: JWT (jsonwebtoken) + server-side `sessions` collection storing only SHA-256 token hashes; TTL index auto-expires sessions. RBAC: `faculty` / `hod` / `guest` / `admin`. No seeded user accounts — they are created in-app via `POST /api/auth/register` (role `teacher` → `faculty`, role `hod` → Principal/HOD; teachers are linked to or auto-created as a faculty record) or via guest mode `POST /api/auth/guest`. `GET /api/meta` (universities → campuses → departments) is derived from the `faculties` collection, not users.
- Risk scoring lives in `server/src/services/risk.js` — a faithful port of the Python algorithm; keep both in sync if logic changes.
- Frontend: Tailwind v4 (via `@tailwindcss/vite`), contexts in `src/context/` (`AuthContext`, `UiModeContext`), widgets in `src/components/widgets/` are prop-driven from `GET /api/dashboard`. The Three.js visualizer is lazy-loaded (`React.lazy` + Suspense) to keep the main bundle small.
- Onboarding entry: `src/pages/Onboarding.jsx` shows Sign in / Create account / Skip the login (guest). Registration lives in `src/components/onboarding/RegisterStep.jsx` (role selector: Teacher vs Principal/HOD).