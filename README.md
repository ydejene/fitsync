# FitSync

FitSync is a gym management platform built for the Addis Ababa market. The current codebase is split into a Next.js frontend and an Express/PostgreSQL backend, with support for member management, memberships, payments, bookings, staff, analytics, and audit logs.

## Current Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL, JWT auth
- Database: PostgreSQL via `pg`
- Auth flow: backend signs the `fitsync_token` cookie, frontend verifies it for protected dashboard pages

## Implemented Modules

- Public landing page
- Login flow
- Dashboard
- Members
- Memberships
- Payments
- Bookings
- Staff
- Analytics
- Audit log

## Repository Structure

```text
fitsync/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── styles/
│   │   ├── types/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Local Development Setup

### Prerequisites

- Node.js and npm
- PostgreSQL running locally
- A database named `fitsync_db`

### 1. Clone the repo

```bash
git clone git@github-thierry-ctrl:ydejene/fitsync.git
cd fitsync
git checkout develop
git pull --ff-only origin develop
git switch -c your-feature-branch
```

### 2. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure environment variables

Create `backend/.env`:

```env
PORT=5000
JWT_SECRET="use_the_shared_or_agreed_dev_secret"
DATABASE_URL="postgresql://postgres:<your_postgres_password>@localhost:5432/fitsync_db"
FRONTEND_URL="http://localhost:3000"
```

Create `frontend/.env.local`:

```env
JWT_SECRET="use_the_same_value_as_backend"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
```

Notes:

- Use the same `JWT_SECRET` in both env files. The frontend verifies the same auth token the backend issues.
- The current frontend code does not read `DATABASE_URL`; that variable is backend-only.
- There is no committed `.env.example` file in the repo right now.

### 4. Initialize the database

Run the backend setup script after `backend/.env` is in place:

```bash
cd backend
node src/config/setup.js
```

This script:

- enables `pgcrypto`
- creates the core tables
- seeds membership plans
- seeds a default admin user

Seeded admin credentials:

- email: `admin@fitsync.et`
- password: `password`

### 5. Start the apps

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Backend health check: `http://localhost:5000/api/health`

## Backend API Areas

The Express app currently exposes these route groups:

- `/api/auth`
- `/api/members`
- `/api/memberships`
- `/api/payments`
- `/api/bookings`
- `/api/dashboard`
- `/api/staff`
- `/api/analytics`
- `/api/audit`

## Database Notes

The current backend uses PostgreSQL, not MySQL. The setup script creates these tables:

- `users`
- `plans`
- `memberships`
- `payments`
- `classes`
- `bookings`
- `audit_logs`

The schema uses UUID primary keys and PostgreSQL-specific features such as `gen_random_uuid()` and `JSONB`.

## Frontend Notes

- The frontend uses the Next.js App Router under `frontend/src/app`.
- Protected dashboard pages rely on server-side session checks in `frontend/src/lib/auth.ts`.
- The frontend talks to the backend through `NEXT_PUBLIC_BACKEND_URL`.

## Contribution Workflow

- Branch from `develop`
- Push your work to your own branch
- Open a PR into `develop`
- Request review from Abdul or Yonas
- Do not merge your own PR

## Current Gaps

- There is no root-level automated test setup yet
- There is no committed `.env.example` file yet
- The frontend still has the default scaffold README at `frontend/README.md`
