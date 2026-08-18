# Contributing

## Branch naming

Use `<lane>-<slug>`, e.g. `roam-weather-widget`, `rayli-tenant-fix`, `quick-tools-owed-page`.

`<lane>` is whatever session or workstream made the branch — a repo name, a lane label, or a short
project tag. `<slug>` is a few words on what the branch does.

**Why this is the one rule in this file.** By 2026-08-14 this org's repos carried branches named
`claude/`, `worktree-v51-`, `stragglers-`, and bare descriptive names with no prefix at all, mixed
in the same repo. None of those four shapes tell a reader whether the branch is still live or safe
to delete — a `claude/`-prefixed branch and a `stragglers-`-prefixed branch from the same week look
identical in age and status from the name alone. A single convention doesn't fix branches that
already exist, but it stops the pile growing in a fifth shape, and `<lane>-<slug>` is legible to
someone outside this org who has never seen the other three.

## Everything else

Build must be green (`npm run build`) before a commit. CI runs the same check on every push — see
`.github/workflows/ci.yml`. If CI and your local build disagree, trust CI; it ran on a clean
checkout and yours may not have.
