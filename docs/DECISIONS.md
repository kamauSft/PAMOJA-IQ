# Decisions

## 2026-10-17 — New Excel stays private until the treasurer shares positions

Imported payments are saved with no publish time. The treasurer's desk can see them. A member's home, months, and statement only count payments that have been shared. **Member positions** is the separate step that sets the publish time and tells each member, without amounts or other names, that their position is ready.

## 2026-10-17 — The day's word is chosen in Nairobi, and goals follow shared savings

The encouragement line changes on the Nairobi calendar date and does not repeat for the length of the library. Goal progress is current shared savings divided by the member's target. A member cannot enter a balance, and cannot open another member's goals.

## 2026-10-17 — Text codes stay on the screen until a phone gateway exists

Sign-in still creates a one-time code and logs it on the server. Demo mode shows that code on the page. Nothing sends it to a handset, because no SMS account is connected. The sign-in page says so. A real send can sit behind the existing `SmsProvider` later, without changing the sign-in steps.

## 2026-10-17 — A treasurer starts a chama, then brings the register in from Excel

`/start` creates one person, one chama, and a treasurer membership. The same phone cannot start a second profile. Excel upload is limited to the treasurer and the chair. It reads the Members sheet and month columns, including a messy sheet with Swahili headers, and writes members plus contributions. New people from a file join as members. Loans, fines, and an undo button are not in this step.

## 2026-10-17 — Whole shillings hide the cents

`formatKes` prints `KES 2,000` when the amount is a whole number of shillings, and `KES 1.50` when there are cents. The figures stay integer cents in the database. The trailing `.00` was exact, but it looked like a floating-point leftover on a phone.

## 2026-10-17 — Light, dark, and language are preferences

Dark mode is a class on the page, chosen by the phone's setting until the person taps Light or Dark. English and Kiswahili are a `locale` cookie read by the server, so the first paint is already in the chosen language. The dictionaries cover the front page, sign-in, and the member home.

## 2026-10-17 — One brand file

The name, tagline, colours, logo path, and support address live in `config/brand.ts`. Screens, the install manifest, and text messages read that file so a later rename does not hunt through the app.

The support address `hello@pamoja.iq` is a placeholder until a real inbox exists.

## 2026-10-17 — Demo mode cannot boot in production by accident

`DEMO_MODE=true` shows one-time codes on the sign-in screen. `instrumentation.ts` calls `assertDemoSafe()` when the Node server starts. A production process throws unless `ALLOW_DEMO_IN_PROD=true`. The production build step is skipped so `npm run build` can still run on a laptop whose `.env` has demo mode on.

## 2026-10-17 — Error monitor stays off without a DSN

`lib/log.ts` exposes `captureException`. With `SENTRY_DSN` empty it does nothing, so local development and CI do not need an account. A vendor SDK can sit behind the same function later.

## 2026-10-17 — Sample Excel files are generated

`npm run fixtures` writes `fixtures/pamoja-template-filled.xlsx` and `fixtures/treasurer-messy.xlsx` with ExcelJS. The messy file is the shape a treasurer might actually send: a merged title, Swahili headers, mixed phone formats, and a totals row. The import feature will read these same files.
