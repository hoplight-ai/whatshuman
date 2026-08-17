#!/usr/bin/env bash
#
# Push the values in .env.production up to the Vercel project's Production
# environment, so the deployed build reads the same config this repo declares.
#
# Why this exists (2026-08-17):
#   Production sat pointed at Supabase project `jltgyxhuebhcoohttrwd` for 67 days.
#   That project no longer resolves in DNS, so the deployed game could not load a
#   single phrase. Nobody noticed because the three vars were stored as `Sensitive`,
#   which hides their values from `vercel env ls` and from the dashboard, and because
#   git deploys were broken so the repo's corrected value never reached a build.
#
#   The values are re-added WITHOUT `--sensitive` on purpose. Every one of them is a
#   `NEXT_PUBLIC_*` var, meaning Next.js inlines it into the JavaScript bundle that
#   ships to every browser. Hiding them in the dashboard protects nothing and is
#   exactly what made this two-month outage invisible.
#
# Usage:  npm run env:sync-prod
# Then:   redeploy, because NEXT_PUBLIC_* values are baked in at build time.
#
# Secrets never appear on a command line here; they are read from the gitignored
# .env.production and piped to the CLI on stdin.

set -euo pipefail

# Resolve the repo root from the script's own location, so this works no matter
# which directory it is invoked from.
cd "$(dirname "$0")/.."

ENV_FILE=".env.production"
VARS="NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_ROUND_LENGTH"

if [ ! -f "$ENV_FILE" ]; then
  echo "FAIL: $ENV_FILE not found. Run this from the repo root."
  exit 1
fi

for name in $VARS; do
  value="$(grep "^${name}=" "$ENV_FILE" | head -n1 | cut -d= -f2-)"
  if [ -z "$value" ]; then
    echo "FAIL: $name has no value in $ENV_FILE"
    exit 1
  fi

  echo "--- $name"
  # Remove first so re-running is safe. A missing var is not an error here.
  npx --yes vercel@latest env rm "$name" production --yes || true
  printf '%s' "$value" | npx --yes vercel@latest env add "$name" production
done

echo
echo "Done. These are build-time values: redeploy before checking the live site."
