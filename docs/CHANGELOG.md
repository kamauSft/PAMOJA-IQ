# Changelog

## Unreleased

### Brand setup

- The product name is **Pamoja IQ**, tagline **Intelligent Chama Solution**, read from `config/brand.ts`.
- Sign-in text messages and the pages a person sees use that name.
- A production server refuses to start when demo mode is on, unless `ALLOW_DEMO_IN_PROD=true`.
- Added a health check at `/api/health`, a quiet error monitor, sample Excel files, and a GitHub check that lints, type-checks, tests, and builds.

### Sign-in

- A correct code sometimes left you on the sign-in page. The page was opening your home screen and reloading the sign-in screen at the same time, and the reload could win. It now opens your home screen only.
- The browser tests can start on Windows. They were calling a Mac/Linux program file.
