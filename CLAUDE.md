# What's Human?

Extends workspace CLAUDE.md. This file wins inside this project.

## Output guards

- **Zero placeholders.** If Claude has the data, Claude fills it in. No `[INSERT X]`, `YOUR_X`, `<replace with>`, or any variant. Applies to all output: code, prompts, drafts, configs, names, paths, URLs. See CLAUDE.md 9.3.2.

---

## What this project is

An interactive game/research tool. Users read short text phrases (4-25 words), guess human or AI, and eventually explain their reasoning. The game collects vote data that validates which AI writing "tells" real readers actually detect.

The corpus is the core asset. The game is the collection mechanism. Vote data feeds back into the AI Tells Taxonomy (~80 catalogued patterns in AI-generated writing).

**Target URL:** whatshuman.vercel.app (not yet deployed)
**Stack:** Next.js 14, React 18, Tailwind CSS, Supabase (Postgres). Deploying via Versatile.

---

## Load order

Before doing work, read:

| Task | Read first |
|------|-----------|
| Any corpus change (import, new phrases, register additions) | This file, section "Corpus rules" |
| Frontend component work | `whatshuman-app/src/lib/types.ts` + `whatshuman-app/src/app/globals.css` |
| Database schema changes | `_staging/human-or-ai/supabase_schema.sql` (canonical schema definition) |
| Scoping or architectural questions | `_staging/human-or-ai/decisions_log.md` |
| Onboarding a new person | `onboarding-and-status.md` |

---

## Corpus rules (hard constraints)

1. **Register balance is mandatory.** Every AI register must have a human counterpart with comparable phrase count before import. If you're adding AI phrases in a new register, source the human side first. No exceptions.

2. **Phrase length: 4-25 words.** Target distribution: ~60% in 10-25 word range, ~40% in 4-10 word range.

3. **AI corpus is Qwen-only for v1.** Apache 2.0 licensing avoids TOS risk. Do not generate corpus phrases with Claude, GPT, or other models with restrictive output-use terms. Multi-model expansion is a v2 decision.

4. **Model name is internal-only.** The `ai_model_internal` column in Supabase is for research. It is never exposed in the game UI, API responses, or public data exports.

5. **Tell annotations required for AI phrases.** Every AI phrase needs `tell_density` (0-3) and `tells_present` (array of tell IDs like T01, T57). These power the educational layer.

6. **Human phrases need attribution.** `human_source` (author/publication/year) and `human_era` are required. `human_source_url` when available.

---

## Architecture

### Database (Supabase)

Three tables, one view:

- **phrases** - The corpus. `source_type` (human/ai), `register`, `word_count`, tell metadata (AI), source attribution (human). Only `approved = true` rows appear in-game.
- **sessions** - Anonymous browser sessions. Optional `age_bucket` and `primary_register` demographics.
- **votes** - One row per guess. `session_id`, `phrase_id`, `vote`, `was_correct`.
- **phrase_vote_stats** (view) - Aggregated community vote split per phrase.

RLS: anon users can read approved phrases, insert sessions/votes, read stats. Phrase inserts require service-role key.

### Frontend

Components in `whatshuman-app/src/components/`:

- `Onboarding.tsx` - Optional demographics collection
- `PhraseCard.tsx` - Displays phrase, human/AI vote buttons
- `RevealCard.tsx` - Shows correct answer, community vote split bar
- `EndScreen.tsx` - Round summary with accuracy by register and phrase length, share button
- `ThemeToggle.tsx` - Dark/light mode switch

Game logic in `whatshuman-app/src/lib/game.ts`: session management (localStorage for session persistence), balanced phrase selection (half human, half AI, excludes already-seen), vote submission, stats fetching.

### Design tokens

Defined as CSS custom properties in `globals.css`. Dark mode is default.

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `--bg` | #0d1117 | #ffffff | Page background |
| `--bg-card` | #161b22 | #f6f8fa | Card surfaces |
| `--fg` | #e6edf3 | #1f2328 | Primary text |
| `--fg-muted` | #8b949e | #656d76 | Secondary text |
| `--accent-green` | #3fb950 | #1a7f37 | Correct answer |
| `--accent-red` | #f85149 | #cf222e | Wrong answer |
| `--accent-blue` | #58a6ff | #0969da | Interactive elements |
| `--border` | #30363d | #d0d7de | Borders |

---

## Development workflow

**Cowork/Claude Code is the thinking layer. Versatile is the deploy layer.**

Write and test React components and Supabase logic here. Port finished, working code to Versatile for visual polish and deployment. This keeps Versatile interactions focused on shipping rather than iterating on logic.

### Env setup

Copy `.env.local.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (safe for client-side)
- `NEXT_PUBLIC_ROUND_LENGTH` - Phrases per round (default 30)

---

## Decisions that are settled

Do not reopen these without explicit instruction. Full reasoning in `_staging/human-or-ai/decisions_log.md`.

- Qwen-only AI corpus for v1 (licensing)
- 4-25 word phrase length (difficulty axis)
- Model name internal-only (research column, not public)
- Personal LinkedIn distribution, not Hoplight (legal exposure)
- 50/50 human/AI mix per round (weighted random)
- Anonymous sessions, no user accounts (v1 scope)

---

## File map

```
What's Human?/
  CLAUDE.md                    <- This file (project instructions)
  onboarding-and-status.md     <- Collaborator handoff document
  whatshuman-app/              <- Canonical Next.js source
    src/
      app/
        page.tsx               <- Main game page (state machine: loading/onboarding/playing/reveal/end)
        globals.css            <- Design tokens
        layout.tsx             <- Root layout
      components/
        Onboarding.tsx
        PhraseCard.tsx
        RevealCard.tsx
        EndScreen.tsx
        ThemeToggle.tsx
      lib/
        types.ts               <- TypeScript types matching Supabase schema
        game.ts                <- Session, phrase selection, voting logic
        supabase.ts            <- Supabase client init
    .env.local.example         <- Env var template
    package.json               <- Dependencies: next, react, @supabase/supabase-js, tailwindcss
```

Staging files (in parent workspace `_staging/human-or-ai/`):

- `supabase_schema.sql` - Full schema with RLS (canonical reference)
- `decisions_log.md` - All architectural decisions
- `human_corpus_expansion_v2.csv` - 906 human phrases pending import
- `ai_corpus_v2_expansion.csv` - 279 AI phrases (held, register balance)
- `iter15_iter21_qwen_prompts.md` - Next generation prompts
- `raw/` - Extracted iteration outputs (iter1 through iter14)

