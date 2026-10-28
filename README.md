# Looply — Full-Stack Task & Habit Management Web App

**Looply** is a personal productivity web application built for intentional planning, day-to-day task execution, repeatable habit routines, and honest momentum insights.

Unlike complex admin templates or financial trackers, Looply focuses purely on personal follow-through:
- **What should I focus on today?**
- **Which tasks are overdue or urgent?**
- **Which routines have I completed today or this week?**
- **Which habits are building consistency, and where am I losing momentum?**
- **How has my completion rate changed over time?**

All metrics, streaks, and charts are calculated strictly from real authenticated user data. Normal application startup **never** inserts demo or fake records.

---

## Architecture & Technology Stack

Looply is built without bloat, strictly adhering to modern native web primitives:

- **Frontend**: React 18 with Vite, HTML5, Vanilla CSS3 (custom editorial design system with full Light & Dark mode support), React Router v6.
  - *No Axios*: Centralized API layer built entirely on browser-native `fetch` with automatic CSRF token management and HttpOnly session cookies.
- **Backend**: Node.js (v18+) using the built-in `node:http` module.
  - *No Express*: Custom native HTTP router supporting dynamic parameterized routes, middleware chaining, and streaming JSON body parsing with strict 1MB size limits.
- **Database**: MongoDB using the official MongoDB Node.js driver (`mongodb` v6).
  - *No Mongoose*: Clean, direct driver queries with idempotent index creation.
- **Security & Cryptography**:
  - Passwords hashed with Node.js built-in `crypto.scrypt` using cryptographically random 16-byte salts and timing-safe equality verification (`crypto.timingSafeEqual`).
  - Cryptographically secure 32-byte session tokens hashed with SHA-256 at rest in the `sessions` collection.
  - Double-submit CSRF token validation on all state-changing endpoints (`POST`, `PUT`, `PATCH`, `DELETE`).
  - Strict owner-scoping: ownership is always derived from authenticated sessions; client-supplied IDs are never trusted as authority.
  - In-memory sliding-window rate limiting for login attempts.
- **Testing**: Built-in Node.js test runner (`node:test` and `node:assert`).

---

## Project Structure

```text
25070521195/
├── client/                     # Frontend (React 18 + Vite)
│   ├── src/
│   │   ├── assets/            # Static assets
│   │   ├── components/        # Reusable UI (Navbar, Sidebar, TaskRow, HabitCard, Modals)
│   │   ├── context/           # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/             # Landing, Login, Signup, Dashboard, Tasks, Habits, Planner, Insights, Categories, Profile
│   │   ├── services/          # Centralized native fetch API client
│   │   ├── styles/            # variables.css, global.css
│   │   ├── App.jsx            # App shell, routing & layout
│   │   └── main.jsx           # Entrypoint
│   ├── .env.example           # Frontend environment template
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend (Native node:http + official MongoDB driver)
│   ├── src/
│   │   ├── config/            # Environment & config loader
│   │   ├── controllers/       # Auth, Task, Habit, Category, Dashboard, Insights, Profile
│   │   ├── db/                # MongoClient pool & index initialization
│   │   ├── middleware/        # CORS, body parser, session auth, CSRF, rate limiter
│   │   ├── router/            # Zero-dependency native HTTP router
│   │   ├── utils/             # Scrypt crypto, streak calculation engine, validators, response helpers
│   │   ├── tests/             # node:test suites (streaks, crypto, validators, router, API)
│   │   ├── app.js             # Route registration & middleware composition
│   │   └── server.js          # HTTP bootstrap & graceful shutdown
│   ├── scripts/
│   │   ├── init-db.js         # Standalone index creation script
│   │   └── seed.js            # Development-only seed script (explicit command only)
│   ├── .env.example           # Backend environment template
│   └── package.json
├── package.json               # Root workspace scripts
├── .gitignore                 # Strict ignores for node_modules, .env, build output, logs
└── README.md
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ or v26 recommended).
- **npm**: v9.0.0 or higher.
- **MongoDB**: Either MongoDB Atlas (Cloud) or MongoDB Community Server (Local).

---

## Installation & Setup

### 1. Install Dependencies
Run installation from the project root:
```bash
# Root
npm install

# Server
npm install --prefix server

# Client
npm install --prefix client
```

### 2. Configure Environment Variables

#### Backend (`server/.env`)
Copy the example template:
```bash
cp server/.env.example server/.env
```
Edit `server/.env` with your actual values:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection String (Atlas or Local)
# Atlas Example: mongodb+srv://<username>:<password>@cluster0.xyz.mongodb.net/looply_app?retryWrites=true&w=majority
# Local Example: mongodb://localhost:27017/looply_app
MONGODB_URI=mongodb+srv://<db_user>:<db_password>@cluster0.wzoth1q.mongodb.net/looply?retryWrites=true&w=majority
DB_NAME=looply

SESSION_COOKIE_NAME=looply_session
SESSION_MAX_AGE_DAYS=14

# Google OAuth 2.0 (Optional until configured)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

> **Security Note**: Never commit `server/.env` or expose real passwords in git. `.gitignore` is configured to block all `.env` files.

#### Frontend (`client/.env`)
Copy the frontend template:
```bash
cp client/.env.example client/.env
```
Ensure it points to the backend API:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Database Configuration

### Connecting MongoDB Atlas
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Under **Network Access**, ensure your current IP address is whitelisted (or `0.0.0.0/0` for development).
3. Under **Database Access**, create a user with `readWriteAnyDatabase` privileges.
4. Copy the connection string into `server/.env` as `MONGODB_URI`.
5. Run the idempotent index initializer:
   ```bash
   npm run init-db --prefix server
   ```

### Connecting MongoDB Compass (GUI)
To inspect the exact same database:
1. Open **MongoDB Compass**.
2. Paste the exact same URI configured in `server/.env` (e.g., `mongodb+srv://...` or `mongodb://localhost:27017`).
3. Click **Connect**.
4. Open the **`looply`** (or `looply_app`) database.
5. You can inspect the collections:
   - `users`: Normalized user accounts with salted scrypt hashes.
   - `sessions`: Active sessions with SHA-256 token hashes and TTL indices.
   - `tasks`: User tasks with status, priority, due date, category, and timestamps.
   - `habits`: Habit definitions with daily or custom weekly schedules.
   - `habit_completions`: Individual daily check-ins with unique `habitId + date` constraints.
   - `categories`: User-defined category tags with custom color swatches.

---

## Google OAuth 2.0 Setup

Looply includes a genuine authorization-code OAuth 2.0 / OpenID Connect flow:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web Application).
3. Set **Authorized JavaScript origins** to:
   - `http://localhost:5173`
   - `http://localhost:5000`
4. Set **Authorized redirect URIs** to:
   - `http://localhost:5000/api/auth/google/callback`
5. Paste the Client ID and Client Secret into `server/.env`.
6. When configured, clicking "Continue with Google" securely authenticates the user, verifies their verified email claim, and creates a MongoDB-backed session.
7. *If unconfigured*, the server returns an informative 501 message explaining that Google credentials are not yet set in `.env` rather than mocking fake success.

---

## Running the Application

### Development Mode
Open two terminal windows:

**Terminal 1 (Backend Server)**:
```bash
npm run dev:server
# Server starts at http://localhost:5000
```

**Terminal 2 (Frontend Client)**:
```bash
npm run dev:client
# Vite dev server starts at http://localhost:5173
```

### Optional Development Seed Script
To populate demo records for manual testing:
```bash
npm run seed --prefix server
```
*Demo credentials created*: `demo@looply.test` / `LooplyDemo2026!`

---

## Running Tests & Build Checks

### Backend Unit & Integration Tests (`node:test`)
Runs the zero-dependency test suite covering crypto, validators, native router, streak engine, and API integration:
```bash
npm test --prefix server
```
*Current result: 24 tests across 5 test suites pass cleanly with 0 failures.*

### Frontend Production Build Check
Validates JSX syntax, imports, CSS, and asset bundling:
```bash
npm run build --prefix client
```
*Current result: Vite builds 62 modules to `client/dist` with zero warnings.*

---

## REST API Specification

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check and server status |
| `POST` | `/api/auth/register` | Public | Register new user with email & password |
| `POST` | `/api/auth/login` | Public | Login user, set HttpOnly session cookie |
| `POST` | `/api/auth/logout` | Session | Invalidate session in DB and clear cookie |
| `GET` | `/api/auth/me` | Session | Get current authenticated user profile & CSRF token |
| `GET` | `/api/auth/google` | Public | Redirect to Google OAuth 2.0 authorization |
| `GET` | `/api/auth/google/callback` | Public | Handle Google OAuth authorization code exchange |
| `GET` | `/api/dashboard/summary` | Required | Aggregated Today view (tasks, habits, momentum score) |
| `GET` | `/api/insights/tasks` | Required | Task completion trends, status, priority distribution |
| `GET` | `/api/insights/habits` | Required | Habit check-in streaks, 14-day consistency grid |
| `GET` | `/api/tasks` | Required | List tasks (search, filter by status/priority/category/overdue, sort, page) |
| `POST` | `/api/tasks` | Required | Create a new task |
| `GET` | `/api/tasks/:id` | Required | Get single task by ID |
| `PATCH` | `/api/tasks/:id` | Required | Update task fields (idempotent completion) |
| `DELETE` | `/api/tasks/:id` | Required | Delete task |
| `GET` | `/api/habits` | Required | List habits with real-time calculated streaks |
| `POST` | `/api/habits` | Required | Create new habit (daily or specific days of week) |
| `GET` | `/api/habits/:id` | Required | Get single habit and completion history |
| `PATCH` | `/api/habits/:id` | Required | Update habit definition |
| `DELETE` | `/api/habits/:id` | Required | Delete habit and associated completions |
| `GET` | `/api/habits/:id/completions` | Required | Get array of check-in dates |
| `PUT` | `/api/habits/:id/completions/:date` | Required | Idempotently record check-in for YYYY-MM-DD |
| `DELETE` | `/api/habits/:id/completions/:date` | Required | Undo check-in for YYYY-MM-DD |
| `GET` | `/api/categories` | Required | List categories with task and habit usage counts |
| `POST` | `/api/categories` | Required | Create category |
| `PATCH` | `/api/categories/:id` | Required | Update category name and color |
| `DELETE` | `/api/categories/:id` | Required | Delete category (with safe reassignment protection) |
| `GET` | `/api/profile` | Required | Get user profile and preferences |
| `PATCH` | `/api/profile` | Required | Update display name and timezone |

---

## Streak Calculation Engine

Habit streaks in Looply are schedule-aware:
1. **Daily Habits**: Count consecutive calendar days backward from today. If today is scheduled and in progress (not completed yet), an active streak from yesterday is preserved.
2. **Weekly Habits**: Only days configured in `schedule.days` (e.g. Mon-Fri) are evaluated. Unscheduled days (e.g. Saturday and Sunday) **never break a streak**.
3. **Date Normalization**: Dates are stored as ISO `YYYY-MM-DD` strings to prevent timezone off-by-one errors.
4. **Best Streak**: Evaluated chronologically across all historical check-in intervals.

---

## Current Limitations & Notes

1. **Reminder Delivery**: Preferred reminder times (e.g., `08:00`) are saved as user preferences. Automatic email dispatch and Web Push notification delivery mechanisms are currently in preview and require external mail/push service configuration.
2. **Google OAuth**: Genuine server-side authorization code flow is fully implemented. If Google credentials are not set in `server/.env`, Google sign-in clearly reports as unconfigured rather than faking success.
3. **Git History**: Existing remote `https://github.com/dekate7816/25070521195-CA-03.git` and branch `main` are preserved intact.