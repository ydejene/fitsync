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
- [Usage Guide](#usage-guide)
- [Backend API Areas](#backend-api-areas)
- [Access Control](#access-control)
- [Insights Page](#insights-page)
- [User Profile Management](#user-profile-management)
- [Accessibility and Internationalization](#accessibility-and-internationalization)
- [Deployment](#deployment)
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

- public landing page with feature highlights and pricing overview
- owner registration flow — new gym owners sign up, land in a `pending` subscription state, and are redirected to choose a plan before accessing the dashboard
- login flow with email/password credentials
- Google OAuth one-click login — if the Google account does not exist in the system, a new OWNER account is automatically created with a pending subscription
- JWT cookie-based authentication (`fitsync_token`) shared between frontend and backend

### Dashboard Areas Present in the Codebase

- **Dashboard overview** — summary KPIs for owner/admin/staff users
- **Members** — full CRUD for gym members with search, pagination, status filters, and member detail views (including membership history and payment records)
- **Memberships** — plan assignment, batch scheduling (morning/afternoon/evening), fee status tracking
- **Payments** — payment records with method tracking (Telebirr, CBE Birr, Cash, Card)
- **Classes & Bookings** — class scheduling with capacity, instructor, location, and attendance tracking
- **Staff** — admin-only module for creating staff accounts and configuring granular permissions
- **Insights** — comprehensive analytics page covering KPIs, demographics, attendance patterns, revenue trends, growth, and churn
- **Profile** — personal profile editing with photo upload, emergency contact, and WhatsApp number
- **Audit Log** — admin-only action history for accountability
- **Subscribe / Payment pages** — subscription plan selection and Telebirr checkout flow for gym owners
- Dynamically filtered sidebar navigation that adjusts to the authenticated user's role and explicit permissions
- Skeleton loading states for smooth page transitions, custom 404 page, and per-page error boundaries

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
- `jsonwebtoken` for JWT token handling
- `cookie-parser` for cookie access
- `bcryptjs` for password hashing
- `multer` for profile photo uploads (JPEG, PNG, WebP — 5 MB limit)
- `google-auth-library` for Google OAuth ID token verification
- `cors` for cross-origin resource sharing
- `dotenv` for environment variable management

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
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── providers/
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
git checkout main
git pull --ff-only origin main
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

## Usage Guide

Once both the frontend and backend are running locally, this is how the platform works end-to-end:

### Owner Registration & Subscription

1. A new gym owner visits the landing page and clicks **Get Started** or navigates to `/register`.
2. After filling in their details (or using **Sign In with Google**), an account is created with subscription status set to `pending`.
3. The owner is redirected to `/subscribe` to choose a plan, then to the Telebirr Web Checkout to complete payment.
4. Once Telebirr confirms payment via webhook, the subscription activates automatically and the owner gains full dashboard access.

### Dashboard & Day-to-Day Operations

1. Log in at `http://localhost:3000/login` using the seeded Admin credentials, a registered Owner account, or Google OAuth.
2. On successful login, the user lands on the dashboard overview at `/dashboard`, which displays top-level KPIs.
3. The sidebar dynamically shows only the modules the logged-in user has access to, based on their role and permissions.

### Managing Members

- Navigate to **Members** to add, edit, search, or deactivate gym members.
- Each member detail view shows their membership history and recent payments.
- Members are created with an email, name, gender, and optional fields like phone, address, and date of birth.

### Staff & Permissions

- Admins and Owners can create staff accounts from the **Staff** module.
- Each staff member can be given granular permissions controlling which modules they can access (Members, Payments, Classes, Insights, Plans).
- When a staff member logs in, their JWT includes these permission flags and the sidebar filters itself accordingly.

### Insights & Analytics

- The **Insights** page provides deep operational analytics — member demographics, revenue trends, attendance patterns, growth tracking, and churn analysis.
- Supports date range filtering and plan-level breakdowns.

### Profile Management

- Any logged-in user can visit **Profile** to update their personal information, upload a profile photo, and set their WhatsApp number and emergency contact.

### Subscriptions (Telebirr Checkout)

- For Gym Owners, an active subscription is enforced before they can access any dashboard feature.
- Selecting a plan redirects to the Telebirr sandbox checkout. See the Telebirr Sandbox notes section for localhost-specific setup tips.

## Backend API Areas

The Express app is organized into the following route groups:

| Route Group | Purpose |
| --- | --- |
| `/api/auth` | Login, registration, Google OAuth, logout, session check (`/me`) |
| `/api/telebirr` | Telebirr payment initiation, redirect handling, webhook callbacks |
| `/api/subscription-plans` | Lists available subscription plans for the pricing page |
| `/api/users` | Profile updates, profile photo upload |
| `/api/dashboard` | Dashboard overview KPIs |
| `/api/members` | Member CRUD, search, pagination, detail views |
| `/api/payments` | Payment records |
| `/api/memberships` | Membership management, plan assignment |
| `/api/bookings` | Class scheduling and booking management |
| `/api/staff` | Staff account creation and permission management |
| `/api/analytics` | Analytics data |
| `/api/audit` | Audit log |
| `/api/insights` | Full insights analytics (KPIs, demographics, attendance, revenue, growth) |

## Access Control

The backend role model uses four user roles:

| Role | Description |
| --- | --- |
| `OWNER` | Primary business user. Signs up, subscribes to a plan, and operates the gym dashboard after subscription activation. |
| `STAFF` | Operational team members added by an Admin or Owner. Access is controlled by granular permissions. |
| `ADMIN` | System/platform management user with full oversight, audit access, and staff administration. |
| `MEMBER` | Gym clients tracked by the system. Member self-service flows are not yet complete. |

### Middleware Layers

1. **Authentication** (`auth.middleware.js`) — verifies the `fitsync_token` JWT cookie on all protected routes.
2. **Subscription enforcement** (`subscription.middleware.js`) — checks that OWNER users have an active, non-expired subscription before allowing access to dashboard routes. ADMIN, STAFF, and MEMBER roles bypass this check.
3. **File upload** (`upload.middleware.js`) — handles profile photo uploads using `multer` with a 5 MB size limit and JPEG/PNG/WebP type filtering.

### Granular Staff Permissions

When an Admin creates or edits a staff member, they can toggle five permission flags that control exactly which dashboard modules the staff member can access:

| Permission Flag | Controls Access To |
| --- | --- |
| `canManageMembers` | Members module |
| `canManagePayments` | Payments module |
| `canManageBookings` | Classes & Bookings module |
| `canViewReports` | Insights & Analytics module |
| `canManagePlans` | Memberships & Plans module |

These permissions are embedded directly into the JWT token at login. On the frontend, the Sidebar component reads them and dynamically hides or shows navigation links. Permission changes are logged in the audit trail.

## Insights Page

The Insights page (`/insights`) provides a comprehensive analytics dashboard. All queries run in parallel for fast loading. The data is organized into the following sections:

### KPIs

- Total members
- Active members
- Monthly revenue (current month)
- Overdue payments count
- Memberships expiring this week

### Demographics

- Gender distribution (pie/bar chart data)
- Age group breakdown (Under 18, 18–25, 26–35, 36–45, 46–55, 55+)

### Membership Insights

- Plan popularity (which plans have the most subscribers)
- Active vs inactive member ratio
- Batch distribution (morning, afternoon, evening)
- Fee status breakdown (paid, unpaid, overdue)

### Payment Analytics

- Payment method breakdown (Telebirr, CBE Birr, Cash, Card) with totals
- Monthly revenue trend over the last 12 months
- Revenue broken down by plan

### Attendance

- Daily traffic over the last 30 days (bookings vs attended)
- Peak hours by hour of day
- Weekly traffic by day of the week

### Growth & Churn

- New member sign-ups over time (monthly)
- Churn rate tracking (members who became inactive, by month)

The Insights endpoint supports optional query parameters for date range (`from`, `to`) and plan filtering (`plan_id`).

## User Profile Management

All authenticated users can manage their profile from the **Profile** page (`/profile`).

Editable fields include:

- Full name
- Phone number
- Address
- Date of birth
- Gender
- WhatsApp number
- Emergency contact
- Profile photo (upload via the camera icon; supports JPEG, PNG, WebP up to 5 MB)

When a profile is updated, the backend regenerates the JWT so the session stays in sync without requiring a re-login.

## Accessibility and Internationalization

### Language Support

FitSync includes a built-in language switcher powered by Google Translate, accessible from the top bar of the dashboard. Currently supported languages:

- **English** (default)
- **Amharic (አማርኛ)**

The switcher uses a custom dropdown UI (not the default Google Translate widget) for a cleaner look.

### Accessible UI Patterns

- ARIA labels on all interactive sidebar links, buttons, and the language switcher
- Keyboard-accessible navigation and dropdown menus
- Custom `not-found.tsx` page at the app root for user-friendly 404 handling
- Per-dashboard `error.tsx` error boundary for graceful error recovery
- Full-page `loading.tsx` skeleton states for smooth transitions between pages
- Mobile-responsive sidebar with backdrop overlay and close button

## Deployment

For production, the project deploys from the `main` branch:

| Component | Host | Notes |
| --- | --- | --- |
| Backend | **Render** | Node.js web service. Set all backend env vars in the Render dashboard. |
| Frontend | **Vercel** | Next.js optimized hosting. Set `JWT_SECRET` and `NEXT_PUBLIC_BACKEND_URL` (pointing to the Render URL) in Vercel project settings. |
| Database | **PostgreSQL** | Hosted PostgreSQL instance (e.g., Render managed database). Use the external connection string as `DATABASE_URL`. |

The workflow is: feature branches → PR into `main` → tested and merged for production deployment.

## Current Notes and Gaps

- This README describes the current repository state and is not a production verification document
- Payment gateway integration (Telebirr) should be independently verified in the sandbox before production use
- No committed `.env.example` file yet
- No automated test suite at the root level
- No email or push notification system (e.g., membership expiry reminders)
- Member self-service portal (members logging in to view their own data) is not yet complete

### Telebirr Sandbox Notes

The Ethio Telecom Telebirr Sandbox is used in development. Note:

- Error `49401024991` indicates periodic sandbox unavailability (external).
- The `NODE_TLS_REJECT_UNAUTHORIZED=0` flag is required because the sandbox uses an untrusted SSL leaf certificate.
- When testing on a local network, ensure `NEXT_PUBLIC_BACKEND_URL` and `TELEBIRR_REDIRECT_URL` use your local IP instead of `localhost`.

## Contribution Workflow

1. Branch from `main`
2. Push changes to your own feature branch
3. Open a PR into `main`
4. Request review from Abdul or Yonas
5. Do not merge your own PR
6. Once your PR is stable and approved, it will be merged into `main` for production deployment

## Acknowledgments

This project makes use of the following third-party services and tools. We appreciate and credit each of them:

- **[Ethio Telecom — Telebirr](https://telebirr.com)** — B2B Web Checkout API used for gym owner subscription payments
- **[Google Identity Services](https://developers.google.com/identity)** — OAuth 2.0 authentication for one-click login and registration
- **[Google Translate](https://translate.google.com)** — powers the in-app English ↔ Amharic language switcher
- **[Next.js](https://nextjs.org)** — React framework for the frontend (App Router, server components)
- **[React](https://react.dev)** — UI library
- **[Tailwind CSS](https://tailwindcss.com)** — utility-first CSS framework for styling
- **[Express](https://expressjs.com)** — Node.js web framework for the backend API
- **[PostgreSQL](https://www.postgresql.org)** — relational database
- **[Vercel](https://vercel.com)** — frontend hosting and deployment
- **[Render](https://render.com)** — backend hosting and managed PostgreSQL
- **[Font Awesome](https://fontawesome.com)** — icon library used throughout the UI
