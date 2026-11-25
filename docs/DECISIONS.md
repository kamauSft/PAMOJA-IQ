# Decisions

## 2026-11-25 - D-ID animates the presenter, not a voice over silent lips

The owner said the visible presenter and the words did not match. The source Pexels clip has no audio at all, and this computer only has older local voices, so retiming captions could not make the mouth agree with the script. D-ID Talks was chosen over HeyGen because it animates a still from the already licensed clip without enterprise video-reference access or a separate avatar setup, and one short talk per sentence gives an exact measured duration for each caption. The default is a natural Microsoft neural female voice, and the overlay and guide card label the performer as illustrative so the stock footage is not presented as an endorsement. The API key lives only in `D_ID_API_KEY`; no key, talk id or generated script is committed. Every sentence comes from `content/guide-script.json`, shared by the browser and the builder. The committed film remains the earlier local-voice build until a key is supplied and `npm run guide` is run.

## 2026-11-25 - The landing page proves the product instead of describing a category

The page read like a generic SaaS template because the proof band, About and three-step workflow could have belonged to any tool. They are replaced by one interactive proof that follows the real screens: the messy Excel with a skipped JUMLA row, the agent's placement review with a row held for review, the treasurer's month grid of paid/late/missed/not-due marks, and the publish gate beside a single member's private position and statement. The figures are made up and labelled as such; no real chama data enters the public bundle. The change keeps the full-screen meeting film, bilingual copy, click-to-play guide, and reduced-motion fallback while shortening the path from hero to evidence.

## 2026-11-15 - A locked treasurer waits 15 minutes, then returns

A member who forgets a PIN needs a person: the treasurer or the chair unlocks the number, and that stays. A treasurer or chair who forgets a PIN is different, because locking the highest door forever leaves the chama with no one to unlock anybody. Three wrong PINs stop an official for 15 minutes; after that the lock lifts by itself and the count starts again. The trade is deliberate: a patient guesser gets a slow stream of attempts instead of a fast one, and every wrong guess is still counted against the phone number.

## 2026-11-21 - A mixed meeting film fills the whole first screen

A small strip at the top was not what was asked for: the film has to occupy the whole page. The landing, sign-in, home, and desk screens now use the full-page scene, so the meeting sits behind the words and the form instead of above them. Both loops show a formal meeting of men and women from a high angle, softened so nobody is identifiable; the earlier 9653701 and 7950977 choice is superseded by Pexels 4433631 and 6192937. Each is a 6-second, 1440 × 810, H.264, 25-frame, silent loop under 1 MB, so a phone does not stream a long film. The film stays with the door, not with the still that is currently fading in. The matching still remains the poster and the fallback, and a device asking for less motion gets no video. Only the finished loops are committed; the sources stay outside the repository, with licences and rebuild instructions in `docs/ASSETS.md`.

## 2026-11-21 - A clearer film and a visible way home

The first full-page loops were too soft. The high-angle framing already keeps faces indistinct, so the blur was reduced and the encode raised to CRF 25; both files stay under 1 MB and the meeting is easier to see. A Home link now sits in the sign-in header beside the language and theme buttons, so a person can return to the front page in one tap. A successful sign-in still goes straight to `/home` or `/desk`.

## 2026-11-24 - A licensed presenter explains the doors

The owner asked for a white female presenter who actually talks. The landing tour now uses Pexels clip 9064525 by RDNE Stock project, licensed for commercial use, instead of the earlier drawn avatar. The clip is cross-faded so the presenter stays visible and moving through the narration; a local female voice explains that Agentic AI reads the Excel, names the columns, places payments and prepares positions for the treasurer to publish. Captions and a transcript are included, and lockout rules stay out of the welcome. The finished film is about 32 seconds, 1280 × 720 H.264/AAC, about 1.49 MB, and is rebuilt from a source kept outside version control. The faceless-avatar choice is withdrawn. The silent-lip-movement part of this decision is superseded by the D-ID decision above.

## 2026-11-23 - The real chama gets its own private database

KWAN's register holds real names and years of contribution history. It must not reach the public demo, the GitHub Pages site or version control. Onboarding therefore writes to `prisma/kwan.db` only, with `DEMO_MODE=false`, and launches on port 3001 through `start-kwan.cmd`. The supplied files contain no phone numbers, so members receive deterministic placeholder Kenyan numbers and unique 6-digit PINs; `scripts/swap-kwan-phones.ts` replaces them when the chama supplies real numbers. The treasurer's name and phone are passed privately at onboarding and are not stored in this repository; the post uses an 8-digit PIN. Money stays in integer cents and the source totals are preserved without being written into tracked files. The wide sheet shape is handled in the import path itself, so future monthly uploads follow the same idempotent member/month rules as the standard template. Commercial pricing and positioning claims stay out of the repository.

## 2026-11-22 - Builds do not depend on a font vendor

The first deployment after the redesign failed in CI because `next/font` tried to fetch Google fonts during the build, and the GitHub Pages demo tried to load Tailwind through a PostCSS config it never installed. Fonts are now plain CSS stacks, and the demo has its own empty PostCSS config so it cannot inherit the root one. Root lint ignores the demo's generated files. Neither build needs a font vendor or an unused CSS package.

## 2026-11-22 - The landing page reads like an institution

The film still fills the first screen, but a single hero and one tour card did not answer the questions a visitor brings. The page now follows the mature pattern of the reference site: a fixed bar with clear anchors, a facts band, alternating mint and cream sections, an About, a numbered workflow, the two doors, the guide, questions, contact, and a footer. Editorial serif headings and short paragraphs keep the tone calm rather than salesy. The words stay bilingual and the video stays behind the whole first screen; reduced-motion visitors still get stills instead of film.

## 2026-11-15 - The photographs cross-fade and drift as the fallback

The front door and the two home screens still show three photographs, each fading into the next every eight seconds while drifting slowly. This was once the whole motion design; it is now the layer under the footage, the poster while a film loads, and the entire experience when playback fails or the device asks for less motion. It is done with CSS only, so that fallback costs no extra download.

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
