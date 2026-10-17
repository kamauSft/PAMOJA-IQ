# Pamoja IQ — Personal Motivation + Going Live

**How Thomas uses this file:**
1. Save it into `C:\Users\USER\pamoja-iq\docs\`.
2. In Cursor (folder `C:\Users\USER\pamoja-iq`), **Ctrl + I** → **Agent**, type:
   **`Read @docs/PAMOJA-IQ-MOTIVATION-GO-LIVE.md. Finish any open fix first, then do Part 1, then Part 2.`**

---

## Instructions for the Cursor Agent

This file adds to `docs/PAMOJA-IQ-FIXES.md` (Fix C, daily message) and overrides it where they differ. Same working rules as before: branch per part, tests passing, PR, link + checklist for Thomas, **wait for "OK"**. Thomas is not a developer: run everything yourself, explain in plain words, and tell him exactly which buttons to click when a step needs his account.

---

## Part 1: Motivation that responds to each member's own numbers

The daily "Today" panel (Fix C) becomes **personal**: the message is chosen from the member's real balances and history, not just at random.

### 1.1 How it works
- Build `/lib/motivation/engine.ts`: a **deterministic, rule-based** engine. Input: the member's figures from `/lib/finance` (savings, this month's status, streak, goals, loan, fines, history). Output: the single best message for today plus an optional proverb.
- **All numbers come from `/lib/finance`.** No AI writes numbers. (Optional later: AI rephrasing behind `ENABLE_AI_MOTIVATION=false`, given only the finished message and never raw data.)
- Messages are templates in `/content/motivation-templates.ts` with `sw` and `en` versions and variables, e.g. `{firstName}`, `{savings}`, `{streak}`, `{goalName}`, `{goalPercent}`, `{amountLeft}`, `{dueDate}`.
- Recalculate after every treasurer **Publish** and every morning at 05:00 Africa/Nairobi.

### 1.2 Situations and example messages (pick the highest-priority one that applies)

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

### 1.3 Tone rules (must follow)
- Warm, calm, respectful. **Never shame, threaten, or guilt** a member who is behind.
- **Never compare a member with named members** or rank them. Group comparisons only as anonymous totals ("the group reached 92% on-time this month").
- **Never encourage borrowing.** Don't use "You can now borrow KES X" as motivation. Borrowing limits appear only on the Loan page, stated neutrally.
- No investment or financial advice, no promises of returns.
- No emojis, no exclamation overload (max one per message).

### 1.4 Where it appears
- Member home: **"Today"** panel with the personal message on top and the proverb (if any) underneath, in the calm design.
- After the treasurer publishes new data: a one-time in-app highlight ("Your account was updated. Savings: KES 34,000, up KES 2,000.").
- Milestones (loan cleared, savings milestone, goal reached) also create an in-app notification.

### 1.5 Push notifications (live on the phone)
- Daily motivation push at **07:00 EAT**, plus milestone pushes. **Members choose** in Profile → Notifications: *Daily motivation* (default **on** once they allow notifications), *Milestones* (default on), *Payment reminders* (default on).
- **Lock-screen privacy:** push text never contains amounts, balances or other people's names. Use wording like:
  - "Good morning, Amina. You reached a savings milestone. Open Pamoja IQ to see it."
  - "Your loan is fully repaid. Well done."
  - Proverb-only push: "Haba na haba hujaza kibaba."
  A setting **"Show amounts in notifications"** (default **off**) lets a member choose to see figures.
- Max **one** motivation push per day; milestone pushes don't count toward that but max 2 per day total. Quiet hours 20:00–07:00.
- Tapping the push opens the member home after sign-in.

### 1.6 Tests
For a set of sample members (early payer, long streak, overdue, loan almost done, new member with no data): correct situation chosen; numbers match `/lib/finance`; Kiswahili and English both render; no amounts in push text unless the member opted in; no borrowing encouragement; no repeat wording within 30 days; one daily push max.

---

## Part 2: Put Pamoja IQ live on the internet

Goal: a real web address members can open on their phones, with push notifications working (push needs HTTPS, which going live provides).

### 2.1 Before going live (Cursor checks and fixes these first)
- Fix A (login), Fix B (3 attempts + unlock) merged and working.
- From Round 2 Change 6, at minimum: security headers, rate limiting, CAPTCHA keys support, step-up PIN for treasurer actions, production guard (refuses `DEMO_MODE=true`, missing secrets, or seed in production), audit log.
- Prisma switched from SQLite to **PostgreSQL** for production (keep SQLite for local dev only if easy; otherwise use Postgres for both). Migrations created and tested.
- **No demo accounts in production.** Thomas's account is created from `OWNER_NAME` / `OWNER_PHONE` environment variables with a temporary PIN shown once.
- `docs/DEPLOY.md` written in plain language.

### 2.2 Hosting choice
- **Vercel** for the app (free tier to start, sign in with GitHub, live HTTPS address like `pamoja-iq.vercel.app`).
- **Neon Postgres** for the database (free tier; add it from Vercel's Storage/Marketplace so `DATABASE_URL` is set automatically).
- **Vercel Cron** for the daily jobs: reminders and motivation at **04:00 UTC = 07:00 EAT**, message preparation at **02:00 UTC = 05:00 EAT**. Protect cron routes with a `CRON_SECRET`.
- Every pull request automatically gets its own **preview link**, so Thomas can test changes on his phone before they go live.

### 2.3 What Thomas must click (guide him step by step, one step at a time, wait for "done")
1. Go to **vercel.com** → **Sign up** → **Continue with GitHub** (account kamauSft).
2. **Add New → Project** → import **PAMOJA-IQ**. (If it's not listed: "Adjust GitHub App permissions" → allow PAMOJA-IQ.)
3. In the project: **Storage → Create Database → Neon (Postgres)** → connect to the project.
4. **Settings → Environment Variables**: Cursor gives him the exact list and generates the secret values for him to paste (`SESSION_SECRET`, `PIN_PEPPER`, `CRON_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `OWNER_NAME`, `OWNER_PHONE`, `DEMO_MODE=false`, Turnstile keys when ready). Secrets are pasted only into Vercel, never into the chat or GitHub.
5. Click **Deploy**.
If the Vercel CLI is easier, Cursor may use `npx vercel` instead and walk him through the login.

### 2.4 After the first deploy (Cursor does this)
- Run production migrations (`prisma migrate deploy`, via the build step).
- Create Thomas's owner account and show him the temporary PIN once.
- Smoke test the live site: home page, sign-in, forced PIN change, Excel upload in a test chama, member view, notifications permission prompt, push test to Thomas's phone, security headers present.
- Give Thomas: the live link, how to "Add to Home Screen" on Android and iPhone (needed for push on iPhone), and a checklist.

### 2.5 Going-live safety
- Start with **one real chama** (pilot), real members invited by the treasurer.
- Daily automatic database backups (Neon) and a written restore test in `docs/DEPLOY.md`.
- Error monitoring hook on (Sentry free tier if Thomas wants it; otherwise logs).
- Custom domain (e.g. `pamojaiq.co.ke`) is a later step: document how, don't buy anything.
- Add a short **Privacy notice** page (Kenya Data Protection Act, 2019) and **Terms** page before inviting members.

### 2.6 From now on
- Changes go: branch → PR → **preview link** (Thomas tests on his phone) → merge → **live automatically**.
- Never test with real members' data on preview links; previews use a separate preview database.

---

## Order
1. Finish any open fix (A, B, C) and Thomas's owner account.
2. **Part 1**: personal motivation + push.
3. **Part 2**: go live (pre-checks first, then guide Thomas through Vercel).
