# Deploying Pamoja IQ

This is the target shape. Do not deploy the demo database.

## Host

- App: Vercel (or any host that runs Next.js).
- Database: Neon or Supabase Postgres. Local development stays on SQLite. Production must not use `file:./dev.db`.
- After the database exists, set `DATABASE_URL` to the Postgres connection string and run `npx prisma migrate deploy` once migrations exist. Until then, apply `prisma/rls.sql` as the database owner, then point the app role at a user who cannot bypass row-level security.

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
