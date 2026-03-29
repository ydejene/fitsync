# FitSync — Gym Management Platform

> A full-stack SaaS platform for gym owners in Addis Ababa to manage members, staff, payments, and analytics.

>[![Live App](https://img.shields.io/badge/Live%20App-Vercel-black?logo=vercel)](https://fitsync-frontend-zcz8.onrender.com)
>[![API]
(https://img.shields.io/badge/API-Render-46E3B7?logo=render)](https://api-wyug.onrender.com)
>[![Jira Board](https://alustudent-team-k1plq8kl.atlassian.net/jira/software/projects/FIT/boards/100)]

---

## Demo

> 📹 **[Watch Demo Video](https://youtu.be/t3iL6IqruNU)** ← replace with actual link before submission

---

## Features

| Module | What it does |
|---|---|
| **Auth** | Email/password + Google OAuth, JWT sessions, password reset via email |
| **Members** | Full CRUD, search, pagination, membership & payment history |
| **Memberships** | Plan assignment, batch scheduling, fee tracking (paid/overdue) |
| **Bookings** | Class scheduling, capacity, instructor assignment, attendance |
| **Payments** | Multi-method recording (Telebirr, CBE Birr, Cash, Card) |
| **Telebirr** | B2B Web Checkout integration + demo mode mock flow |
| **Staff** | Owner creates staff accounts with granular per-feature permissions |
| **Insights** | KPIs, demographics, revenue trends, attendance patterns, churn |
| **Audit Log** | Full action history for accountability |
| **Admin Panel** | Platform-level gym oversight, activation/deactivation, revenue |
| **Profile** | Photo upload, personal info, emergency contact |
| **i18n** | English / Amharic language switcher |

---

## Roles

| Role | Access |
|---|---|
| `OWNER` | Full dashboard — members, staff, payments, bookings, insights |
| `STAFF` | Restricted to permissions granted by the owner |
| `MEMBER` | No dashboard access |
| `ADMIN` | Platform super-admin — all gyms, system stats |

---

## Tech Stack

**Frontend** — Next.js 15, React 19, TypeScript, Tailwind CSS · deployed on **Vercel**

**Backend** — Node.js, Express, PostgreSQL · deployed on **Render**

---

## Local Setup

**Prerequisites:** Node.js 18+, PostgreSQL

```bash
# 1. Clone
git clone https://github.com/ydejene/fitsync.git && cd fitsync

# 2. Backend
cd backend && cp .env.example .env   # fill in DB_URL, JWT_SECRET, etc.
npm install
node src/config/setup.js             # creates schema + seeds default plans
npm run dev                          # runs on :5000

# 3. Frontend (new terminal)
cd frontend && cp .env.local.example .env.local
npm install
npm run dev                          # runs on :3000
```

### Key environment variables

**backend/.env**
```
DATABASE_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
FRONTEND_URL=http://localhost:3000
TELEBIRR_DEMO_MODE=true
```

**frontend/.env.local**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
JWT_SECRET=                          # same value as backend
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | Auto-deploys from `main` |
| Backend | [Render](https://render.com) | Web service |
| Database | Render PostgreSQL | Managed — set `DATABASE_URL` in Render env vars |

Set all environment variables in each platform's dashboard. Set `TELEBIRR_DEMO_MODE=false` in production when using live Telebirr credentials.

---

## Dev Scripts

Located in `backend/scripts/` — local use only, not for production.

| Script | Purpose |
|---|---|
| `seed_demo_data.js` | Seeds historical revenue for dashboard previews |
| `seed_historical_revenue.js` | Extended seed with owner constraints |
| `upgrade_user.js` | Promotes a user to ADMIN by email |
| `verify_mock_flow.js` | End-to-end Telebirr mock payment verification |
| `test_telebirr_endpoints.js` | Integration tests for payment endpoints |

---

## Project Structure

```
fitsync/
├── backend/
│   ├── scripts/          # Dev-only utilities
│   ├── src/
│   │   ├── config/       # DB connection + schema bootstrap
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth + subscription guards
│   │   ├── routes/       # Express routers
│   │   ├── services/     # Telebirr API integration
│   │   └── utils/        # Email, validation helpers
│   └── uploads/          # Profile photo storage
└── frontend/
    └── src/
        ├── app/          # Next.js App Router pages + API routes
        ├── components/   # Shared UI components
        ├── lib/          # Auth helpers, server-side API client
        ├── types/        # TypeScript type definitions
        └── utils/        # Client-side utilities + validation
```
