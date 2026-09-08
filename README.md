# K-12 Education Workforce Skill & Capacity Intelligence Platform (EduStaff IQ)

An AI-powered Workforce Skill & Capacity Intelligence Platform designed for K-12 school networks. The platform eliminates spreadsheets and intuition-based staffing by matching student demand (enrolment surges, attendance trends, IEP interventions, parent responses) with educator skills, availability, certifications, and professional development needs.

---

## Architecture & Technology Stack

- **Frontend**: React 18, Vite, React Router, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js v22, Express.js REST API (`/api/v1`), JWT Authentication, bcryptjs password hashing, Zod schema validation
- **Database**: Dual-mode MongoDB layer via Mongoose with automatic resilient in-memory/JSON store (`data_store.json`)
- **Generative AI**: Google Gemini API (`gemini-1.5-flash`) for skill ontology inference, capacity forecasting, and candidate matching with fairness checks and human-in-the-loop overrides

---

## 12 Core Operational Pages

1. **Secure Login Page** (`/login`): Institutional sign-in with 1-click evaluator demo shortcuts for all 4 roles.
2. **Workforce Capacity Dashboard** (`/dashboard`): District FTE, utilization %, burnout warnings, and Recharts campus telemetry.
3. **Worker Profiles Page** (`/workers`): Faculty directory, slide-over drawer with verified skills, certifications, and timetable availability.
4. **Skill Matrix & Staffing Board** (`/skill-matrix`): 2D competency heatmap with click-to-inspect evidence dialogs and credential expiry radar.
5. **Assignment Comparison & Manager Approval** (`/assignment-comparison`): Side-by-side candidate comparison matrix with documented override workflows.
6. **Skill Intelligence & Capacity Forecasts** (`/skill-intelligence`): Gemini AI resume/syllabus skill extraction and student demand simulation sliders.
7. **Assignment Fairness & Evidence Review** (`/fairness-review`): AI suggestion review queue with demographic neutrality audits (0.98 parity ratio).
8. **Learning, Mobility & Outcome Tracking** (`/learning-mobility`): Professional development enrollment, outcome recording, and AI model monitoring.
9. **Reports & Analytics Page** (`/reports`): Workforce inventory summaries, department breakdowns, and CSV dataset export.
10. **Notifications Center & Panel** (`/notifications`): Slide-out drawer and full page for urgent alerts and preference management.
11. **User & Role Governance** (`/users-roles`): RBAC account administration and least-privilege permission matrix viewer.
12. **Audit Trail & System Settings** (`/audit-settings`): Immutable append-only audit trail and district AI confidence configurations.

---

## Demo Accounts (Password for all: `Password123!`)

- **HR Administrator**: `admin@oakridge.edu`
- **Workforce Planner**: `planner@oakridge.edu`
- **Team Lead (Math Chair)**: `lead@oakridge.edu`
- **Educator (Faculty)**: `teacher@oakridge.edu`

---

## Quick Start Instructions

1. **Install Dependencies**:
   ```bash
   # In root directory
   npm run install:all
   ```
   *Or individually:*
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

2. **Environment Variables**:
   In `server/.env` (or copy from `server/.env.example`):
   ```env
   PORT=5050
   NODE_ENV=development
   JWT_SECRET=k12-super-secret-jwt-key-edu-intel-2026-secure
   GEMINI_API_KEY=your_gemini_api_key_optional
   GEMINI_MODEL=gemini-1.5-flash
   ```
   *(Note: The platform features a built-in deterministic heuristic fallback so it works 100% out of the box even without a Gemini API key!)*

3. **Run Development Server**:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   # Runs on http://localhost:5050

   # Terminal 2 - Frontend
   cd client && npm run dev
   # Runs on http://localhost:5174 (or 5173)
   ```

4. **Production Build**:
   ```bash
   cd client && npm run build
   ```
