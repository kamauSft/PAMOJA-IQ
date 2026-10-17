# Changelog

## Unreleased

### Treasurer profile and Excel

- A treasurer can create their own chama at `/start`, then sign in with the PIN they chose.
- The one-time code still appears on the sign-in page. It is not sent to a phone. No text-message company is connected yet.
- The treasurer's desk has **Upload Excel**. A spreadsheet of members and monthly payments can be checked, then added to that chama. A blank file is available on the same page. A totals row named JUMLA or TOTAL is skipped.

### Brand setup

- The product name is **Pamoja IQ**, tagline **Intelligent Chama Solution**, read from `config/brand.ts`.
- Sign-in text messages and the pages a person sees use that name.
- A production server refuses to start when demo mode is on, unless `ALLOW_DEMO_IN_PROD=true`.
- Added a health check at `/api/health`, a quiet error monitor, sample Excel files, and a GitHub check that lints, type-checks, tests, and builds.

### Design

- Screens use the Pamoja colours, Bricolage Grotesque for headlines, Figtree for text, and JetBrains Mono for amounts.
- Whole shillings show as `KES 2,000`. Cents still show when they are not zero.
- A light/dark switch and an English / Kiswahili switch sit on the front page, the sign-in page, and the member home.

### Sign-in

- A correct code sometimes left you on the sign-in page. The page was opening your home screen and reloading the sign-in screen at the same time, and the reload could win. It now opens your home screen only.
- The browser tests can start on Windows. They were calling a Mac/Linux program file.
