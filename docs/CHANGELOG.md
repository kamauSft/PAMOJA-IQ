# Changelog

## Unreleased

### Brand setup

- The product name is **Pamoja IQ**, tagline **Intelligent Chama Solution**, read from `config/brand.ts`.
- Sign-in text messages and the pages a person sees use that name.
- A production server refuses to start when demo mode is on, unless `ALLOW_DEMO_IN_PROD=true`.
- Added a health check at `/api/health`, a quiet error monitor, sample Excel files, and a GitHub check that lints, type-checks, tests, and builds.
