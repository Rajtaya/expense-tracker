# Security Audit — ExpenseTracker

Date: 2026-06-30 · Scope: backend (NestJS) + frontend (Next.js) + deployment (Railway)

## Summary

Overall the app follows good baseline security practices. This audit added bot
protection (Cloudflare Turnstile), security headers (helmet), and stricter input
validation, and documents the remaining recommendations below.

Legend: ✅ in place · ⚠️ recommended · 🔴 action needed before serious production use

---

## What's already secure ✅

| Area | Status |
|---|---|
| Password storage | ✅ bcrypt hashing (cost 10); plaintext never stored |
| Auth tokens | ✅ JWT, 7-day expiry; prod `JWT_SECRET` is a 64-char random hex |
| Login errors | ✅ Generic "Invalid email or password" (no user/pass distinction) |
| SQL injection | ✅ Prisma ORM (parameterized); the one raw query uses `Prisma.sql` tagged template (parameterized) |
| Cross-site scripting (XSS) | ✅ React auto-escapes; no `dangerouslySetInnerHTML` anywhere |
| Authorization | ✅ All expense/category/report routes behind `JwtAuthGuard`; every query is scoped to `userId` (a user can't read others' data) |
| Input validation | ✅ `class-validator` DTOs + global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) |
| Secrets in git | ✅ `.env` git-ignored; only `.env.example` (placeholders) committed; verified no secrets in history |
| Transport security | ✅ Railway serves everything over HTTPS/TLS |
| CORS | ✅ Restricted to `FRONTEND_URL`; browser traffic is same-origin via the Next `/api` proxy |

## Added in this audit ✅

- **Cloudflare Turnstile** bot/abuse protection on **register** and **login** (frontend widget + backend `siteverify`). Currently using Cloudflare's **test keys** — see action item below.
- **helmet** security headers on the API (HSTS, X-Content-Type-Options, etc.).
- **`forbidNonWhitelisted: true`** — requests with unexpected fields are now rejected.

---

## Action items

### 🔴 1. Set real Cloudflare Turnstile keys (production)
The app ships with Cloudflare's **test keys**, which always pass — so there is no real
bot protection yet. To activate it:
1. dash.cloudflare.com → **Turnstile** → create a widget for your domain → get **Site key** + **Secret key**.
2. Backend (Railway → backend service → Variables): set `TURNSTILE_SECRET_KEY=<secret>`.
3. Frontend: set `NEXT_PUBLIC_TURNSTILE_SITE_KEY=<site key>` (build arg / Dockerfile env) and redeploy.

### 🔴 2. Remove/secure the public demo account
`rajesh@live.com / secret123` was created for testing and is publicly known. Delete it or
change its password.

### ⚠️ 3. Rate limiting
Per-IP throttling isn't effective here because the backend sits behind the Next.js proxy
(all requests share the proxy's IP). Turnstile mitigates auth abuse. If stronger limits are
needed, trust the proxy and rate-limit on `X-Forwarded-For`.

### ⚠️ 4. Dependency advisories
- Backend: 3 high (transitive via `@nestjs/platform-express`).
- Frontend: 2 moderate (`next` → `postcss`).
These are transitive and low-exploitability for this app; update when non-breaking fixes ship (`npm audit`).

### ⚠️ 5. Future hardening (optional)
- **Token revocation:** JWTs are stateless (no server-side logout-all). Add a `tokenVersion` on the user to invalidate tokens on password change/logout-all.
- **httpOnly cookie auth:** token is in `localStorage` (fine given no XSS surface, but an httpOnly cookie is stricter).
- **Password reset** + **account lockout** after repeated failures.
- **Email enumeration:** register replies "Email already registered" — acceptable, but a generic message avoids leaking which emails exist.

---

## Verdict
Safe for personal / small-group use as-is. Before wider/production use, complete action
items **1** and **2** (real Turnstile keys + remove the demo account).
