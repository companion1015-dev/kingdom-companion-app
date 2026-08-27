# Kingdom Companion — Deployment

## Status

- Next.js 14.2.5, TypeScript, Prisma 7.8.0/PostgreSQL, JWT auth, npm.
- `npm run build` and `npx tsc --noEmit` pass.
- Git repository initialised, `main` branch, one commit containing the current working state.
- No migrations have ever been created or run. No production database exists. No secrets exist anywhere in this environment.

## What is genuinely blocking a live deployment right now

None of the following can be done inside this sandbox — it has no access to any hosting platform account, no ability to provision a database, and cannot reach Prisma's own binary-distribution servers (only a fixed allowlist of package-registry domains). These are the exact, concrete actions required, in order:

### 1. Push this repository to GitHub (or GitLab/Bitbucket)

```
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Provision a production PostgreSQL database

Recommended: [Supabase](https://supabase.com) (already the target throughout this codebase — `@supabase/ssr` and `@supabase/supabase-js` are dependencies, and `.env.example` is written for it). Create a project, then copy:

- `DATABASE_URL` (pooled connection, port 6543)
- `DIRECT_URL` (direct connection, port 5432 — Prisma needs this for migrations)

### 3. Run the first migration, from an environment that can reach Prisma's servers

This sandbox cannot do this step — it is network-restricted. From your own machine or the hosting platform's build step (which will have normal internet access):

```
npx prisma migrate dev --name init
```

This is the **first migration this project will ever have** — there is no existing migration history to apply, only the schema to turn into one.

### 4. Generate real secrets

```
openssl rand -base64 64   # → JWT_SECRET
openssl rand -base64 64   # → JWT_REFRESH_SECRET (must be different from the above)
```

### 5. Deploy to a hosting platform

Recommended: [Vercel](https://vercel.com) — zero-config for Next.js, no `Dockerfile` or platform-specific config needed. Connect the GitHub repo, then set every variable from `.env.example` in the platform's environment settings, with two changes for production:

- `NEXT_PUBLIC_APP_URL` → your real production domain, not `localhost:3000`.
- `NODE_ENV=production`.

### 6. Required third-party accounts, by priority

**Required for the app to function at all:**
- Supabase (database) — step 2.
- An email provider for `RESEND_API_KEY` (password reset, verification emails depend on this).

**Required for specific features, not for the app to boot:**
- `ANTHROPIC_API_KEY` — AI Companion.
- `BIBLE_API_KEY` — Bible text itself; without it, the Bible reader has nothing to display, so treat as effectively required.
- `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`/`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — donations only; the app functions without them, donations simply won't process.
- `NEXT_PUBLIC_ALGOLIA_APP_ID` and related — search; the app functions without it.
- `R2_*` — file storage; not required unless a feature that uploads files is in active use.
- `SENTRY_DSN` — error monitoring; optional for launch.
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — analytics; optional, and per the project's own Constitution, must never be added without the associated Privacy Policy disclosure being live first.

## What does NOT need to change

The application code itself required no changes to become deployable — it already builds cleanly, already reads all configuration from environment variables (no hardcoded values), and already uses a standard Next.js structure Vercel handles with zero extra configuration.
