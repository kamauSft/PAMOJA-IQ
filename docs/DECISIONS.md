# Decisions

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
