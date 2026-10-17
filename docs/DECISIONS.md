# Decisions

## 2026-10-17 — One brand file

The name, tagline, colours, logo path, and support address live in `config/brand.ts`. Screens, the install manifest, and text messages read that file so a later rename does not hunt through the app.

The support address `hello@pamoja.iq` is a placeholder until a real inbox exists.

## 2026-10-17 — Demo mode cannot boot in production by accident

`DEMO_MODE=true` shows one-time codes on the sign-in screen. `instrumentation.ts` calls `assertDemoSafe()` when the Node server starts. A production process throws unless `ALLOW_DEMO_IN_PROD=true`. The production build step is skipped so `npm run build` can still run on a laptop whose `.env` has demo mode on.

## 2026-10-17 — Error monitor stays off without a DSN

`lib/log.ts` exposes `captureException`. With `SENTRY_DSN` empty it does nothing, so local development and CI do not need an account. A vendor SDK can sit behind the same function later.

## 2026-10-17 — Sample Excel files are generated

`npm run fixtures` writes `fixtures/pamoja-template-filled.xlsx` and `fixtures/treasurer-messy.xlsx` with ExcelJS. The messy file is the shape a treasurer might actually send: a merged title, Swahili headers, mixed phone formats, and a totals row. The import feature will read these same files.
