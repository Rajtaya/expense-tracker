# ExpenseTracker 💸

Personal daily-expense tracker. Log expenses by category & payment method, see a
dashboard (today / month / year), reports with charts, search/filter, and CSV export.

**Stack:** NestJS + Prisma + PostgreSQL + JWT (backend) · Next.js + TypeScript +
Tailwind + shadcn/ui + React Query + Recharts (frontend).

## Project structure
```
expense-tracker/
├── backend/    NestJS API (auth, expenses, categories, reports)
├── frontend/   Next.js app (dashboard, expenses, reports)
└── docker-compose.yml   optional Postgres
```

## Prerequisites
- Node 20.9+ and npm
- PostgreSQL — either:
  - **Local (current setup):** Postgres running on `localhost:5432`, DB `expense_tracker`
  - **Docker:** `docker compose up -d` (uses user/pass `postgres`/`postgres`; update
    `backend/.env` `DATABASE_URL` accordingly)

## Run the backend
```bash
cd backend
npm install
# configure backend/.env (DATABASE_URL, JWT_SECRET) — see backend/.env.example
npx prisma migrate deploy      # or: npx prisma migrate dev
npx ts-node prisma/seed.ts     # seed the 14 categories
npm run start:dev              # API on http://localhost:4100/api
```

## Run the frontend
```bash
cd frontend
npm install
# frontend/.env.local already points to NEXT_PUBLIC_API_URL=http://localhost:4100/api
npm run dev                    # app on http://localhost:3000
```
Open http://localhost:3000 → Register → start adding expenses.

## API overview (all under `/api`, JWT bearer except auth)
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /categories`
- `GET/POST /expenses`, `GET/PATCH/DELETE /expenses/:id` (filters: from,to,categoryId,paymentMethod,search,page,limit)
- `GET /reports/summary`, `GET /reports/by-category`, `GET /reports/trend?groupBy=month|day`

## Features (Phase 1 MVP — done)
- 🔐 Register / login (JWT)
- ➕ Add / edit / delete expenses (amount, category, description, payment method, date)
- 📊 Dashboard: today / month / year totals, category pie, recent transactions
- 📈 Reports: category pie, monthly bar, trend line, date ranges
- 🔎 Search + filters (date presets, category, payment) + CSV export
- 🏷️ 14 seeded categories with emoji + color

## Roadmap (next)
Receipt uploads (Cloudinary), PDF/Excel export, budgeting, income tracking, Google
login, recurring/bill reminders, OCR, mobile app (React Native reusing this API).
