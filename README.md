# Pamoja IQ

**Intelligent Chama Solution.** *Pamoja* means together in Kiswahili.

The treasurer keeps one set of books. Each member opens only their own savings, loan, and fines. The demo group is **Umoja Savings Group**.

Screenshots of the phone screens will be added here as the design is finished.

## Run it on Windows

You need Node.js 22 or newer. In PowerShell:

```powershell
node --version
cd C:\Users\USER\pamoja-iq
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
- `docs` — spec, changelog, deploy notes

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
| `npm run lockout:reset` | Clear a sign-in lock from practice attempts |

Money is integer cents. `lib/finance` does the maths. The screens only read those results.
