# Decisions

## 2026-10-18 — This computer stays on a file; the internet copy uses Postgres

Thomas starts the app by double-clicking `start-pamoja.bat`. That copy uses the local records file. The internet copy uses Postgres, and its build switches the database type only when the address starts with `postgres`. The padlock settings stay off on this computer. Demo data can be added on the internet copy only when that copy is marked as a demo. The public sample page does not point at the real app until that internet address exists.

## 2026-10-17 — One phone may hold a member record and a treasurer post

The books had the owner only as a treasurer, so the member door had nothing to open. A person may now have both records in the same chama. Each door asks for its own record. The phone number stays in `.env`, not in the source.

## 2026-10-17 — Local testing stays on http, and the internet site gets the padlock

Strict-Transport-Security is sent only when NODE_ENV is production. The session cookie is Secure only then. Development does not register a service worker. Thomas starts the app by double-clicking start-pamoja.bat so it does not depend on an agent terminal.

## 2026-10-17 — The morning line follows one member's own figures

The random daily word stays out. In its place, the home picks the highest situation that is true for that member, from a cleared loan down to a proverb plus their savings. Numbers come from the finance functions. A phone alert uses a separate sentence with no amounts. The member can later choose to show amounts. Swahili uses the same situations.

## 2026-10-17 — The screens follow a private-bank layout

Navy is the header and the main button. Green is only for a positive figure or a paid mark. Cards are flat, with a hairline and an 8px corner. IBM Plex Sans carries the words and IBM Plex Mono carries the figures. Fines, Reminders, Settings, Notifications, and Profile are named in the brief and are not menus yet, because those screens are later changes.

## 2026-10-17 — Bubbles, daily words, and celebration effects are out

The owner removed them in Round 2. The treasurer's register is a table. The member home has no random daily word. The morning line that uses that member's own figures stays. Goal photos, confetti, and floating circles are not to be added again. Savings goals stay: a title, a target, and a date.

## 2026-10-17 — Photographs sit behind the title, and they are not a real chama

The front page, the treasurer desk, and the member home show a photograph behind a navy overlay. The pictures are illustrative. They are not photographs of a real chama. A later replacement needs written consent from every person in the picture. The register, statements, and forms stay plain.

## 2026-10-17 — Only the treasurer resets a PIN, and Excel is on that desk

The owner asked for the public page to stay up. Reset PIN is not on the front page. The treasurer signs in with a starting PIN that is not written in the page, then sets other PINs and uploads the official Excel on the desk. That upload stays in the browser. The computer app at `/import` remains the private books.

## 2026-10-17 — The practice website is not a host

GitHub Pages served a second app that checked a PIN in the browser and published practice balances. That site is unpublished. Pamoja IQ is only the Next.js app with a database. A person's phone number is not written into the sign-in page. Older instruction files are superseded by `docs/PAMOJA-IQ-MASTER.md`, except `docs/SPEC.md`.

## 2026-10-17 — The public page shows sample screens only

The public page has no sign-in, no PIN, and no Excel upload. It opens a member sample and a treasurer sample, both marked as demo data, with made-up phone numbers. The real books stay in the Next.js app.

## 2026-10-17 — The real product is the Next.js app

Pamoja IQ is the Next.js app with a database. The `web/` folder is only a demo. Sign-in, PINs, and member records do not belong there. The owner's phone number is not written in the project. The sign-in page does not fill in a phone number.

## 2026-10-17 — Bubbles, confetti, and goal photos are out; the daily message stays

Bubbles, confetti, and goal photos stay removed. The daily motivational message is wanted. It is calm, in Kiswahili and English, and it uses only that member's own figures.

## 2026-10-17 — The treasurer and the member use different doors

The front page sends the treasurer to the full desk and the member to their own dashboard and goals. A treasurer can add one member by name and phone so that person can sign in. The one-time code is still shown on the sign-in page, because no phone text service is connected.

## 2026-10-17 — The treasurer sees members as circles, and the file they last uploaded

Circle size follows savings. Colour follows this month, with the status written under the name. The same list can be opened as a table. The desk stores the spreadsheet name on the import audit line and shows that name with the Nairobi date.

## 2026-10-17 — A member sees their own months, and the group only as totals

The home counts an on-time streak from published payments. Room to borrow is the chama's savings multiple minus the open loan, and it does not change the books. Group savings, loans out, and the on-time rate are totals. The on-time rate stays hidden when fewer than five members were due. A WhatsApp share contains only that member's name and figures.

## 2026-10-17 — New Excel stays private until the treasurer shares positions

Imported payments are saved with no publish time. The treasurer's desk can see them. A member's home, months, and statement only count payments that have been shared. **Member positions** is the separate step that sets the publish time and tells each member, without amounts or other names, that their position is ready.

## 2026-10-17 — Goals follow shared savings

Goal progress is current shared savings divided by the member's target. A member cannot enter a balance, and cannot open another member's goals. The daily message belongs above this again.

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
