# What's Human?

A party game about telling human writing from AI writing: players see a prompt and answers, vote on which answer a human wrote, and score against the room in timed rounds.

- **Stack:** the Lovable-built app, unchanged: TanStack Start (SPA mode) on Vite + React + Tailwind + shadcn/Radix + Supabase. Served on Vercel as static files from `dist/client` (see `vercel.json`).
- **Target URL:** https://whatshuman.vercel.app

## Run locally

```bash
npm install
npm run dev     # localhost:3000
```

Env vars (`.env`, template in `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_ROUND_LENGTH`. Both required values are set on the Vercel project for production and preview.

## Deploy

Push to `main`; the Vercel project is `whatshuman`.

## Where the data lives

Supabase — rounds, answers, and votes. The browser uses the anon (public) key; row-level security is the boundary. A known fixed bug to be aware of when touching votes: duplicate vote inserts (fixed in the superseded `whatshuman-2d088e16` lineage).

## Status

2026-09-25: the Lovable-built version (GitHub `whatshuman-2d088e16`, last change 2026-04-27) replaced the Next.js rewrite here, unchanged, on Whit's yes. The rewrite never matched the Lovable interface because it redrew the design in a different framework instead of carrying the code; it stays in this repo's history before that date. Do not re-port the interface: change the Lovable code directly.
