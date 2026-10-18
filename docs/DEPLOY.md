# Deploying Pamoja IQ

This computer uses a local records file. The internet staging copy may hold the demo chama. Production must not.

## Host

- App: Vercel. GitHub Pages cannot run this app, and it must not be used for the real books.
- This computer: double-click `start-pamoja.bat`. It uses the local file in `DATABASE_URL`. `stop-pamoja.bat` frees port 3000.
- Internet staging: Vercel plus Neon Postgres, with `DEMO_MODE=true`, `DEMO_OTP_VISIBLE=true`, and `ALLOW_DEMO_IN_PROD=true`. The build command in `vercel.json` switches Prisma to Postgres, runs the migrations, and adds the demo chama only when the records are empty.
- Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` to the direct Neon address, not the pooled one. Secrets stay in Vercel, not in git.
- Production, later, uses a separate database with `DEMO_MODE` unset. Apply `prisma/rls.sql` as the database owner, then point the app role at a user who cannot bypass row-level security.

## Environment

Copy names from `.env.example`. Set real values only in the host:

| Name | Production |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `SESSION_SECRET` | A fresh random string, at least 48 characters |
| `DEMO_MODE` | `false` |
| `ALLOW_DEMO_IN_PROD` | unset |
| `SENTRY_DSN` | optional |
| `ENABLE_AI_IMPORT` | `false` until import is ready |
| `ANTHROPIC_API_KEY` | empty until an assistant is connected |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` when that assistant is connected |

The server refuses to start if `DEMO_MODE=true` while `NODE_ENV=production`, unless `ALLOW_DEMO_IN_PROD=true`.

## Morning messages

Later, a scheduled job prepares messages at 05:00 Africa/Nairobi and sends opted-in texts at 07:00. On Vercel that will be a Cron entry. It is not wired yet.
