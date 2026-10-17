# Pamoja IQ — Round 2 Changes (overrides docs/SPEC.md)

**How Thomas uses this file:**
1. Save this file **and** `pamoja-iq-upload-template.xlsx` into `C:\Users\USER\pamoja-iq\docs\`.
2. Open `C:\Users\USER\pamoja-iq` in Cursor, open chat with **Ctrl + I**, choose **Agent**.
3. Type: **`Read @docs/PAMOJA-IQ-ROUND-2.md and do it. Start with Change 1.`**

---

## Instructions for the Cursor Agent

The owner tested the app and is not happy. This file **overrides docs/SPEC.md** wherever they disagree. Do exactly what is below, nothing extra. Keep everything else that already works (login, Excel import, member privacy, finance functions).

Work one change at a time on its own branch, run lint + typecheck + tests, commit, push, open a PR, then restart the app and give Thomas the `http://localhost:3000` link and a short checklist of what to click and what he should see. **Wait for "OK" before the next change.** When he says OK, merge the PR, pull `main`, continue.

Thomas is not a developer: explain in plain words, run all commands yourself.

---

## Change 1: Remove what the owner doesn't want

Delete completely (code, components, routes, database tables/fields if unused, seed data, tests, copy, spec references):
- **All bubble views** (landing page, treasurer dashboard, member page). No d3-force, no floating circles.
- **Morning motivational quotes / encouragement messages** (spec Part 10): the content file, scheduled job, `DailyMessage` model, settings toggle, UI card.
- **Confetti, celebration animations, emojis, playful illustrations, woven-basket textures.**
- Goal photo uploads (keep simple savings goals only if they already exist; no photos).

Mark spec Parts 4 (bubble part), 10 and the bubble parts of 6 and 7 as **REMOVED** in `docs/SPEC.md` so no future agent re-adds them. Update `docs/CHANGELOG.md`.

---

## Change 2: A serious, premium look (banking-grade)

The current look is "not premium". Redesign every screen to feel like a **private bank / serious financial institution**: calm, precise, trustworthy. Think of a bank statement and a modern banking app, not a startup landing page.

### Design rules
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
- **Landing page (`/`):** short and serious. Logo wordmark "Pamoja IQ" with small "Intelligent Chama Solution" under it; one headline ("Clear, private records for every chama member."); one sentence; buttons "Sign in" and "For treasurers"; three plain feature rows (Upload records · Members see only their own account · Reminders before due dates); security note; footer. No animation, no illustrations.
- **Login screen:** centred card, logo, "Phone number", "PIN" (masked, show/hide toggle), "Sign in", "Forgot PIN? Ask your treasurer to reset it." Demo hint only when `DEMO_MODE=true`.
- Accessibility: contrast AA, visible focus rings, 44px tap targets, works at 375px width.

---

## Change 3: Members are added by the treasurer, with a temporary PIN

### Sign-in model (for now)
- **Everyone signs in with phone number + PIN.** SMS one-time codes are **postponed** (keep the `SmsProvider` interface but don't require SMS to log in).
- **Member PINs are 6 digits.** Officials (treasurer, chair, secretary): **8 digits**.
- Reject weak PINs: all same digit (`111111`), sequences (`123456`, `654321`), repeating pairs (`121212`), the phone number's last digits.
- Hash with argon2. 5 wrong tries → locked 15 minutes, and the treasurer sees "locked" on the member list.

### Treasurer adds a member (two ways)
1. **One at a time:** Members → **Add member** → Full name, Phone, Member No (auto-suggested next number, e.g. M021), Role, Join date → Save.
2. **In bulk from Excel:** the `Members` sheet of the upload template (Change 5). New rows create new members after the treasurer reviews and confirms.

### Temporary PIN
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

### Tests
Temporary PIN works once only; expires after 7 days; forced change before any other page; weak PINs rejected; lockout after 5 tries; treasurer reset invalidates the old PIN; a member can never reset someone else's PIN.

---

## Change 4: Reminders and notifications

### In-app notification centre (all users)
- Bell icon with unread count (top bar) and a **Notifications** page; mark as read / mark all read.
- `Notification` model: userId (membership), type, title, body, link, readAt, createdAt, channel(s) sent.

### What members are notified about
| When | Message (example) |
|---|---|
| 3 days before contribution due date | "Your October contribution of KES 2,000 is due on 5 Oct." |
| On the due date (if unpaid) | "Your October contribution is due today." |
| 3 days after due (if unpaid), then weekly while unpaid | "Your October contribution is overdue. Please pay your treasurer." |
| 3 days before a loan instalment | "Loan instalment of KES 3,000 due on 10 Nov." |
| Treasurer publishes new records | "Your account was updated on 16 Oct. View statement." |
| Fine recorded | "A fine of KES 200 (late contribution) was added to your account." |
| PIN reset by treasurer | "Your PIN was reset by the treasurer. If this wasn't expected, contact your chair." |

### What the treasurer/chair are notified about
- Weekly summary: collected vs expected this month, who is unpaid, loans overdue.
- A member signed in for the first time / is locked out.
- Upload published (who published, how many members updated).

### Treasurer controls
- **Reminders** page: turn each automatic reminder on/off, set days before/after, set the due day (default 5th), preview the message text, and see a log of what was sent to whom and when.
- **"Remind unpaid members now"** button on the dashboard and contributions page: shows the list first, then sends.
- Reminders only go to members who actually owe, based on the latest published data.

### Channels
- **Now:** in-app notifications + **browser push notifications** (Web Push, PWA, opt-in prompt after first login, works on Android Chrome; on iPhone after "Add to Home Screen"). Store push subscriptions; VAPID keys in `.env` (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`); add to `.env.example`.
- **Later (build the interface, don't connect yet):** SMS via Africa's Talking and WhatsApp, behind `NotificationChannel` interface; dev version logs to console.
- **Privacy:** push and SMS text **never show amounts or other members' names** on the lock screen. Push says "You have a new message from Umoja Savings Group"; details show inside the app after sign-in. In-app notifications may show the member's own amounts.
- Quiet hours: nothing sent between 20:00 and 07:00 Africa/Nairobi; queued for 07:00.
- Scheduler: a daily job at 07:00 EAT (Vercel Cron / node-cron in dev) that is idempotent (never sends the same reminder twice for the same member, month and type).

### Tests
Reminder goes only to unpaid members; no duplicates on re-run; quiet hours respected; push/SMS text contains no amounts or names; member sees only their own notifications.

---

## Change 5: The treasurer's Excel format (use the provided template exactly)

The file `docs/pamoja-iq-upload-template.xlsx` is **the official upload format**. Do this:
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

## Change 6: Security hardening (make the site hard to hack)

This app holds people's money records and phone numbers. Treat it like a banking app. Do every item below, then prove it with tests. Branch: `chore/security-hardening`.

### 6.1 Login and accounts
- **Brute-force protection on three levels:**
  - per account: 5 wrong PINs → locked 15 minutes, doubling each time it repeats (15 → 30 → 60 min), and the member gets a notification;
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

### 6.2 Who can see what (authorization)
- Every server action, API route and page checks role and chama **on the server**. Keep Change 3 / spec Part 11 rules: members only ever reach their own data; other records return **404**.
- One central `authorize(session, action, resource)` helper; an ESLint rule or test that fails if any route/action lacks it.
- IDs are random (cuid/uuid), never sequential.
- Postgres Row Level Security in production as a second lock (keep SQLite for local dev, but write the RLS migration for Postgres).

### 6.3 Website protections
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

### 6.4 Excel upload safety
- Only treasurer/chair, after step-up check.
- Max 5 MB; allow only `.xlsx` and `.csv`; check the real file type by its first bytes (magic number), not just the extension.
- `.xlsx` is a zip: protect against **zip bombs** (limit uncompressed size to 50 MB, max 20 sheets, max 5,000 rows per sheet).
- Never execute macros or formulas from uploaded files; read values only. Reject `.xlsm`.
- Parse in memory and delete any temporary file immediately; store only the file's SHA-256 hash and the extracted rows.
- **Formula injection on export:** any exported Excel/CSV cell starting with `=`, `+`, `-`, `@` gets a leading `'` so it can't run as a formula on the treasurer's computer.

### 6.5 Secrets and data
- All secrets only in `.env` (never in code or git): `SESSION_SECRET`, `PIN_PEPPER`, `VAPID_*`, `TURNSTILE_*`, database URL. Update `.env.example` with names only.
- App refuses to start in production if any required secret is missing or still a placeholder, or if `DEMO_MODE=true`.
- **Demo accounts and seed data can never exist in production:** the seed script refuses to run when `NODE_ENV=production`; demo login hints hidden.
- Encrypt sensitive fields at rest (AES-256-GCM with a key from `.env`) for anything beyond name/phone you add later (e.g. national ID).
- Phone numbers masked in logs (`+2547****005`). Never log PINs, temporary PINs, session IDs or secrets.
- Production database: least-privilege DB user (no superuser), encrypted at rest, daily encrypted backups, tested restore (document in `docs/DEPLOY.md`).

### 6.6 Monitoring and audit
- Append-only **audit log** (hash-chained so edits are detectable) for: sign-ins (success/fail), lockouts, PIN changes and resets, member add/remove, uploads, publish, undo, exports, settings changes, role changes.
- **Security page for the chair:** recent failed sign-ins, locked accounts, new-device sign-ins, all official actions; "Verify audit log integrity" button.
- Alerts to treasurer and chair (in-app + push) for: lockout spikes, an official's PIN reset, a new official added, data export.

### 6.7 Code and dependency safety (GitHub)
- Enable in the repo (tell Thomas the exact clicks if it needs him): **Dependabot alerts + security updates**, **secret scanning + push protection**, **CodeQL code scanning**, branch protection on `main` (PR required, CI must pass).
- CI adds: `npm audit --audit-level=high` (fail on high/critical), **gitleaks** secret scan, and an **OWASP ZAP baseline scan** against the running app.
- Pre-commit hook (husky) running gitleaks so secrets can't be committed by accident.
- Pin dependency versions (lockfile committed); remove unused packages.
- Add `SECURITY.md` (how to report a problem) and `/.well-known/security.txt`.

### 6.8 Security tests (must all pass)
- Brute force: 6th wrong PIN is blocked; IP limit triggers; CAPTCHA appears after 3 fails.
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

## Order of work
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

Start with **Change 1** now.
