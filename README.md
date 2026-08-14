# What's Human?

A party game about telling human writing from AI writing: players see a prompt and answers, vote on which answer a human wrote, and score against the room in timed rounds.

- **Stack:** Next.js 14 + TypeScript + Tailwind + Supabase
- **Target URL:** https://whatshuman.vercel.app

## Run locally

```bash
npm install
npm run dev     # localhost:3000
```

Env vars (see the values in the workspace build notes): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_ROUND_LENGTH`.

## Deploy

Push to `main`; the Vercel project is `whatshuman`.

## Where the data lives

Supabase — rounds, answers, and votes. The browser uses the anon (public) key; row-level security is the boundary. A known fixed bug to be aware of when touching votes: duplicate vote inserts (fixed in the superseded `whatshuman-2d088e16` lineage).

## Status

Dormant since 2026-07. The GitHub repo `whatshuman-2d088e16` is an earlier Lovable-built version of the same game, superseded by this one.
