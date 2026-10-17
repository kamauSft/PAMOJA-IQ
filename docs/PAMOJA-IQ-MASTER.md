# PAMOJA IQ — MASTER INSTRUCTIONS FOR CURSOR (one file, version 2)

**How Thomas uses this file:**
1. Save it as `C:\Users\USER\pamoja-iq\docs\PAMOJA-IQ-MASTER.md`.
2. In Cursor (folder `C:\Users\USER\pamoja-iq`), press **Ctrl + I**, choose **Agent**, and type:
   **`Stop all other work. Read @docs/PAMOJA-IQ-MASTER.md completely. Start with Part 0, Step A. Do one step at a time, explain in plain words, and wait for my OK after each.`**

**For the Cursor Agent:** this one file replaces every other instruction file except `docs/SPEC.md` (the long-term product spec). Where they disagree, the order of authority is: **Part 0 > Part 1 > Part 2 > Part 4 > Part 3 > Part 5 > SPEC.md**. **Part 0 sets the order of work**; the other parts hold the detail for each step.

**Contents**
- Part 0: Permanent rules, current state, and the ORDER OF WORK (start here)
- Part 1: Repair plan (what's wrong, and the order of work)
- Part 2: Stability (no more "insecure"/"offline", real HTTPS staging site)
- Part 3: Fixes (member sign-in, 3 attempts + treasurer unlock, daily message)
- Part 4: Personal motivation from each member's balances + going live
- Part 5: Round 2 (premium design, adding members with temporary PINs, reminders, Excel, security hardening)
- Part 6: The official Excel upload template


---

# PART 0: PERMANENT RULES, CURRENT STATE, AND ORDER OF WORK (start here)

## 0.1 Who you are working for
Thomas Kamau (GitHub `kamauSft`) is building **Pamoja IQ**, "Intelligent Chama Solution", as his business: a secure web app where a chama treasurer uploads the group's records and **each member sees only their own** savings, loans, fines and statements. This is his livelihood. He is not a developer. Speak plainly, keep answers short, run every command yourself, and never leave him to debug.

## 0.2 Permanent rules (also save them as a Cursor rules file in Step A)
1. `docs/PAMOJA-IQ-MASTER.md` is the plan. Follow **Part 0's order**. Never skip ahead or start unrequested features.
2. **One step at a time.** Before a step: a 3–5 line plan, wait for "OK". After a step: tests pass, plain-words summary, screenshots (phone + desktop) when anything visible changed, a 3–6 point checklist, then **stop and wait for "OK"**.
3. **The product is the Next.js app in `app/` with a database.** Never put sign-in, PIN checks, sessions, locks, uploads or member data in browser-only code, `localStorage`, or static hosting (GitHub Pages). The `web/` folder may only be a **demo with sample data and no login**.
4. **PINs are checked on the server only** (argon2id + pepper). Members 6 digits, officials 8 digits, weak PINs rejected. **3 wrong tries locks the account until the treasurer or chair unlocks it.** No built-in PIN that bypasses locks or resets.
5. **A member sees only their own numbers.** Never show one member another member's name, phone or figures. The `?door=` link only changes labels; the signed-in account decides access, on the server.
6. **Design:** serious, bank-grade (navy, white, hairline borders, IBM Plex, aligned money), **with warm photographs where Step C says**. No bubbles, no floating circles, no confetti, no cartoon illustrations, no goal photos.
7. **Keep the daily motivational message**: calm, Kiswahili and English, based on the member's own figures, never shaming, never encouraging borrowing, no amounts on the phone lock screen.
8. **Never hard-code real phone numbers, PINs or secrets.** Secrets only in `.env` (local) or Vercel environment variables. The owner's account comes from `OWNER_NAME` / `OWNER_PHONE`.
9. If Thomas asks for something that conflicts with these rules, **say so in one sentence, offer the safe way, and ask** before acting. Example: he asks for "a link" → give the Vercel link, never GitHub Pages for the real app.
10. If a step breaks something, **revert first, fix second**.

## 0.3 Current state (from an independent code review of commit `373e14d`, 17 Oct 2026)
- **Real app (`app/`, Next.js + Prisma):** money maths in `lib/finance` (integer cents), sign-in with server sessions, `?door=` only changes labels (good). Still wrong: lockout 5 tries / 15 minutes (`lib/auth/session.ts`), demo PIN 4 digits, daily message removed, not deployed anywhere, owner's number pre-filled in `app/login/page.tsx`.
- **Static site (`web/`, published to `kamausft.github.io/PAMOJA-IQ`):** unsafe and must not be used for real people:
  - the treasurer PIN is an unsalted SHA-256 of 8 digits in public code (cracked in about 2 minutes on one laptop core);
  - the session is a `sessionStorage` flag anyone can forge;
  - all names, phones and balances are in the public bundle;
  - a hard-coded "start PIN" overrides any reset or lock;
  - PINs, locks and Excel uploads exist only in one browser;
  - `bubbles.jsx` is back.
- **Repo is public.** The owner's phone number is in the code. No `.env` or database was ever committed.
- `docs/DECISIONS.md` and `docs/CHANGELOG.md` wrongly say "no daily word". Correct them in Step A.
- Thomas likes the **photographs** in `web/src/photos/` (`chama-meeting.jpg`, `treasurer-desk.jpg`, `member-morning.jpg`). They look AI-generated; they may be used as illustrative images (Step C).

## 0.4 ORDER OF WORK (each step: plan → OK → build → test → summary → OK)

### Step A: Rules, notes and containment
1. Create `.cursor/rules/pamoja.mdc`:
   ```
   ---
   description: Permanent rules for Pamoja IQ
   alwaysApply: true
   ---
   (paste the 10 permanent rules from Part 0.2 of docs/PAMOJA-IQ-MASTER.md here, word for word)
   ```
2. Correct `docs/DECISIONS.md` and `docs/CHANGELOG.md`: the daily motivational message is **wanted**; only bubbles, confetti and goal photos stay removed; the real product is the Next.js app; `web/` is demo-only.
3. Remove the owner's phone from the whole repo (code, docs, tests). Nothing pre-fills a phone number on sign-in.
4. Delete `web/src/bubbles.jsx` and its use.
5. Commit and push.

### Step B: Turn the GitHub site into a safe demo (or remove it)
1. Strip `web/` of **all** sign-in, PIN, reset, lock, session and upload code (`auth.js`, `excel.js`, reset pages).
2. The demo has: the landing page with photographs, and two buttons **"See the member demo"** and **"See the treasurer demo"** that open sample screens directly, with a visible **"Demo · sample data"** label on every screen and a button **"Open the real app"** (the Vercel link, once it exists).
3. Only invented names and numbers. Use clearly fake phone numbers in the `0700 000 0xx` style, never real-looking customer numbers.
4. Serious design from Part 5 Change 2, with photos per Step C.
5. Guide Thomas to make the repo **Private** (Settings → General → Danger Zone → Change visibility). If his GitHub plan can't serve Pages from a private repo, move the demo into the real app at `/demo`, delete `.github/workflows/pages.yml`, and guide him to **Settings → Pages → Unpublish**.

### Step C: Photographs and the appealing look in the REAL app (`app/`)
1. Copy the three photos into `public/images/`, converted to WebP, each under 200 KB, with phone and desktop sizes; display with `next/image`, lazy-loaded except the landing hero.
2. Placement:
   - **Landing page:** `chama-meeting` as a full-width hero with a dark navy overlay (≥ 60% opacity behind text for contrast), headline "Clear, private records for every chama member.", one sentence, buttons **Sign in** and **For treasurers**; then three feature rows; a security note; footer.
   - **Treasurer sign-in and treasurer desk:** slim `treasurer-desk` banner (about 160 px on phone, 220 px on desktop) with the chama name.
   - **Member sign-in and member home:** slim `member-morning` banner with the member's first name and the daily **"Today"** message over it.
   - **No photos** inside tables, statements, forms, the Excel preview or settings.
3. Meaningful `alt` text for every photo. Record each photo's source in `docs/ASSETS.md` and that it is illustrative/AI-generated; plan to replace with real pilot-chama photos (with written consent) later.
4. Keep everything else from Part 5 Change 2 (navy/white, IBM Plex, tables, sidebar for treasurer, bottom tabs for members, dark mode, 375 px phone width, AA contrast).
5. Screenshots of landing, treasurer desk and member home, phone and desktop. Wait for "OK".

### Step D: Stability and the real HTTPS link (Part 2)
1. `start-pamoja.bat`, `stop-pamoja.bat`, `/health`, production-only HTTPS/secure cookies/HSTS, no service-worker "offline" page in development.
2. Switch Prisma to **PostgreSQL** for staging/production with migrations.
3. **Deploy the real app to Vercel + Neon Postgres** as **staging** (demo data, `DEMO_MODE=true`). Guide Thomas click by click: vercel.com → Continue with GitHub → Add New Project → PAMOJA-IQ → Storage → Neon → Environment Variables (you generate values; he pastes them only into Vercel) → Deploy.
4. Playwright sign-in tests against localhost and the staging URL in GitHub Actions.
5. Give Thomas the staging link (padlock), demo logins, and a checklist. Update the demo's "Open the real app" button to this link.

### Step E: Sign-in and members done right (Part 3 Fix A + Fix B, Part 5 Change 3)
1. Members 6-digit PIN, officials 8-digit; weak-PIN blocklist; argon2id + `PIN_PEPPER`.
2. **3 wrong tries → locked until treasurer/chair unlocks** (step-up PIN; "Unlock only" or "Unlock and issue temporary PIN"); dashboard alert for locked accounts; audit log.
3. Treasurer adds members one at a time or from the Excel Members sheet; temporary PIN shown once with **Copy invite message** and **Download invite slips (PDF)**; forced PIN change at first sign-in; reset PIN; login status per member.
4. Owner account from `.env`/Vercel variables; demo accounts only on staging.
5. Tests: member can never open treasurer pages by door or URL (404 or redirect to `/me`); member never sees another member's data.

### Step F: Excel upload and publishing to members (Part 5 Change 5, SPEC Part 11)
Official template (Part 6) served by "Download template"; importer reads exactly its sheets and headers; preview → fix → **Publish to members**; each member gets only their own figures; undo; audit.

### Step G: Personal daily motivation and reminders (Part 4A, Part 3 Fix C, Part 5 Change 4)
Daily "Today" message from each member's own figures (Kiswahili + English, calm, never encourages borrowing); reminders before/on/after due dates; notification centre; web push on the HTTPS site (no amounts on the lock screen by default).

### Step H: Security hardening (Part 5 Change 6) and `docs/SECURITY-REVIEW.md` in plain words.

### Step I: Production go-live (Part 4B), only after Thomas approves staging
Separate production project/database, `DEMO_MODE=false`, no demo accounts, privacy notice and terms pages, backups, pilot with one real chama.

## 0.5 Definition of done (every step)
- Works on the **staging HTTPS link on Thomas's phone** (from Step D onward), not only on localhost.
- Automated tests pass in GitHub Actions.
- `docs/CHANGELOG.md` updated in plain words.
- Thomas receives: link, demo logins (never his real PIN), screenshots if visual, a 3–6 point checklist; you wait for "OK".

## 0.6 How to talk to Thomas
- Short, plain, no jargon. Say what changed, what to click, what he should see.
- Never ask him to paste PINs or secrets into chat.
- If something can't be done safely the way he asked, say why in one sentence and offer the safe way.

---

# PART 1: REPAIR PLAN (background and detail; Part 0 sets the order)

### Instructions for the Cursor Agent

An independent review of the public repo `kamauSft/PAMOJA-IQ` (commit `f672ef0`) found the problems below. This file **overrides all other docs** until every step is done. Work in order. After each step: tests pass, commit, push, tell Thomas in plain words what changed and what to check, and **wait for "OK"**.

#### What the review found
1. **The GitHub Pages site is not secure and must not be used.** `web/` is a separate static React app published to `kamausft.github.io/PAMOJA-IQ`:
   - The PIN check runs in the browser. `web/src/auth.js` contains an unsalted SHA-256 of a 4-digit PIN; it was reversed to **4917** in milliseconds.
   - All names, phone numbers and balances are in `web/src/data.js`, downloadable by anyone without signing in.
   - "Signed in" is just a `sessionStorage` flag; anyone can set it in the browser console.
   - `/reset` lets anyone set a new PIN with no proof of identity.
   - One account opens both member and treasurer views, and the member page links to the treasurer desk, which shows every member's phone and savings. This breaks the core promise (Part 11: a member sees only their own numbers).
   - Lockout is per browser and can be undone with "Restore".
2. **The repo is public.** All code, docs and the owner's personal phone number are visible to anyone. No `.env` or database was ever committed (good).
3. **The owner's real phone number is hard-coded** in `web/src/data.js`, `web/src/auth.js`, `web/src/App.jsx` (shown on the public landing page) and `app/login/page.tsx` (pre-filled on the treasurer door).
4. **Two codebases.** `web/` duplicates the real Next.js app with fake logic. Everything must live in the one real app.
5. **The real app has not received the latest instructions.** `docs/` only has SPEC, Part 5 (old copy), CHANGELOG, DECISIONS, DEPLOY. All newer instructions are now in this one file (Parts 2–6).
6. **Rules not applied yet in the real app:**
   - Lockout is 5 attempts / 15 minutes (`lib/auth/session.ts`), not **3 attempts then treasurer/chair unlock** (Part 3 Fix B).
   - Commit `948ff43` removed the daily message ("daily words"); the owner **wants it back** (Part 3 Fix C, Part 4A).
   - Demo PIN is still 4 digits (2580); members need 6 digits, officials 8 (Part 5 Change 3).
   - Not deployed to a real server; only localhost (STABILITY Step 3).
7. Good news to keep: `?door=` in the real app only changes labels; the server decides access. Money maths is in `lib/finance`, cents as integers. Keep all of that.

---

### Step 0: Contain the exposure (SUPERSEDED by Part 0 Steps A–B: keep `web/` only as a no-login demo instead of deleting it)

1. **Take the static site down.** Delete `.github/workflows/pages.yml` and the whole `web/` folder. Then guide Thomas: GitHub repo → **Settings → Pages → Unpublish site** (or set Source to "None"). Confirm `kamausft.github.io/PAMOJA-IQ` no longer loads.
2. **Remove the owner's phone number from the code.** `app/login/page.tsx` must not pre-fill any number. The owner's account comes only from `.env` (`OWNER_NAME`, `OWNER_PHONE`), as in the earlier instruction. Search the whole repo for the owner's phone number and remove every occurrence.
3. **Make the repo private.** Guide Thomas: **Settings → General → Danger Zone → Change repository visibility → Private**. (The number remains in old commits; once private, only Thomas sees them. Tell him whether a history rewrite is worth it; default: not needed once private.)
4. Tell Thomas: the practice PIN 4917 was public and is now dead; never reuse it; never paste PINs into chats.
5. This single file contains every instruction (Parts 1–5 below). Keep it as `docs/PAMOJA-IQ-MASTER.md`. Create the template in Part 6 exactly as described in **Part 6** (or copy it from `C:\Users\USER\Downloads` if Thomas downloaded it), commit, push. Delete or mark as superseded any older instruction files in `docs/` except `SPEC.md`.

Rule from now on: **no app logic, PIN checks or member data ever in browser-only code or static hosting.** Only the Next.js server app with a database.

---

### Step 1: Stability and a real HTTPS link (Part 2, all steps)

- `start-pamoja.bat` / `stop-pamoja.bat`, `/health` page, production-only HTTPS/secure-cookie/HSTS settings, no service-worker "offline" page in development.
- **Deploy the real app to Vercel + Neon Postgres** as staging, demo data only, HTTPS padlock. Guide Thomas click by click. This replaces GitHub Pages for good.
- Playwright sign-in tests run against localhost **and** the staging URL in CI.

### Step 2: Sign-in done right (Part 3 Fix A + Fix B, Part 5 Change 3)
- Members 6-digit PIN, officials 8-digit; weak PINs rejected; argon2id + pepper.
- **3 wrong attempts → locked until the treasurer or chair unlocks** (with step-up PIN; "Unlock only" or "Unlock and issue temporary PIN"). Change `PIN_MAX_ATTEMPTS` and remove the 15-minute auto-unlock.
- Treasurer adds members one by one or from the Excel Members sheet; temporary PIN shown once with "Copy invite message"; forced PIN change at first sign-in; reset PIN; login status per member.
- Owner account from `.env`. Demo accounts on staging only.
- **One account = one role per chama.** A member account must never open the treasurer desk, whichever door or URL is used (test it).

### Step 3: Look and feel (Part 5 Change 2)
Serious, bank-grade design exactly as written in Part 5 Change 2 (navy, white, hairline borders, IBM Plex, tabular money, sidebar for treasurer, bottom tabs for members). Photographs are wanted: follow **Part 0, Step C** exactly (hero on the landing page, slim banners on sign-in, treasurer desk and member home; none inside tables, statements or forms).

### Step 4: Excel (Part 5 Change 5)
Use the template in Part 6 as the official format, "Download template" serves it, importer reads exactly its sheets and headers, preview → Publish to members, privacy rules (Part 11).

### Step 5: Motivation and reminders
- Bring back the daily "Today" message, **personal to each member's balances** (Part 4A, Part 3 Fix C). Calm tone, Kiswahili + English, never encourages borrowing, no amounts on the lock screen.
- Reminders and notification centre (Part 5 Change 4), web push on the HTTPS staging site.

### Step 6: Security hardening (Part 5 Change 6) and the security review document.

### Step 7: Production go-live (Part 4B), only after Thomas says the staging site is right.

---

### Definition of done for every step
- Works on the **staging HTTPS link on Thomas's phone**, not just localhost.
- Automated tests for it pass in GitHub Actions.
- `docs/CHANGELOG.md` updated in plain words.
- Thomas gets: link, demo logins (never his real PIN), a 3–6 point checklist, and waits-for-OK.

---

# PART 2: STABILITY

### Instructions for the Cursor Agent

This is the owner's livelihood. He keeps seeing **"Not secure"** and then **"offline"** when he opens the app, and cannot test reliably. **Pause every other task** (commit unfinished work to its branch first). Nothing new gets built until the app is stable, reachable on a real HTTPS address, and members and the treasurer can sign in every time.

Rules: diagnose before changing; tell Thomas the root cause of each problem in one plain sentence; run all commands yourself; one branch `fix/stability`; tests must pass; then give him links and a short checklist and wait for "OK". Never ask him to debug.

---

### Step 1: Find out why it says "insecure" and "offline" (report, then fix)

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

### Step 2: Make local testing reliable on Windows

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

### Step 3: A real, always-on HTTPS address (the serious solution)

Thomas must not depend on localhost to test or demo. Deploy a **staging** site now, before more features.

- Hosting: **Vercel** (free tier, HTTPS automatic) + **Neon Postgres** (free tier, from Vercel Storage). Switch Prisma to PostgreSQL for staging/production with migrations.
- Staging runs with `DEMO_MODE=true` and demo data so Thomas can test anywhere, on his phone too. Address like `pamoja-iq-staging.vercel.app` or the project's default `*.vercel.app` URL.
- Production (real members) comes later, separately, with `DEMO_MODE=false` and no demo accounts (see Part 4B).
- Guide Thomas **one click at a time** (wait for "done" after each):
  1. vercel.com → Sign up → **Continue with GitHub** (kamauSft).
  2. **Add New → Project** → import **PAMOJA-IQ** → don't deploy yet.
  3. **Storage → Create → Neon Postgres** → connect it to the project.
  4. **Settings → Environment Variables**: you generate the values and give him a list to paste (`SESSION_SECRET`, `PIN_PEPPER`, `CRON_SECRET`, `DEMO_MODE=true`, others). Secrets go only into Vercel, never into chat or GitHub.
  5. **Deploy**.
- After deploy: run migrations + seed on staging, open the site yourself (via HTTP requests/Playwright against the live URL), and verify: home page, `/health`, treasurer sign-in, member sign-in, Excel upload with the template, member sees only own data, security headers present, padlock (HTTPS) shown, no service-worker "offline" page.
- Every future pull request gets an automatic **preview link**, so Thomas tests changes on a real HTTPS link.

---

### Step 4: Prove sign-in works every time

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

### Step 5: Hand over to Thomas

Give him, in plain words:
1. The **root cause** of "insecure" and "offline" (one sentence each).
2. The **staging link** (HTTPS, works on his phone) and demo logins.
3. How to run it on his PC: double-click `start-pamoja.bat`.
4. A 5-point checklist to confirm everything works.
5. What "Not secure" means: on `http://localhost` it is normal and harmless; on the staging and live sites he must see the **padlock**.

Then wait for "OK" and continue with the order of work in Part 1.

---

### Working rules from now on (permanent)
- **Never break the main flows.** Before merging anything: sign-in tests pass on staging.
- **Production-only settings** (HSTS, HTTPS redirect, secure cookies, strict CSP, service worker caching) must be switched by environment, never hard-coded.
- Every change: preview link → Thomas tests on his phone → merge → staging updates automatically.
- If a change breaks staging, roll back first (Vercel "Promote previous deployment"), fix second.

---

# PART 3: FIXES (login, 3 attempts + unlock, daily message)

### Instructions for the Cursor Agent

This part **overrides** `docs/SPEC.md` and Part 5 wherever they disagree. Pause any unfinished Round 2 work (commit it to its branch first so nothing is lost), then do these fixes in order. One branch per fix, tests passing, PR, then give Thomas the `http://localhost:3000` link and a short checklist, and **wait for "OK"**.

---

### Fix A: Members cannot sign in (urgent)

The owner reports that **members cannot log in**. Find the real cause before changing code.

1. **Reproduce it** with a Playwright test and by hand: sign in as member Amina Hassan `0712345005`. Capture the server log, the network response, any redirect, and any error on screen.
2. **Check these causes one by one** and report which it was:
   - The seeded member PIN changed (e.g. from `2580` to `258025`) but the login page hint, README or test still show the old one.
   - The member is stuck in the **"must change temporary PIN"** state, or the temporary PIN has expired.
   - The member account is **locked** from earlier testing.
   - Phone number stored in a different format from what the form sends (use `normalizePhone()` everywhere).
   - PIN length rule: the form or validator still expects 4 or 8 digits for members instead of 6.
   - After a successful login, the member is **redirected to a treasurer page** and gets 404/blocked, or a redirect loop between `/login` and `/me`.
   - The member home page **crashes** when the member has no published data yet, a missing loan, or empty notifications.
   - Session cookie not saved on `http://localhost` (`Secure` flag must be off in development, on in production; `__Host-` prefix only in production).
   - Member's `status` is not `Active`, or the membership isn't linked to the chama.
3. **Fix the cause.** Then make sure every sign-in failure shows a clear message on screen (never a silent failure or blank page).
4. **Reset the demo accounts** so Thomas can test immediately, and print them clearly in the console after `npm run seed` and in the README:
   - Treasurer Peter Otieno `0712345002`, PIN `25802580`
   - Member Amina Hassan `0712345005`, PIN `258025`
   - New member (never signed in) with a temporary PIN shown in the console, to test first sign-in and PIN change.
5. Add a dev-only command: `npm run unlock -- 0712345005` (unlocks and resets failed attempts; refuses to run in production).
6. **Tests:** member signs in and lands on the member home; treasurer signs in and lands on the dashboard; new member is forced to change the temporary PIN, then reaches home; member home loads with no data.
7. Tell Thomas the root cause in one or two plain sentences.

---

### Fix B: 3 attempts, then only the treasurer can unlock

Replace the timed lockout rules (Round 2 Change 3 and Change 6.1 "locked 15 minutes, doubling") with:

#### Rules
- A user gets **3 PIN attempts**. The sign-in screen shows what's left: "Incorrect phone number or PIN. 2 attempts left."
  (Keep the same wording whether the phone exists or not, to avoid revealing members; for an unknown number, count attempts against the device/IP and show the same message.)
- After the **3rd wrong attempt** the account is **locked until unlocked by the treasurer or chair**. No automatic unlock.
- Locked screen: "Your account is locked after 3 incorrect attempts. Ask your treasurer to unlock it." (No phone numbers or names of officials shown.)
- A successful sign-in resets the counter to 0.
- **Officials** (treasurer/chair/secretary) get the same 3 attempts. A locked treasurer is unlocked by the chair, and vice versa. If **all** officials are locked, the platform admin can unlock via a protected command `npm run unlock -- <phone>` on the server (logged in the audit log).

#### Treasurer screens
- Members list shows a red **Locked** label and a filter "Locked accounts".
- Dashboard alert: "2 member accounts are locked" with a link.
- **Unlock** button on the member row. Clicking it:
  1. asks the treasurer to re-enter their own PIN (step-up check);
  2. offers two choices: **"Unlock only"** (member keeps their PIN) or **"Unlock and issue a temporary PIN"** (for a member who forgot their PIN; shows the new temporary PIN once with the Copy invite message button, and the member must set a new PIN at sign-in);
  3. records who unlocked, when, and why (optional note) in the audit log.
- The member gets a notification: "Your account was unlocked by the treasurer on 17 Oct, 10:42."

#### Notifications
- Treasurer and chair get an in-app + push alert when any account is locked: "Amina Hassan's account was locked after 3 incorrect attempts."
- If **5 or more accounts** are locked within 1 hour, alert the chair as a possible attack, and turn on the CAPTCHA on the login page for everyone for the next hour.

#### Keep from Change 6
IP rate limiting, CAPTCHA after repeated failures from one device/IP, identical error messages, new-device alerts and the audit log all stay as specified.

#### Tests
3rd wrong PIN locks the account; 4th attempt with the correct PIN is still refused; unlock by treasurer restores access; "Unlock and issue temporary PIN" forces PIN change; a member cannot unlock anyone; a treasurer cannot unlock without the step-up PIN; the lock and the unlock both appear in the audit log; the locked-count alert shows on the dashboard.

---

### Fix C: Bring back the daily motivational message (calm, premium style)

Round 2 Change 1 removed the motivational messages by mistake. **The owner wants them.** Restore or rebuild them, in the new serious design. (If the old code was deleted, rebuild from this section; spec Part 10 is replaced by this.)

#### Where and how it looks
- On the **member home page**, a small, quiet panel near the top titled **"Today"** (no emojis, no confetti, no animation): one short line in the brand's body font, with the meaning underneath in muted text when it's a proverb.
  Example:
  > *Haba na haba hujaza kibaba.*
  > Little by little fills the measure.
- Optional one-line personal note under it, computed from the member's real data (calm tone, never shaming):
  - "You have paid on time for 14 months in a row."
  - "Your October contribution of KES 2,000 is due on 5 Oct."
  - "A new month is a fresh start. Every contribution counts."
- A small **"Another"** text link to show a different message, and a bookmark icon to **save** favourites (shown in Profile → Saved messages).
- Treasurer's dashboard can show the same "Today" line at the top (optional setting).

#### Timing and channels
- A new message each day at **05:00 Africa/Nairobi** (in-app).
- Optional **daily push notification at 07:00**, **off by default**; member turns it on in Profile → Notifications. The push text is only the proverb or line, never amounts or names.
- Language follows the member's choice: **Kiswahili, English, or both**.

#### Content
- Create `/content/daily-messages.ts` with **at least 120 messages**, each with: `id`, `sw`, `en`, `theme` (saving, patience, togetherness, discipline, starting small, progress, fresh start), `type` (proverb | original).
- Use **traditional Swahili/African proverbs (methali)** with their meaning, for example:
  - *Haba na haba hujaza kibaba.* Little by little fills the measure.
  - *Kidole kimoja hakivunji chawa.* One finger cannot crush a louse; we need each other.
  - *Bandu bandu huisha gogo.* Chip by chip, the log is finished.
  - *Mchumia juani hulia kivulini.* Who works in the sun eats in the shade.
  - *Polepole ndio mwendo.* Slowly but surely is the way.
  - *Usipoziba ufa utajenga ukuta.* If you don't fix a crack, you'll rebuild a wall.
  - *Akiba haiozi.* Savings never rot.
- Plus **original lines written for Pamoja IQ** (write them yourself), e.g. "Every shilling you set aside today is a promise kept to your future self."
- **Do not use quotes copied from books, songs, films, or famous people.** Only traditional proverbs or original text.
- Each message under 160 characters.

#### Selection rules
- Random, but **no repeat for the same member within 60 days**; store in `DailyMessage` (membershipId, date, messageId, savedAt?).
- Pick the theme from the member's situation: behind on payments → "fresh start"; on a long streak → "progress"; otherwise rotate themes.
- Daily job is idempotent (never two messages for the same member on the same day).

#### Tests
No repeats within 60 days; correct language; personal line uses real numbers from `/lib/finance`; push text has no amounts or names; push is off by default; "Another" and "Save" work.

---

### Also update the documents
- In Part 5: change Change 1 so it **no longer removes** motivational messages, and replace the lockout rules in Change 3 and Change 6.1 with a pointer to Fix B.
- In `docs/SPEC.md`: mark Part 10 as "Replaced by Part 3 Fix C".
- Add all three fixes to `docs/CHANGELOG.md`.

### Order
1. **Fix A**: members can sign in (tell Thomas the root cause)
2. **Fix B**: 3 attempts, treasurer unlocks
3. **Fix C**: daily motivational message
4. Then continue Round 2 where it stopped.

(Follow the order of work in Part 1.)

---

# PART 4: PERSONAL MOTIVATION + GOING LIVE

### Instructions for the Cursor Agent

This part adds to Part 3 (Fix C, daily message) and overrides it where they differ. Same working rules as before: branch per part, tests passing, PR, link + checklist for Thomas, **wait for "OK"**. Thomas is not a developer: run everything yourself, explain in plain words, and tell him exactly which buttons to click when a step needs his account.

---

### Part 4A: Motivation that responds to each member's own numbers

The daily "Today" panel (Fix C) becomes **personal**: the message is chosen from the member's real balances and history, not just at random.

#### 1.1 How it works
- Build `/lib/motivation/engine.ts`: a **deterministic, rule-based** engine. Input: the member's figures from `/lib/finance` (savings, this month's status, streak, goals, loan, fines, history). Output: the single best message for today plus an optional proverb.
- **All numbers come from `/lib/finance`.** No AI writes numbers. (Optional later: AI rephrasing behind `ENABLE_AI_MOTIVATION=false`, given only the finished message and never raw data.)
- Messages are templates in `/content/motivation-templates.ts` with `sw` and `en` versions and variables, e.g. `{firstName}`, `{savings}`, `{streak}`, `{goalName}`, `{goalPercent}`, `{amountLeft}`, `{dueDate}`.
- Recalculate after every treasurer **Publish** and every morning at 05:00 Africa/Nairobi.

#### 1.2 Situations and example messages (pick the highest-priority one that applies)

| Priority | Situation (from the member's data) | Example (English; Kiswahili version also needed) |
|---|---|---|
| 1 | Loan fully repaid (this week) | "Loan cleared, {firstName}. You paid back every shilling. Well done." |
| 2 | Savings crossed a milestone (10k, 25k, 50k, 100k, 250k, 500k, 1M) | "You've passed KES {milestone} in savings. That's {months} months of steady effort." |
| 3 | Goal reached / passed 25, 50, 75% | "{goalName} is {goalPercent}% there. KES {amountLeft} to go." |
| 4 | Paid this month before the due date | "October paid early. Your savings now stand at KES {savings}." |
| 5 | On-time streak of 3+ months | "{streak} months on time in a row. Consistency is your strength." |
| 6 | Savings grew vs 3 months ago | "Your savings grew by KES {growth} in the last 3 months." |
| 7 | Loan more than half repaid | "Your loan is {loanPercent}% repaid. KES {loanLeft} left." |
| 8 | Contribution due in the next 3 days, unpaid | "Your October contribution of KES {amount} is due on {dueDate}." |
| 9 | Overdue (gentle, never shaming) | "A new week, a fresh start. Bringing October up to date keeps your record strong." |
| 10 | Unpaid fine | "Clearing your KES {fine} fine keeps your account fully up to date." |
| 11 | Joining anniversary | "One year with Umoja today. You've saved KES {savings} since you joined." |
| 12 | No new data / nothing special | A proverb with its meaning (Fix C list), plus "Your savings: KES {savings}." |

Write **at least 3 variations** per situation (in both languages) so the same wording doesn't repeat for 30 days.

#### 1.3 Tone rules (must follow)
- Warm, calm, respectful. **Never shame, threaten, or guilt** a member who is behind.
- **Never compare a member with named members** or rank them. Group comparisons only as anonymous totals ("the group reached 92% on-time this month").
- **Never encourage borrowing.** Don't use "You can now borrow KES X" as motivation. Borrowing limits appear only on the Loan page, stated neutrally.
- No investment or financial advice, no promises of returns.
- No emojis, no exclamation overload (max one per message).

#### 1.4 Where it appears
- Member home: **"Today"** panel with the personal message on top and the proverb (if any) underneath, in the calm design.
- After the treasurer publishes new data: a one-time in-app highlight ("Your account was updated. Savings: KES 34,000, up KES 2,000.").
- Milestones (loan cleared, savings milestone, goal reached) also create an in-app notification.

#### 1.5 Push notifications (live on the phone)
- Daily motivation push at **07:00 EAT**, plus milestone pushes. **Members choose** in Profile → Notifications: *Daily motivation* (default **on** once they allow notifications), *Milestones* (default on), *Payment reminders* (default on).
- **Lock-screen privacy:** push text never contains amounts, balances or other people's names. Use wording like:
  - "Good morning, Amina. You reached a savings milestone. Open Pamoja IQ to see it."
  - "Your loan is fully repaid. Well done."
  - Proverb-only push: "Haba na haba hujaza kibaba."
  A setting **"Show amounts in notifications"** (default **off**) lets a member choose to see figures.
- Max **one** motivation push per day; milestone pushes don't count toward that but max 2 per day total. Quiet hours 20:00–07:00.
- Tapping the push opens the member home after sign-in.

#### 1.6 Tests
For a set of sample members (early payer, long streak, overdue, loan almost done, new member with no data): correct situation chosen; numbers match `/lib/finance`; Kiswahili and English both render; no amounts in push text unless the member opted in; no borrowing encouragement; no repeat wording within 30 days; one daily push max.

---

### Part 4B: Put Pamoja IQ live on the internet

Goal: a real web address members can open on their phones, with push notifications working (push needs HTTPS, which going live provides).

#### 2.1 Before going live (Cursor checks and fixes these first)
- Fix A (login), Fix B (3 attempts + unlock) merged and working.
- From Round 2 Change 6, at minimum: security headers, rate limiting, CAPTCHA keys support, step-up PIN for treasurer actions, production guard (refuses `DEMO_MODE=true`, missing secrets, or seed in production), audit log.
- Prisma switched from SQLite to **PostgreSQL** for production (keep SQLite for local dev only if easy; otherwise use Postgres for both). Migrations created and tested.
- **No demo accounts in production.** Thomas's account is created from `OWNER_NAME` / `OWNER_PHONE` environment variables with a temporary PIN shown once.
- `docs/DEPLOY.md` written in plain language.

#### 2.2 Hosting choice
- **Vercel** for the app (free tier to start, sign in with GitHub, live HTTPS address like `pamoja-iq.vercel.app`).
- **Neon Postgres** for the database (free tier; add it from Vercel's Storage/Marketplace so `DATABASE_URL` is set automatically).
- **Vercel Cron** for the daily jobs: reminders and motivation at **04:00 UTC = 07:00 EAT**, message preparation at **02:00 UTC = 05:00 EAT**. Protect cron routes with a `CRON_SECRET`.
- Every pull request automatically gets its own **preview link**, so Thomas can test changes on his phone before they go live.

#### 2.3 What Thomas must click (guide him step by step, one step at a time, wait for "done")
1. Go to **vercel.com** → **Sign up** → **Continue with GitHub** (account kamauSft).
2. **Add New → Project** → import **PAMOJA-IQ**. (If it's not listed: "Adjust GitHub App permissions" → allow PAMOJA-IQ.)
3. In the project: **Storage → Create Database → Neon (Postgres)** → connect to the project.
4. **Settings → Environment Variables**: Cursor gives him the exact list and generates the secret values for him to paste (`SESSION_SECRET`, `PIN_PEPPER`, `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `OWNER_NAME`, `OWNER_PHONE`, `DEMO_MODE=false`, Turnstile keys when ready). Secrets are pasted only into Vercel, never into the chat or GitHub.
5. Click **Deploy**.
If the Vercel CLI is easier, Cursor may use `npx vercel` instead and walk him through the login.

#### 2.4 After the first deploy (Cursor does this)
- Run production migrations (`prisma migrate deploy`, via the build step).
- Create Thomas's owner account and show him the temporary PIN once.
- Smoke test the live site: home page, sign-in, forced PIN change, Excel upload in a test chama, member view, notifications permission prompt, push test to Thomas's phone, security headers present.
- Give Thomas: the live link, how to "Add to Home Screen" on Android and iPhone (needed for push on iPhone), and a checklist.

#### 2.5 Going-live safety
- Start with **one real chama** (pilot), real members invited by the treasurer.
- Daily automatic database backups (Neon) and a written restore test in `docs/DEPLOY.md`.
- Error monitoring hook on (Sentry free tier if Thomas wants it; otherwise logs).
- Custom domain (e.g. `pamojaiq.co.ke`) is a later step: document how, don't buy anything.
- Add a short **Privacy notice** page (Kenya Data Protection Act, 2019) and **Terms** page before inviting members.

#### 2.6 From now on
- Changes go: branch → PR → **preview link** (Thomas tests on his phone) → merge → **live automatically**.
- Never test with real members' data on preview links; previews use a separate preview database.

---

### Order
1. Finish any open fix (A, B, C) and Thomas's owner account.
2. **Part 1**: personal motivation + push.
3. **Part 2**: go live (pre-checks first, then guide Thomas through Vercel).

---

# PART 5: ROUND 2 (design, members & PINs, reminders, Excel, security)

### Instructions for the Cursor Agent

The owner tested the app and is not happy. This part **overrides docs/SPEC.md** wherever they disagree. Do exactly what is below, nothing extra. Keep everything else that already works (login, Excel import, member privacy, finance functions).

Work one change at a time on its own branch, run lint + typecheck + tests, commit, push, open a PR, then restart the app and give Thomas the `http://localhost:3000` link and a short checklist of what to click and what he should see. **Wait for "OK" before the next change.** When he says OK, merge the PR, pull `main`, continue.

Thomas is not a developer: explain in plain words, run all commands yourself.

---

### Change 1: Remove what the owner doesn't want

Delete completely (code, components, routes, database tables/fields if unused, seed data, tests, copy, spec references):
- **All bubble views** (landing page, treasurer dashboard, member page). No d3-force, no floating circles.
- ~~Morning motivational messages~~ **KEEP THEM**: see Part 3 Fix C (calm, premium style).
- **Confetti, celebration animations, emojis, playful illustrations, woven-basket textures.**
- Goal photo uploads (keep simple savings goals only if they already exist; no photos).

Mark spec Part 4 (bubble part) and the bubble parts of 6 and 7 as **REMOVED** (SPEC Part 10 is replaced by Part 3 Fix C) in `docs/SPEC.md` so no future agent re-adds them. Update `docs/CHANGELOG.md`.

---

### Change 2: A serious, premium look (banking-grade)

The current look is "not premium". Redesign every screen to feel like a **private bank / serious financial institution**: calm, precise, trustworthy. Think of a bank statement and a modern banking app, not a startup landing page.

#### Design rules
- **Palette** (define as CSS variables / Tailwind tokens, plus a designed dark mode):
  - `--navy` `#0F2A3D` (primary: header, primary buttons, headings)
  - `--ink` `#14202B` (body text), `--muted` `#5B6B78` (secondary text)
  - `--line` `#DCE2E7` (hairline borders), `--surface` `#FFFFFF`, `--canvas` `#F5F7F9` (page background)
  - `--accent` `#1E6F5C` (one restrained deep green for positive figures and the main action highlight)
  - Status only: paid `#1E6F5C`, due soon `#9A6B00`, overdue `#A33A2B`. Always paired with a text label, never colour alone.
- **Type:** `IBM Plex Sans` for everything, `IBM Plex Mono` (or Plex Sans with `tabular-nums`) for all money and tables. Loaded with `next/font`. Clear scale: 32 / 24 / 18 / 15 / 13 px. Headings weight 600, body 400.
- **Layout:** left sidebar for treasurer (Dashboard, Members, Upload Excel, Contributions, Loans, Fines, Reminders, Settings); simple top bar + bottom tab bar on phone for members (Home, Statement, Loan, Notifications, Profile).
- **Components:** flat white panels with 1px `--line` borders, 8px radius, **no heavy shadows, no gradients**. Dense, well-aligned tables with right-aligned numbers. Clear labels above inputs.
- **Money format:** `KES 24,000.00` in tables, `KES 24,000` in summaries; tabular figures; negatives in parentheses on statements.
- **Motion:** only subtle 150ms transitions on hover/focus. Nothing bouncing or floating.
- **Landing page (`/`):** short and serious. Logo wordmark "Pamoja IQ" with small "Intelligent Chama Solution" under it; one headline ("Clear, private records for every chama member."); one sentence; buttons "Sign in" and "For treasurers"; three plain feature rows (Upload records · Members see only their own account · Reminders before due dates); security note; footer. Full-width hero photograph (Part 0, Step C). No animation, no cartoon illustrations.
- **Login screen:** centred card, logo, "Phone number", "PIN" (masked, show/hide toggle), "Sign in", "Forgot PIN? Ask your treasurer to reset it." Demo hint only when `DEMO_MODE=true`.
- Accessibility: contrast AA, visible focus rings, 44px tap targets, works at 375px width.

---

### Change 3: Members are added by the treasurer, with a temporary PIN

#### Sign-in model (for now)
- **Everyone signs in with phone number + PIN.** SMS one-time codes are **postponed** (keep the `SmsProvider` interface but don't require SMS to log in).
- **Member PINs are 6 digits.** Officials (treasurer, chair, secretary): **8 digits**.
- Reject weak PINs: all same digit (`111111`), sequences (`123456`, `654321`), repeating pairs (`121212`), the phone number's last digits.
- Hash with argon2. **Lockout: 3 wrong tries, then locked until the treasurer/chair unlocks** (see Part 3 Fix B).

#### Treasurer adds a member (two ways)
1. **One at a time:** Members → **Add member** → Full name, Phone, Member No (auto-suggested next number, e.g. M021), Role, Join date → Save.
2. **In bulk from Excel:** the `Members` sheet of the upload template (Change 5). New rows create new members after the treasurer reviews and confirms.

#### Temporary PIN
- On creating a member, the system generates a **random temporary PIN** (6 digits for members, 8 for officials).
- It is shown to the treasurer **once**, on a confirmation screen, with:
  - **Copy invite message** button, giving text like:
    `Welcome to Umoja Savings Group on Pamoja IQ. Sign in at <app link> with your phone 0712 345 005 and temporary PIN 482913. You will be asked to choose your own PIN. Do not share it with anyone.`
  - **Download invite slips (PDF)** for bulk-created members (one slip per member: name, phone, temporary PIN, link; cut-out layout).
- Temporary PINs: stored only as a hash, **expire after 7 days**, single use.
- **First sign-in forces a PIN change:** member enters the temporary PIN → screen "Create your own 6-digit PIN" (enter twice) → then their home page. They cannot reach anything else until they change it.
- **Reset PIN:** Members → member row → **Reset PIN** → new temporary PIN shown once (same flow). Logged in the audit log.
- Member list shows each member's login status: **Not yet signed in / Active / Temporary PIN expired / Locked**, with a "Resend invite" (shows the copy message again with a new temporary PIN).
- Member can change their PIN anytime in Profile (needs current PIN).

#### Tests
Temporary PIN works once only; expires after 7 days; forced change before any other page; weak PINs rejected; lockout after 3 tries (Fix B); treasurer reset invalidates the old PIN; a member can never reset someone else's PIN.

---

### Change 4: Reminders and notifications

#### In-app notification centre (all users)
- Bell icon with unread count (top bar) and a **Notifications** page; mark as read / mark all read.
- `Notification` model: userId (membership), type, title, body, link, readAt, createdAt, channel(s) sent.

#### What members are notified about
| When | Message (example) |
|---|---|
| 3 days before contribution due date | "Your October contribution of KES 2,000 is due on 5 Oct." |
| On the due date (if unpaid) | "Your October contribution is due today." |
| 3 days after due (if unpaid), then weekly while unpaid | "Your October contribution is overdue. Please pay your treasurer." |
| 3 days before a loan instalment | "Loan instalment of KES 3,000 due on 10 Nov." |
| Treasurer publishes new records | "Your account was updated on 16 Oct. View statement." |
| Fine recorded | "A fine of KES 200 (late contribution) was added to your account." |
| PIN reset by treasurer | "Your PIN was reset by the treasurer. If this wasn't expected, contact your chair." |

#### What the treasurer/chair are notified about
- Weekly summary: collected vs expected this month, who is unpaid, loans overdue.
- A member signed in for the first time / is locked out.
- Upload published (who published, how many members updated).

#### Treasurer controls
- **Reminders** page: turn each automatic reminder on/off, set days before/after, set the due day (default 5th), preview the message text, and see a log of what was sent to whom and when.
- **"Remind unpaid members now"** button on the dashboard and contributions page: shows the list first, then sends.
- Reminders only go to members who actually owe, based on the latest published data.

#### Channels
- **Now:** in-app notifications + **browser push notifications** (Web Push, PWA, opt-in prompt after first login, works on Android Chrome; on iPhone after "Add to Home Screen"). Store push subscriptions; VAPID keys in `.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`); add to `.env.example`.
- **Later (build the interface, don't connect yet):** SMS via Africa's Talking and WhatsApp, behind `NotificationChannel` interface; dev version logs to console.
- **Privacy:** push and SMS text **never show amounts or other members' names** on the lock screen. Push says "You have a new message from Umoja Savings Group"; details show inside the app after sign-in. In-app notifications may show the member's own amounts.
- Quiet hours: nothing sent between 20:00 and 07:00 Africa/Nairobi; queued for 07:00.
- Scheduler: a daily job at 07:00 EAT (Vercel Cron / node-cron in dev) that is idempotent (never sends the same reminder twice for the same member, month and type).

#### Tests
Reminder goes only to unpaid members; no duplicates on re-run; quiet hours respected; push/SMS text contains no amounts or names; member sees only their own notifications.

---

### Change 5: The treasurer's Excel format (use the provided template exactly)

The file the template in Part 6 (`docs/pamoja-iq-upload-template.xlsx`) is **the official upload format**. Do this:
1. Copy it to `public/templates/pamoja-iq-upload-template.xlsx` and make the **"Download Excel template"** button on Upload Excel serve this exact file.
2. Make the importer read exactly these sheets and headers:
   - **Members:** `Member No | Full Name | Phone | Role | Join Date | Status`
   - **Contributions:** `Member No | Full Name | 2026-01 … 2026-12 | Total (KES)` (month columns are `YYYY-MM`; more months can be added to the right; `Total (KES)` is ignored)
   - **Loans:** `Member No | Loan Date | Amount Borrowed (KES) | Interest Rate (% per month) | Months | Purpose | Amount Repaid (KES) | Status | Total Due (KES) | Balance (KES)` (last two are formulas: ignore them; Pamoja IQ calculates its own)
   - **Fines:** `Member No | Date | Type | Amount (KES) | Paid (Yes/No)`
   - Ignore the **How to use** sheet.
3. Interest rate may arrive as `0.1` or `10` or `10%`: all mean 10% per month. Phones may arrive as text or number (missing leading 0): normalise to `+2547…`.
4. Skip fully empty rows. The example rows in the template (M001–M003 Umoja demo) import as normal data in demo mode.
5. Keep the existing **preview → fix → Publish to members** flow and all member-privacy rules (Part 11 of the spec).
6. Replace the fixtures in `/fixtures` with a filled copy of this template plus a "messy" variant, and update the import tests.
7. On the Upload page, show a short "How to fill the template" box (same points as the template's How to use sheet).

---

### Change 6: Security hardening (make the site hard to hack)

This app holds people's money records and phone numbers. Treat it like a banking app. Do every item below, then prove it with tests. Branch: `chore/security-hardening`.

#### 6.1 Login and accounts
- **Brute-force protection on three levels:**
  - per account: **3 wrong PINs → locked until the treasurer/chair unlocks** (see Part 3 Fix B);
  - per IP address: max 20 sign-in attempts per 15 minutes across all phones;
  - globally: if failed sign-ins spike (e.g. 100 in 10 minutes), require a CAPTCHA (**Cloudflare Turnstile**, free) on the login form for everyone for the next hour, and alert the treasurer/admin.
- Show a CAPTCHA after 3 failed attempts from the same device/IP.
- **Same error message for wrong phone and wrong PIN:** "Phone number or PIN is incorrect." Never reveal whether a phone number is registered (prevents harvesting member numbers). Same response time for both (constant-time compare, dummy hash on unknown phones).
- **Weak PIN blocklist:** besides Change 3 rules, reject the 100 most common PINs (e.g. 000000, 112233, 123123, 696969, birth-year patterns 19xxxx/20xxxx).
- PIN hashing: **argon2id** (memory 64 MB, iterations 3, parallelism 1) with a server-side **pepper** from `.env` (`PIN_PEPPER`).
- **Step-up check for sensitive actions:** treasurer/chair must re-enter their PIN (valid 5 minutes) before: Publish to members, Reset someone's PIN, Add/remove an official, Export data, Change chama rules or reminder settings, Undo an import.
- **New-device alert:** when someone signs in from a new browser/device, notify that user ("New sign-in on Chrome, Android, Nairobi area, 17 Oct 09:14. Not you? Ask your treasurer to reset your PIN.").
- **Sessions:**
  - cookie named `__Host-pamoja_session`, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`;
  - random 256-bit session IDs stored server-side (database), never plain JWTs in localStorage;
  - new session ID on every sign-in and PIN change (prevents session fixation);
  - idle timeout: 15 min officials, 7 days members; absolute max 12 hours officials, 30 days members;
  - Profile → **"Devices"** list with **"Sign out of all devices"**; a PIN reset by the treasurer signs that member out everywhere.
- Officials' accounts: optional now, required later, **second factor** (authenticator app TOTP). Build it now behind `REQUIRE_OFFICIAL_2FA=false`.

#### 6.2 Who can see what (authorization)
- Every server action, API route and page checks role and chama **on the server**. Keep Change 3 / spec Part 11 rules: members only ever reach their own data; other records return **404**.
- One central `authorize(session, action, resource)` helper; an ESLint rule or test that fails if any route/action lacks it.
- IDs are random (cuid/uuid), never sequential.
- Postgres Row Level Security in production as a second lock (keep SQLite for local dev, but write the RLS migration for Postgres).

#### 6.3 Website protections
- **Security headers** via `middleware.ts` / `next.config`:
  - `Content-Security-Policy` with per-request **nonces**, no `unsafe-inline` scripts, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, allow only own origin + Cloudflare Turnstile;
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`;
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disabling camera, microphone, geolocation, payment;
  - `Cross-Origin-Opener-Policy: same-origin`; remove the `X-Powered-By` header.
- **CSRF:** server actions only from own origin (check `Origin`/`Host`), `SameSite=Strict` cookies, and a CSRF token on any classic form or API that changes data.
- **XSS:** never use `dangerouslySetInnerHTML`; escape all user/Excel text (names, notes, purposes); sanitize anything rendered in PDFs.
- **SQL injection:** Prisma only; ban `$queryRawUnsafe` / `$executeRawUnsafe` with an ESLint rule.
- **Input validation:** Zod schema on every input (forms, server actions, API, Excel rows) with length limits (names ≤ 80 chars, notes ≤ 500, amounts 0–10,000,000 KES).
- **Rate limiting** on all write endpoints, upload, notifications, and PIN reset (Upstash Redis in production, in-memory in dev).
- **Errors:** users see friendly messages; stack traces and internal details only in server logs, never in the browser. Custom 404/500 pages.
- **HTTPS only** in production; redirect HTTP to HTTPS.

#### 6.4 Excel upload safety
- Only treasurer/chair, after step-up check.
- Max 5 MB; allow only `.xlsx` and `.csv`; check the real file type by its first bytes (magic number), not just the extension.
- `.xlsx` is a zip: protect against **zip bombs** (limit uncompressed size to 50 MB, max 20 sheets, max 5,000 rows per sheet).
- Never execute macros or formulas from uploaded files; read values only. Reject `.xlsm`.
- Parse in memory and delete any temporary file immediately; store only the file's SHA-256 hash and the extracted rows.
- **Formula injection on export:** any exported Excel/CSV cell starting with `=`, `+`, `-`, `@` gets a leading `'` so it can't run as a formula on the treasurer's computer.

#### 6.5 Secrets and data
- All secrets only in `.env` (never in code or git): `SESSION_SECRET`, `PIN_PEPPER`, `VAPID_*`, `TURNSTILE_*`, database URL. Update `.env.example` with names only.
- App refuses to start in production if any required secret is missing or still a placeholder, or if `DEMO_MODE=true`.
- **Demo accounts and seed data can never exist in production:** the seed script refuses to run when `NODE_ENV=production`; demo login hints hidden.
- Encrypt sensitive fields at rest (AES-256-GCM with a key from `.env`) for anything beyond name/phone you add later (e.g. national ID).
- Phone numbers masked in logs (`+2547****005`). Never log PINs, temporary PINs, session IDs or secrets.
- Production database: least-privilege DB user (no superuser), encrypted at rest, daily encrypted backups, tested restore (document in `docs/DEPLOY.md`).

#### 6.6 Monitoring and audit
- Append-only **audit log** (hash-chained so edits are detectable) for: sign-ins (success/fail), lockouts, PIN changes and resets, member add/remove, uploads, publish, undo, exports, settings changes, role changes.
- **Security page for the chair:** recent failed sign-ins, locked accounts, new-device sign-ins, all official actions; "Verify audit log integrity" button.
- Alerts to treasurer and chair (in-app + push) for: lockout spikes, an official's PIN reset, a new official added, data export.

#### 6.7 Code and dependency safety (GitHub)
- Enable in the repo (tell Thomas the exact clicks if it needs him): **Dependabot alerts + security updates**, **secret scanning + push protection**, **CodeQL code scanning**, branch protection on `main` (PR required, CI must pass).
- CI adds: `npm audit --audit-level=high` (fail on high/critical), **gitleaks** secret scan, and an **OWASP ZAP baseline scan** against the running app.
- Pre-commit hook (husky) running gitleaks so secrets can't be committed by accident.
- Pin dependency versions (lockfile committed); remove unused packages.
- Add `SECURITY.md` (how to report a problem) and `/.well-known/security.txt`.

#### 6.8 Security tests (must all pass)
- Brute force: account locks after the 3rd wrong PIN and stays locked until unlocked; IP limit triggers; CAPTCHA appears after 3 fails.
- Unknown phone and wrong PIN give identical message and similar timing.
- Member A cannot read, change or guess Member B's data through any page, API, server action or PDF link (expect 404).
- Member cannot call treasurer actions (expect 404).
- Step-up required: publish/reset/export fail without a fresh PIN re-entry.
- Session: cookie flags correct; session ID changes after sign-in; old session invalid after PIN reset; "sign out all devices" works.
- Headers: CSP, HSTS, frame-ancestors present on every page.
- XSS: a member name `<script>alert(1)</script>` from Excel displays as text everywhere, including PDFs.
- Upload: rejects renamed `.exe`, `.xlsm`, oversized files and a zip bomb sample.
- Export: cells starting with `=` are neutralised.
- Production guard: app refuses to start with `DEMO_MODE=true` or missing secrets.

When done, write `docs/SECURITY-REVIEW.md`: a plain-language summary for Thomas of what is protected, what still needs doing before going live (e.g. real domain, SMS provider, penetration test by a professional), and the GitHub settings he must confirm.

---

### Order of work inside this part (Part 1's order wins)
1. Change 1: remove bubbles, quotes, animations
2. Change 2: premium banking-grade redesign
3. Change 3: add members, temporary PIN, forced PIN change, reset
4. Change 5: official Excel template + importer update
5. Change 4: reminders and notifications
6. Change 6: security hardening (also apply its rules to anything built in steps 3–5 as you go)

After each: PR, localhost link, checklist, **wait for OK**.

Demo logins after Change 3 (update the seed):
- Treasurer Peter Otieno `0712345002`, PIN `25802580` (8 digits)
- Member Amina Hassan `0712345005`, PIN `258025` (6 digits)
- Plus one seeded member who has **never signed in**, with a temporary PIN printed in the console and README, to test the first-login flow.

(Follow the order of work in Part 1; it decides when each change below is done.)

---

# PART 6: OFFICIAL EXCEL TEMPLATE

Create `docs/pamoja-iq-upload-template.xlsx` (and copy to `public/templates/`) with a script `scripts/make-template.ts` so it can be regenerated. Font Arial 10. Header row: navy fill `#0F2A3D`, white bold text, frozen. Input cells: light yellow fill, blue text. Calculated cells: light grey fill, black text. 200 empty input rows per sheet with the formats below. Example rows are the Umoja demo.

**Sheet `How to use`** (column B, wrapped text):
- Title "PAMOJA IQ: TREASURER UPLOAD TEMPLATE".
- Keep sheet names and column headings exactly; don't add or rename columns.
- First rows are EXAMPLES; type over or delete them before uploading.
- Yellow = type here; grey = calculated, don't type.
- Member No links everything (same Member No on every sheet).
- Phone like 0712345678; members sign in with it; must be correct and unique.
- Amounts: numbers only in KES; leave a month blank if unpaid.
- Dates: day/month/year.
- Re-upload monthly; Pamoja IQ adds only what is new and shows a preview.
- Nothing is visible to members until the treasurer clicks "Publish to members".

**Sheet `Members`**: `Member No | Full Name | Phone | Role | Join Date | Status`
- Phone column stored as **text** (keeps leading 0). Join Date `DD/MM/YYYY`.
- Dropdowns: Role = Member, Chair, Treasurer, Secretary. Status = Active, Exited, Suspended.
- Examples: `M001 Grace Wanjiru 0712345001 Chair 01/05/2025 Active`; `M002 Peter Otieno 0712345002 Treasurer 01/05/2025 Active`; `M003 Amina Hassan 0712345005 Member 01/05/2025 Active`.

**Sheet `Contributions`**: `Member No | Full Name | 2026-01 | … | 2026-12 | Total (KES)`
- Month headers are text `YYYY-MM`; more months can be added to the right.
- Amount format `#,##0`. `Total (KES)` = formula `=IF(COUNTA(A2)=0,"",SUM(C2:N2))` (grey; ignored on import).
- Examples: M001 and M002 paid 2,000 for Jan–Oct; M003 paid 2,000 for Jan–Sep, October blank.

**Sheet `Loans`**: `Member No | Loan Date | Amount Borrowed (KES) | Interest Rate (% per month) | Months | Purpose | Amount Repaid (KES) | Status | Total Due (KES) | Balance (KES)`
- Rate formatted `0%` (10% = 0.10). Status dropdown: Active, Paid, Defaulted.
- `Total Due` = `=IF(C2="","",C2*(1+D2*E2))`; `Balance` = `=IF(C2="","",I2-G2)` (both grey; ignored on import).
- Examples: `M003 10/07/2026 10,000 10% 5 School fees 8,400 Active` (Total 15,000, Balance 6,600); `M001 03/02/2026 15,000 10% 3 Stock for shop 19,500 Paid` (Total 19,500, Balance 0).

**Sheet `Fines`**: `Member No | Date | Type | Amount (KES) | Paid (Yes/No)`
- Type dropdown: Late contribution, Missed meeting, Late loan payment, Other. Paid dropdown: Yes, No.
- Example: `M003 06/10/2026 Late contribution 200 No`.

Importer rules: read exactly these sheets/headers; ignore `How to use`, `Total (KES)`, `Total Due (KES)`, `Balance (KES)`; interest `0.1`, `10` or `10%` all mean 10%; normalise phones to `+2547…`/`+2541…`; skip empty rows; read values only (never formulas or macros).
