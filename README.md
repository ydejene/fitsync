# FitSync

FitSync is a gym membership and operations management platform being built for the Addis Ababa market. The current repository contains a Next.js frontend, an Express backend, and a PostgreSQL setup script for core gym workflows such as member management, memberships, bookings, staff, analytics, and audit logs.

This README focuses on what is currently present in the codebase and how to run it locally. It does not treat every screen or route as production-verified unless explicitly stated.

## Table of Contents

- [Project Overview](#project-overview)
- [Target Users](#target-users)
- [Current Repository Status](#current-repository-status)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Repository Structure](#repository-structure)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Database Bootstrap](#database-bootstrap)
- [Backend API Areas](#backend-api-areas)
- [Access Control](#access-control)
- [Current Notes and Gaps](#current-notes-and-gaps)
- [Contribution Workflow](#contribution-workflow)

## Project Overview

FitSync is intended to help gym owners and their operational teams manage:

- member records
- membership plans and active subscriptions
- class scheduling and bookings
- staff administration
- dashboard reporting and analytics
- audit logging for key actions

The codebase is currently organized as a split frontend/backend application:

- `frontend/`: Next.js application
- `backend/`: Express API and PostgreSQL bootstrap logic

## Target Users

| User Type | Current Relevance in Repo |
| --- | --- |
| Owner | Primary product user in the current repo. Owners sign up, subscribe, and access the operational dashboard once the subscription is active. |
| Staff | Operational dashboard user with permission-based access to members, classes, payments, plans, and insights. |
| Admin | System-level management user used for broader platform oversight, audit access, and staff administration. |
| Member | Exists in the domain model and role checks, but member self-service flows are not documented as complete here. |

## Current Repository Status

This section is deliberately scoped to what is present in the repository today.

### Public and Auth Flows Present

- public landing page
- login flow
- JWT cookie-based authentication between frontend and backend

### Dashboard Areas Present in the Codebase

- dashboard overview for owner/admin/staff users
- members
- memberships
- bookings
- staff management for admin users
- analytics
- audit log

### Payments & Subscriptions

Telebirr B2B Web Checkout is integrated for gym owner subscriptions. The flow includes:
- Plan selection and Telebirr payment initiation.
- Webhook processing for automatic subscription activation.
- Real-time payment status polling on the frontend.


## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express
- `pg` for PostgreSQL access
- `jsonwebtoken` for token handling
- `cookie-parser` for cookie access

### Database

- PostgreSQL
- UUID primary keys
- `JSONB` fields where needed
- setup bootstrapped through `backend/src/config/setup.js`

## System Architecture

High-level local flow:

```text
Browser
  -> Next.js frontend
  -> Express API
  -> PostgreSQL
```

Important architecture notes:

- the frontend does not connect directly to PostgreSQL
- the frontend talks to the backend through REST endpoints
- the backend issues the `fitsync_token` auth cookie
- the frontend verifies the same token for protected dashboard pages

## Repository Structure

```text
fitsync/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── routes/
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── styles/
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   └── package-lock.json
└── README.md
```

### Frontend Notes

- uses the Next.js App Router under `frontend/src/app`
- dashboard pages live under `frontend/src/app/(auth)/(dashboard)`
- shared server-side auth helpers live in `frontend/src/lib`

### Backend Notes

- route registration is handled in `backend/src/index.js`
- database configuration lives in `backend/src/config/db.js`
- initial schema and seed setup lives in `backend/src/config/setup.js`

## Environment Variables

There is no committed `.env.example` file in the repository at the moment. Use the correct local env files below.

### Backend Env File

Create `backend/.env`:

```env
PORT=5000
JWT_SECRET="use_the_shared_or_agreed_dev_secret"
DATABASE_URL="postgresql://postgres:<your_postgres_password>@localhost:5432/fitsync_db"
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
TELEBIRR_FABRIC_APP_ID="your_app_id"
TELEBIRR_APP_SECRET="your_app_secret"
TELEBIRR_MERCHANT_APP_ID="your_merch_id"
TELEBIRR_MERCH_CODE="your_merch_code"
TELEBIRR_PRIVATE_KEY="your_private_key"
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"

```

### Frontend Env File

Create `frontend/.env.local`:

```env
JWT_SECRET="use_the_same_value_as_backend"
NEXT_PUBLIC_BACKEND_URL="http://localhost:5000"
```

### Env Notes

- `JWT_SECRET` should match in both frontend and backend for the current auth flow
- `DATABASE_URL` is used by the backend only
- `NEXT_PUBLIC_BACKEND_URL` points the frontend to the backend API
- `FRONTEND_URL` is used by backend CORS configuration

## Local Development Setup

### Prerequisites

- Node.js and npm
- PostgreSQL running locally
- a local database named `fitsync_db`

### 1. Clone the repository

```bash
git clone <your-remote-url>
cd fitsync
git checkout develop
git pull --ff-only origin develop
git switch -c your-feature-branch
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Add environment files

- create `backend/.env`
- create `frontend/.env.local`

### 5. Initialize the database

```bash
cd backend
node src/config/setup.js
```

### 6. Start the backend

```bash
cd backend
npm run dev
```

### 7. Start the frontend

```bash
cd frontend
npm run dev
```

### Local URLs

- frontend: `http://localhost:3000`
- backend: `http://localhost:5000`
- backend health check: `http://localhost:5000/api/health`

## Database Bootstrap

The repository currently uses `backend/src/config/setup.js` to prepare the initial schema and seed baseline data.

The script currently:

- enables the `pgcrypto` extension
- creates the `users` table
- creates the `plans` table
- creates the `memberships` table
- creates the `payments` table
- creates the `classes` table
- creates the `bookings` table
- creates the `audit_logs` table
- seeds default membership plans
- seeds a default admin user

### Seeded Admin Account

- email: `admin@fitsync.et`
- password: `password`

## Backend API Areas

The Express app currently exposes the following route groups:

- `/api/auth`
- `/api/members`
- `/api/memberships`
- `/api/payments`
- `/api/bookings`
- `/api/dashboard`
- `/api/staff`
- `/api/analytics`
- `/api/audit`

## Access Control

The current backend role model uses:

- `OWNER` (Primary business user. Signs up, subscribes, and operates the gym dashboard after activation.)
- `STAFF` (Operational team members with permission-based access.)
- `ADMIN` (System/platform management user with broader oversight.)
- `MEMBER` (Gym clients/members tracked by the system.)

Current middleware behavior in the repo:

- authentication is required for protected routes
- owner, admin, or staff access is allowed for most operational dashboard routes
- active owner subscriptions are enforced before owner dashboard access
- admin-only access is enforced for audit and staff management routes

## Current Notes and Gaps

- this README is intended to describe the current repo state, not full production verification
- payment gateway integration should not be treated as verified from this README alone
- there is no committed `.env.example` file yet
- there is no root-level automated test setup yet
### Telebirr Sandbox Notes
The Ethio Telecom Telebirr Sandbox is used in development. Note:
- Error `49401024991` indicates periodic sandbox unavailability (external).
- The `NODE_TLS_REJECT_UNAUTHORIZED=0` flag is required because the sandbox uses an untrusted SSL leaf certificate.
- When testing on a local network, ensure `NEXT_PUBLIC_BACKEND_URL` and `TELEBIRR_REDIRECT_URL` use your local IP instead of `localhost`.

## Contribution Workflow

- branch from `develop`
- push changes to your own branch
- open a PR into `develop`
- request review from Abdul or Yonas
- do not merge your own PR
