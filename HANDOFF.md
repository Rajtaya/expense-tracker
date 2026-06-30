# ExpenseTracker — Handoff

Last updated: 2026-06-28

Personal daily-expense tracker (web app). Log expenses by category & payment method;
dashboard (today/month/year), reports with charts, search/filter, CSV export.

- Root: `/Users/aarya/expense-tracker` — monorepo: `backend/`, `frontend/`, `docker-compose.yml`
- **Stack:** NestJS 11 + Prisma 6 + PostgreSQL + JWT · Next.js 16 + TS + Tailwind v4 + shadcn/ui + React Query + Recharts + React Hook Form
- **Status:** ✅ Phase-1 MVP built, verified, and **LIVE on Railway**.
- **Live app:** https://expensetracker-app.up.railway.app  (the exact `expensetracker.up.railway.app` was already taken globally)
- **Repo:** public — github.com/Rajtaya/expense-tracker
- **Deploy:** Railway, 3 services (Postgres + backend + frontend). Frontend proxies `/api/*` to the backend (single domain, no CORS). Built via per-service Dockerfile (`RAILWAY_DOCKERFILE_PATH`). **Auto-deploy on push:** both services are connected to GitHub `main`, so `git push` rebuilds & redeploys both automatically. Manual: `railway up --service backend|frontend --ci`. Seed prod DB with the Postgres `DATABASE_PUBLIC_URL`.

---

## Status at a glance

| Area | State |
|---|---|
| Backend API (auth, expenses, categories, reports) | ✅ Done + smoke-tested |
| DB schema + migration + 14 seeded categories | ✅ Applied to local Postgres |
| Frontend (login/register, dashboard, expenses, reports) | ✅ Done + verified in browser |
| Add/edit/delete, search, filters, CSV export, charts | ✅ Working |
| Money Given / Received tracking (type + person) | ✅ Working |
| Installable PWA + mobile-responsive view | ✅ Working |
| Receipt upload, PDF/Excel export, budgeting, Google login | ⛔ Pending (roadmap) |
| Deploy / git repo | ⛔ Pending |

> Note: dev servers are **not running** right now (they were stopped). Restart commands below.

---

## Run it (2 terminals)

Local Postgres 18 (brew) is already running on :5432 with DB `expense_tracker`.

```bash
# 1) Backend  → http://localhost:4100/api
cd /Users/aarya/expense-tracker/backend
npm install                 # first time only
npm run start:dev

# 2) Frontend → http://localhost:3000
cd /Users/aarya/expense-tracker/frontend
npm install                 # first time only
npm run dev
```

Open http://localhost:3000 → register, or log in with the seeded test user:
**rajesh@test.com / secret123** (has sample expenses).

If the DB is ever reset: `cd backend && npx prisma migrate deploy && npx ts-node prisma/seed.ts`

---

## Environment facts

- **DB:** `postgresql://aarya@localhost:5432/expense_tracker?schema=public` (brew Postgres, user `aarya`, no password, trust auth). Docker is NOT used (daemon was off); `docker-compose.yml` exists as an optional alternative (postgres/postgres).
- **Backend** `.env`: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN=7d`, `PORT=4100`, `FRONTEND_URL=http://localhost:3000`. API prefix `/api`. `.env` is gitignored; see `.env.example`.
- **Frontend** `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4100/api`. JWT stored in `localStorage` key `et_token`.
- Preview launch config `expense-frontend` (port 3000) in `~/.claude/launch.json`.

---

## Architecture

**Backend** (`backend/src/`)
- `prisma/` — `PrismaService` (global module). Schema: `User`, `Category`, `Expense` + `PaymentMethod` enum (CASH/UPI/CARD/BANK_TRANSFER/OTHER) + `TxType` enum (EXPENSE/GIVEN/RECEIVED). `Expense` also has `type` (default EXPENSE) and `person` (who money was given to / received from). `prisma/seed.ts` seeds 14 categories (emoji+color).
- `auth/` — register/login/me, JWT (passport-jwt), bcrypt, `@CurrentUser()` decorator, `JwtAuthGuard`.
- `categories/` — list.
- `expenses/` — CRUD, user-scoped, filters (from/to/categoryId/paymentMethod/search/page/limit); Decimal amounts serialized to numbers.
- `reports/` — `summary` (today/month/year + byCategory), `by-category`, `trend` (raw SQL `date_trunc`).

**Frontend** (`frontend/src/`)
- `lib/` — `api.ts` (axios + JWT interceptor), `auth.tsx` (context), `hooks.ts` (React Query), `format.ts`, `types.ts`.
- `components/` — `providers.tsx`, `expense-dialog.tsx` (RHF+zod add/edit), `charts.tsx` (Recharts), `ui/` (shadcn).
- `app/(auth)/` — login, register. `app/(app)/` — layout (auth guard + nav), dashboard, expenses, reports.

**API** (all `/api`, JWT bearer except auth):
`POST /auth/register|login`, `GET /auth/me` · `GET /categories` ·
`GET/POST /expenses`, `GET/PATCH/DELETE /expenses/:id` · `GET /reports/summary|by-category|trend`

---

## Gotchas (important for future edits)

- **Prisma pinned to v6** — v7 (auto-installed by npm) dropped `url` in the schema datasource for an adapter-based config. Stay on v6 unless migrating deliberately.
- **`tsconfig.build.json` excludes `prisma`** so build emits `dist/main.js` (not `dist/src/main.js`).
- **NestJS controllers:** `import type { AuthUser }` for decorated params (isolatedModules, TS1272); export any interface used in a controller return type (TS4053).
- **Next.js 16:** Turbopack by default; `AGENTS.md` warns to read `node_modules/next/dist/docs` for breaking changes. Client-component + React Query approach avoids async-params changes.
- **shadcn uses Base UI (`@base-ui/react`), not Radix:**
  - Dialog/Select triggers use `render={element}` — NOT `asChild`.
  - Select `onValueChange` yields `string | null` (coalesce it).
  - `Select.Value` shows the RAW value unless you pass `items={[{value,label}]}` to the `<Select>` root — done on every select.
- **Recharts v3:** Tooltip `formatter={(v) => fn(Number(v))}` (value is `ValueType | undefined`).
- npm installs in `frontend/` and Expo-style projects may need `--legacy-peer-deps`; backend installs were clean.

---

## Next steps (roadmap order)
1. Receipt uploads (Cloudinary) — `receiptImage` field already exists.
2. PDF / Excel export (CSV already works client-side).
3. Budgeting; 4. Income tracking; 5. Google login; 6. Recurring/bill reminders; 7. OCR; 8. Mobile app (React Native reusing this API).
- Also pending: git repo + Railway/Docker deploy.
