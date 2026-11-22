# Pamoja IQ

**Intelligent Chama Solution.** *Pamoja* means together in Kiswahili.

The treasurer keeps one set of books. Each member opens only their own savings, loan, and fines. The demo group is **Umoja Savings Group**.

Screenshots of the phone screens will be added here as the design is finished.

## Run it on Windows

You need Node.js 22 or newer. In PowerShell:

```powershell
node --version
cd path\to\PAMOJA-IQ
copy .env.example .env
npm install
npx prisma db push
npm run seed
npm run dev
```

Open http://localhost:3000.

`.env` stays on this computer. It is not committed. Put a long random value in `SESSION_SECRET`. Leave `DEMO_MODE=true` so the sign-in code appears on the page.

## Demo logins

Every seeded member uses password **Ab3!@cde**.

The owner saved in the server settings uses one phone for both doors. That phone is not written in this page.

| Person | Role | Phone | Lands on |
|---|---|---|---|
| Grace Wanjiku Mwangi | Chair | 0712345001 | The books, with password Ab3!@cde |
| Peter Otieno Omondi | Treasurer | 0712345002 | The books, with password Ab3!@cde |
| Amina Hassan Bakari | Member | 0712345005 | Her own position |

## How the app is put together

| Layer | Where | What it does |
|---|---|---|
| Screens | `app/**/page.tsx` | Server components. They read a session, load figures, and render. They do not calculate money. |
| Shared pieces | `components/` | Forms, shells, statistics, and the moving scenes. |
| Money maths | `lib/finance/` | Integer cents and basis points. Assertions guard every entry point. |
| Sign-in | `lib/auth/` | Argon2id PINs, server sessions, OTP, lockout, rate limits. |
| Tenancy | `lib/tenancy/` | A Prisma extension stamps and filters `chamaId`, so a screen cannot read another chama's rows. |
| Import | `lib/import/` | Reads a messy Excel register, shows each payment, then saves it in one transaction. |
| Tables | `prisma/schema.prisma` | The database shape, plus `prisma/seed.ts` for Umoja. |
| API | `app/api/**/route.ts` | Small JSON endpoints. Each one checks the session and the role before it acts. |

The rule that keeps the app honest: **money is integer cents, and only `lib/finance` does the maths.** Screens read the results.

## Moving scenes

The sign-in, home, and desk screens put real footage behind the whole first screen, not a small strip. Both loops show a formal meeting of men and women from a high angle; the faces are softened so nobody is identifiable. Each is a short silent H.264 loop, under 1 MB, with the pictured still kept as the poster and as the fallback. The landing page also has a click-to-play guided tour by a moving, faceless agentic-AI presenter, with narration, captions, and a transcript, and a full editorial structure with About, workflow, two doors, questions, contact, and footer sections.

- `components/moving-scenes.tsx` — chooses the clip to suit the door, with the stills underneath.
- `app/globals.css` — `scene-drift`, the slow zoom used by the fallback.
- `public/videos/gathering.mp4` and `meeting.mp4` — the finished loops.
- `scripts/make-film.py` — rebuilds them from the source clips (`npm run film`).
- `docs/ASSETS.md` — the sources, licences, and how to replace them.

It stops for anyone who has asked their device to reduce motion.

## Price

Free is KES 0. Standard is the higher of KES 500 and KES 30 an active member. Pro is the higher of KES 1,000 and KES 60 an active member. Umoja has 19 active members: Standard KES 570, Pro KES 1,140.

## Folder map

- `app` — pages and `/api/health`
- `components` — shared screen pieces
- `config/brand.ts` — name, tagline, colours, logo, support address
- `lib/finance` — money maths
- `lib` — sign-in, database, tenancy
- `prisma` — tables and the demo seed
- `fixtures` — sample Excel files (`npm run fixtures` rebuilds them)
- `tests` — unit tests
- `e2e` — browser tests
- `docs` — spec, changelog, deploy notes
- `web` — the separate static demo published to GitHub Pages. It holds no sign-in and no real member data. The real product is this Next.js app.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the app |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests |
| `npm run test:e2e` | Browser tests |
| `npm run seed` | Load Umoja |
| `npm run db:reset` | Recreate the local database and seed it |
| `npm run format` | Prettier |
| `npm run fixtures` | Rebuild the sample Excel files |
| `npm run film` | Rebuild the two silent scene loops from `assets/video/` |
| `npm run lockout:reset` | Clear a sign-in lock from practice attempts |

### Browser tests on this computer

`npm run test:e2e` reads `.env` for `DATABASE_URL`, resets the demo books, then builds and starts the app on port 3000. It runs against the **production build**, so the strict content policy is what gets tested. The test server sets `ALLOW_DEMO_IN_PROD=true` for itself only; a real deployment never sets it. The tests need Chrome, because Playwright uses your installed browser outside CI.

## PIN rules

- A member uses **6 digits**. An official uses **8 digits**. An older account may hold a long password instead.
- A 4-digit PIN is refused, so a short guess cannot open a door.
- Three wrong PINs lock a member until the treasurer or the chair unlocks the number.
- Three wrong PINs lock a treasurer or chair for **15 minutes**, then the lock lifts by itself.
- Wrong guesses are counted against the phone number as well as the address, so changing address does not help.

## Real member data

The app ships with the Umoja demo only. When a real chama is loaded, keep `DEMO_MODE=false` on the internet copy, set a real `SESSION_SECRET`, and replace the demo photographs in `public/images` and the stock footage in `public/videos/` with media of that chama, taken with each person's written consent.

## Licence

MIT. See `LICENSE`.
