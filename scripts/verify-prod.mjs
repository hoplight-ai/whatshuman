#!/usr/bin/env node
/**
 * verify-prod — does the live site serve this repo's code, talking to this repo's database?
 *
 * Why this exists (2026-08-18, Travel T1 item 2):
 *   Two failures hid behind each other for 67 days and neither was visible from a dashboard.
 *   1. The Vercel git link was repointed at the abandoned Lovable repo on 2026-06-12, so every
 *      push produced no deployment and the site served June code.
 *   2. Production's NEXT_PUBLIC_SUPABASE_URL pointed at project `jltgyxhuebhcoohttrwd`, which no
 *      longer resolves in DNS, so the game fetched nothing and sat on "Loading..." forever.
 *
 *   Checking the Vercel dashboard would have caught neither: the deployment list looked healthy
 *   and the env vars were stored Sensitive, which renders them as "Hidden". The only surface that
 *   cannot lie is the JavaScript the browser actually receives. That is what this reads.
 *
 * Usage:  npm run verify:prod
 * Exit:   0 all checks pass · 1 a check failed · 2 nothing could be measured (network/DNS)
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SITE = process.env.WH_SITE ?? "https://whatshuman.vercel.app";
// fileURLToPath, not .pathname: the repo path contains a space and .pathname returns it percent-encoded.
const ENV_FILE = fileURLToPath(new URL("../.env.production", import.meta.url));

let failures = 0;
let unmeasurable = 0;

const pass = (label, detail) => console.log(`PASS  ${label} — ${detail}`);
const fail = (label, detail) => { failures++; console.log(`FAIL  ${label} — ${detail}`); };
const skip = (label, detail) => { unmeasurable++; console.log(`SKIP  ${label} — ${detail}. A skip is not a pass.`); };

function envValue(name) {
  const line = readFileSync(ENV_FILE, "utf8").split("\n").find((l) => l.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : null;
}

const expectedUrl = envValue("NEXT_PUBLIC_SUPABASE_URL");
const expectedKey = envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
if (!expectedUrl) {
  console.log("FAIL  setup — .env.production has no NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}
const expectedHost = new URL(expectedUrl).host;

let html;
try {
  const res = await fetch(SITE, { redirect: "follow" });
  if (!res.ok) { skip("site reachable", `${SITE} returned ${res.status}`); process.exit(2); }
  html = await res.text();
  pass("site reachable", `${SITE} returned 200, ${html.length} bytes`);
} catch (err) {
  skip("site reachable", `${SITE} — ${err.message}`);
  process.exit(2);
}

// 1. Is the served build the current commit?
const servedSha = html.match(/x-build-sha"\s+content="([0-9a-f]{40})"/)?.[1];
let originSha = null;
try {
  execSync("git fetch origin --quiet", { stdio: "ignore" });
  originSha = execSync("git rev-parse origin/main", { encoding: "utf8" }).trim();
} catch { /* offline: fall through to a skip */ }

if (!servedSha) {
  fail("build sha exposed", "no x-build-sha meta tag in the served HTML — the staleness guard itself is missing");
} else if (!originSha) {
  skip("build sha current", `served ${servedSha.slice(0, 8)}, but origin/main could not be read`);
} else if (servedSha === originSha) {
  pass("build sha current", `served ${servedSha.slice(0, 8)} === origin/main`);
} else {
  fail("build sha current", `served ${servedSha.slice(0, 8)}, origin/main is ${originSha.slice(0, 8)} — the site is stale`);
}

// 2. Which database does the shipped JavaScript actually talk to?
//    NEXT_PUBLIC_* values are inlined at build time, so this is the deployed truth, not the
//    dashboard's claim about it. Chunks are fetched individually because the host appears in
//    exactly one of them and grepping only the HTML finds nothing.
const chunks = [...new Set([...html.matchAll(/\/_next\/static\/[A-Za-z0-9._/-]*\.js/g)].map((m) => m[0]))];
const hosts = new Set();
for (const path of chunks) {
  try {
    const body = await (await fetch(`${SITE}${path}`)).text();
    for (const m of body.matchAll(/https:\/\/([a-z0-9]{15,})\.supabase\.co/g)) hosts.add(`${m[1]}.supabase.co`);
  } catch { /* one unreachable chunk is reported by the empty-set branch below */ }
}

if (hosts.size === 0) {
  fail("shipped supabase host", `no supabase host found in ${chunks.length} served chunks — the client may be unconfigured`);
} else if (hosts.size > 1) {
  fail("shipped supabase host", `served bundle references more than one project: ${[...hosts].join(", ")}`);
} else {
  const [servedHost] = hosts;
  if (servedHost === expectedHost) pass("shipped supabase host", `${servedHost} === .env.production`);
  else fail("shipped supabase host", `serving ${servedHost}, repo declares ${expectedHost}`);
}

// 3. Does that host actually answer? A correct-looking ref that no longer resolves is the
//    original defect, so resolution is checked separately from spelling.
const [servedHost] = hosts.size === 1 ? [...hosts] : [expectedHost];
try {
  const res = await fetch(`https://${servedHost}/rest/v1/phrases?select=id&limit=1`, {
    headers: { apikey: expectedKey, Authorization: `Bearer ${expectedKey}`, Prefer: "count=exact" },
  });
  const count = res.headers.get("content-range")?.split("/")[1] ?? "?";
  if (res.ok) pass("database answers", `${servedHost} returned ${res.status}, ${count} phrases readable with the anon key`);
  else fail("database answers", `${servedHost} returned ${res.status} for the phrases the game loads first`);
} catch (err) {
  fail("database answers", `${servedHost} is unreachable — ${err.message}`);
}

console.log();
if (failures > 0) { console.log(`RESULT  ${failures} check(s) failed.`); process.exit(1); }
if (unmeasurable > 0) { console.log(`RESULT  nothing measured. A skip is not a pass.`); process.exit(2); }
console.log("RESULT  all checks passed.");
