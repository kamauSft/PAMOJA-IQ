# Pamoja IQ — Stability First (TOP PRIORITY, do before anything else)

**How Thomas uses this file:**
1. Save it into `C:\Users\USER\pamoja-iq\docs\`.
2. In Cursor (folder `C:\Users\USER\pamoja-iq`), **Ctrl + I** → **Agent**, type:
   **`Stop all other work. Read @docs/PAMOJA-IQ-STABILITY.md and do it from Step 1.`**

---

## Instructions for the Cursor Agent

This is the owner's livelihood. He keeps seeing **"Not secure"** and then **"offline"** when he opens the app, and cannot test reliably. **Pause every other task** (commit unfinished work to its branch first). Nothing new gets built until the app is stable, reachable on a real HTTPS address, and members and the treasurer can sign in every time.

Rules: diagnose before changing; tell Thomas the root cause of each problem in one plain sentence; run all commands yourself; one branch `fix/stability`; tests must pass; then give him links and a short checklist and wait for "OK". Never ask him to debug.

---

## Step 1: Find out why it says "insecure" and "offline" (report, then fix)

Check each and report which ones apply:

1. **HTTPS forced in development.** `Strict-Transport-Security`, HTTP→HTTPS redirects, `upgrade-insecure-requests` in the CSP, or similar applied when `NODE_ENV=development` make the browser refuse `http://localhost` or jump to `https://localhost` (which fails).
   - Fix: apply HSTS, HTTPS redirect and `upgrade-insecure-requests` **only in production**.
   - Tell Thomas how to clear the stuck HSTS entry in Chrome/Edge: open `chrome://net-internals/#hsts` (or `edge://net-internals/#hsts`), under "Delete domain security policies" type `localhost`, click **Delete**.
2. **Cookies that need HTTPS.** `Secure` flag and `__Host-` cookie prefix on `http://localhost` stop sign-in from saving.
   - Fix: `Secure` and `__Host-` only in production; plain `pamoja_session`, `SameSite=Lax`, `HttpOnly` in development.
3. **Service worker / PWA offline page.** A service worker caching pages or showing an "offline" fallback when the dev server restarts.
   - Fix: **disable the service worker completely in development**, add code that unregisters any old service worker and clears its caches on load in development, and in production only cache static files (never pages with member data, never login).
   - Tell Thomas how to clear it once: F12 → **Application** → **Service workers** → **Unregister**, then **Storage** → **Clear site data**.
4. **Dev server stops.** The app only runs while the agent's terminal runs it; it dies when the agent stops, crashes on an error, or port 3000 is taken by an old process.
   - Fix: see Step 2.
5. **Crashes that look like "offline".** Database not migrated, missing `.env` value, a page throwing an error. Check the server log and fix every error found.
6. **CAPTCHA / CSP blocking the page** (Turnstile or other scripts blocked by the new Content-Security-Policy in development). Fix the CSP for development and make CAPTCHA optional when keys are missing in development.

Write the findings in `docs/STABILITY-REPORT.md`.

---

## Step 2: Make local testing reliable on Windows

- Add **`start-pamoja.bat`** in the project root. Thomas double-clicks it, and it:
  1. goes to the project folder,
  2. stops anything already using port 3000,
  3. runs `npm install` only if `node_modules` is missing,
  4. runs `npx prisma migrate deploy` (or `db push` in dev) and seeds demo data only if the database is empty,
  5. starts `npm run dev`,
  6. opens `http://localhost:3000` in the default browser once the server is ready,
  7. keeps the window open with a clear message: "Pamoja IQ is running. Keep this window open. Close it to stop."
- Add **`stop-pamoja.bat`** that frees port 3000.
- Add a **health page** at `/health` showing in plain words: app running ✓, database connected ✓, version, environment. If something is wrong it says what, e.g. "Database not set up: run start-pamoja.bat".
- Replace any generic "offline" or blank error screens with a clear message and what to do.
- `npm run dev` must start with **zero errors and zero warnings** about env, Prisma or CSP.

---

## Step 3: A real, always-on HTTPS address (the serious solution)

Thomas must not depend on localhost to test or demo. Deploy a **staging** site now, before more features.

- Hosting: **Vercel** (free tier, HTTPS automatic) + **Neon Postgres** (free tier, from Vercel Storage). Switch Prisma to PostgreSQL for staging/production with migrations.
- Staging runs with `DEMO_MODE=true` and demo data so Thomas can test anywhere, on his phone too. Address like `pamoja-iq-staging.vercel.app` or the project's default `*.vercel.app` URL.
- Production (real members) comes later, separately, with `DEMO_MODE=false` and no demo accounts (see `PAMOJA-IQ-MOTIVATION-GO-LIVE.md` Part 2).
- Guide Thomas **one click at a time** (wait for "done" after each):
  1. vercel.com → Sign up → **Continue with GitHub** (kamauSft).
  2. **Add New → Project** → import **PAMOJA-IQ** → don't deploy yet.
  3. **Storage → Create → Neon Postgres** → connect it to the project.
  4. **Settings → Environment Variables**: you generate the values and give him a list to paste (`SESSION_SECRET`, `PIN_PEPPER`, `CRON_SECRET`, `DEMO_MODE=true`, others). Secrets go only into Vercel, never into chat or GitHub.
  5. **Deploy**.
- After deploy: run migrations + seed on staging, open the site yourself (via HTTP requests/Playwright against the live URL), and verify: home page, `/health`, treasurer sign-in, member sign-in, Excel upload with the template, member sees only own data, security headers present, padlock (HTTPS) shown, no service-worker "offline" page.
- Every future pull request gets an automatic **preview link**, so Thomas tests changes on a real HTTPS link.

---

## Step 4: Prove sign-in works every time

Automated end-to-end tests (Playwright) that run **against localhost and against the staging URL**:
- Treasurer `0712345002` / `25802580` signs in → dashboard.
- Member `0712345005` / `258025` signs in → only her own figures.
- New member with temporary PIN → forced PIN change → home.
- 3 wrong PINs → locked → treasurer unlocks → member signs in.
- Member using `?door=treasurer` or typing treasurer URLs → no access (404 or redirected to `/me`).
- Refresh the page, close and reopen the browser: still signed in (within session limits), no "offline" page.
- Stop and restart the server: the site comes back without clearing the browser.

Add a GitHub Actions job that runs these tests on every PR. A PR cannot be merged if they fail.

---

## Step 5: Hand over to Thomas

Give him, in plain words:
1. The **root cause** of "insecure" and "offline" (one sentence each).
2. The **staging link** (HTTPS, works on his phone) and demo logins.
3. How to run it on his PC: double-click `start-pamoja.bat`.
4. A 5-point checklist to confirm everything works.
5. What "Not secure" means: on `http://localhost` it is normal and harmless; on the staging and live sites he must see the **padlock**.

Then wait for "OK" before resuming the other docs in this order: FIXES → ROUND-2 → MOTIVATION-GO-LIVE.

---

## Working rules from now on (permanent)
- **Never break the main flows.** Before merging anything: sign-in tests pass on staging.
- **Production-only settings** (HSTS, HTTPS redirect, secure cookies, strict CSP, service worker caching) must be switched by environment, never hard-coded.
- Every change: preview link → Thomas tests on his phone → merge → staging updates automatically.
- If a change breaks staging, roll back first (Vercel "Promote previous deployment"), fix second.
