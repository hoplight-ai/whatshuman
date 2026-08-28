#!/usr/bin/env node
/**
 * check-preview-meta — does the live site carry a name, preview text, a preview image and a
 * home-screen icon, and do those files actually exist?
 *
 * Why this exists (2026-08-28, Portfolio PREVIEW3):
 *   Pasting whatshuman.vercel.app into a text message produced a card with no picture. The page
 *   declared a title, a description and og: text and then supplied no og:image, no
 *   apple-touch-icon, no manifest and no apple-mobile-web-app-capable — four of the nine items the
 *   workspace requires of every page it serves.
 *
 *   Nothing in a build catches this. `next build` is perfectly happy to ship a page with no
 *   preview image, and a RELATIVE og:image compiles, deploys, and renders as a blank grey card in
 *   iMessage with no error anywhere. So the only place the rule can be enforced is against the
 *   bytes the site actually serves. That is what this reads.
 *
 * What it cannot do, stated so nobody over-reads a green run: it proves the images are present,
 * correctly sized and correctly typed. It cannot tell you whether the card is legible. The only
 * test for that is pasting the URL into a real text message and looking at it.
 *
 * Usage:  npm run verify:preview          (or WH_SITE=https://... npm run verify:preview)
 * Exit:   0 all checks pass · 1 a check failed · 2 nothing could be measured (network/DNS)
 */

const SITE = (process.env.WH_SITE ?? "https://whatshuman.vercel.app").replace(/\/$/, "");

let failures = 0;
let unmeasurable = 0;
const pass = (label, detail) => console.log(`PASS  ${label} — ${detail}`);
const fail = (label, detail) => { failures++; console.log(`FAIL  ${label} — ${detail}`); };
const skip = (label, detail) => { unmeasurable++; console.log(`SKIP  ${label} — ${detail}. A skip is not a pass.`); };

// --- fetch the served HTML -------------------------------------------------

let html;
try {
  const res = await fetch(SITE, { redirect: "follow" });
  if (!res.ok) { skip("site reachable", `${SITE} returned ${res.status}`); process.exit(2); }
  html = await res.text();
  console.log(`site  ${SITE} — ${res.status}, ${html.length} bytes served`);
  console.log();
} catch (err) {
  skip("site reachable", `${SITE} — ${err.message}`);
  process.exit(2);
}

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`, "i"))?.[1] ?? null;

/** Every <meta> whose name= or property= is `key`, returned as its content= value. */
function meta(key) {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const id = attr(tag, "name") ?? attr(tag, "property");
    if (id && id.toLowerCase() === key.toLowerCase()) return attr(tag, "content");
  }
  return null;
}

/** The href of the first <link> carrying `rel` (rel may list several values). */
function link(rel) {
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rels = (attr(tag, "rel") ?? "").toLowerCase().split(/\s+/);
    if (rels.includes(rel.toLowerCase())) return attr(tag, "href");
  }
  return null;
}

const absolute = (url) => /^https?:\/\//i.test(url ?? "");
const resolveUrl = (url) => (absolute(url) ? url : new URL(url, `${SITE}/`).href);

/** PNG dimensions straight out of the IHDR chunk, so the size claim is measured not trusted. */
function pngSize(buf) {
  if (buf.length < 24) return null;
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!sig.every((b, i) => buf[i] === b)) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Fetch an asset and check it is really there, really an image, and really the right size.
 * A 404 HTML error page has a content type and a body, so type and magic bytes are both checked.
 */
async function checkImage(label, url, { width, height, requireAbsolute = false } = {}) {
  if (!url) { fail(label, "no URL declared in the served HTML"); return; }
  if (requireAbsolute && !absolute(url)) {
    fail(label, `"${url}" is relative — a relative og:image renders as a blank card in iMessage and nothing else reports it`);
    return;
  }
  const target = resolveUrl(url);
  let res;
  try {
    res = await fetch(target);
  } catch (err) {
    fail(label, `${target} — ${err.message}`);
    return;
  }
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok) { fail(label, `${target} returned ${res.status}`); return; }
  if (!type.startsWith("image/")) { fail(label, `${target} returned ${res.status} as "${type}", not an image`); return; }
  const buf = Buffer.from(await res.arrayBuffer());
  const size = pngSize(buf);
  if (width && height) {
    if (!size) { fail(label, `${target} is ${type} but its bytes are not a readable PNG`); return; }
    if (size.width !== width || size.height !== height) {
      fail(label, `${target} is ${size.width}x${size.height}, required ${width}x${height}`);
      return;
    }
  }
  pass(label, `${target} — ${res.status} ${type}${size ? `, ${size.width}x${size.height}` : ""}, ${buf.length} bytes`);
}

// --- 1. NAME ---------------------------------------------------------------

const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null;
title ? pass("name: <title>", `"${title}"`) : fail("name: <title>", "absent");

const ogTitle = meta("og:title");
ogTitle ? pass("name: og:title", `"${ogTitle}"`) : fail("name: og:title", "absent — a pasted link shows no bold line");

const appleTitle = meta("apple-mobile-web-app-title");
appleTitle
  ? pass("name: apple-mobile-web-app-title", `"${appleTitle}"`)
  : fail("name: apple-mobile-web-app-title", "absent — the home-screen label falls back to the full <title>");

// --- 2. PREVIEW TEXT -------------------------------------------------------

const description = meta("description");
description ? pass("preview text: description", `"${description}"`) : fail("preview text: description", "absent");

const ogDescription = meta("og:description");
ogDescription
  ? pass("preview text: og:description", `"${ogDescription}"`)
  : fail("preview text: og:description", "absent — the grey line under the title is empty");

// --- 3. PREVIEW IMAGE ------------------------------------------------------

const twitterCard = meta("twitter:card");
if (twitterCard === "summary_large_image") {
  pass("preview image: twitter:card", `"${twitterCard}"`);
} else if (twitterCard) {
  fail("preview image: twitter:card", `"${twitterCard}", required "summary_large_image"`);
} else {
  fail("preview image: twitter:card", "absent");
}

const ogImage = meta("og:image");
await checkImage("preview image: og:image", ogImage, { width: 1200, height: 630, requireAbsolute: true });

// --- 4. HOME-SCREEN ICON ---------------------------------------------------

await checkImage("icon: apple-touch-icon", link("apple-touch-icon"), { width: 180, height: 180 });

const favicon = link("icon") ?? link("shortcut icon");
if (favicon) {
  try {
    const res = await fetch(resolveUrl(favicon));
    const type = res.headers.get("content-type") ?? "";
    res.ok && /image|icon/.test(type)
      ? pass("icon: favicon", `${resolveUrl(favicon)} — ${res.status} ${type}`)
      : fail("icon: favicon", `${resolveUrl(favicon)} returned ${res.status} as "${type}"`);
  } catch (err) {
    fail("icon: favicon", `${resolveUrl(favicon)} — ${err.message}`);
  }
} else {
  fail("icon: favicon", "no <link rel=icon> in the served HTML");
}

// --- 5. MANIFEST -----------------------------------------------------------

const manifestHref = link("manifest");
if (!manifestHref) {
  fail("manifest: linked", "no <link rel=manifest> — nothing tells iOS or Android what this app is called when saved");
  fail("manifest: name / short_name", "not reachable, no manifest is linked");
  fail("manifest: display standalone", "not reachable, no manifest is linked");
  fail("manifest: icons 192 and 512", "not reachable, no manifest is linked");
} else {
  const manifestUrl = resolveUrl(manifestHref);
  let manifest = null;
  try {
    const res = await fetch(manifestUrl);
    if (!res.ok) fail("manifest: linked", `${manifestUrl} returned ${res.status}`);
    else { manifest = await res.json(); pass("manifest: linked", `${manifestUrl} — ${res.status}`); }
  } catch (err) {
    fail("manifest: linked", `${manifestUrl} — ${err.message}`);
  }

  if (manifest) {
    manifest.name && manifest.short_name
      ? pass("manifest: name / short_name", `"${manifest.name}" / "${manifest.short_name}"`)
      : fail("manifest: name / short_name", `name=${JSON.stringify(manifest.name)} short_name=${JSON.stringify(manifest.short_name)}`);

    const wanted = ["start_url", "display", "theme_color", "background_color"];
    const missing = wanted.filter((k) => !manifest[k]);
    if (missing.length) fail("manifest: required fields", `missing ${missing.join(", ")}`);
    else if (manifest.display !== "standalone") fail("manifest: required fields", `display is "${manifest.display}", required "standalone"`);
    else pass("manifest: required fields", `start_url ${manifest.start_url}, display ${manifest.display}, theme_color ${manifest.theme_color}, background_color ${manifest.background_color}`);

    for (const size of [192, 512]) {
      const icon = (manifest.icons ?? []).find((i) => (i.sizes ?? "").split(/\s+/).includes(`${size}x${size}`));
      await checkImage(`manifest: icon ${size}x${size}`, icon?.src ?? null, { width: size, height: size });
    }
  }
}

// --- 6. STANDALONE LAUNCH --------------------------------------------------

const capable = meta("apple-mobile-web-app-capable") ?? meta("mobile-web-app-capable");
capable === "yes"
  ? pass("standalone: apple-mobile-web-app-capable", `"${capable}"`)
  : fail("standalone: apple-mobile-web-app-capable", capable ? `"${capable}", required "yes"` : "absent — a home-screen launch opens inside Safari chrome");

// --- 7. BEYOND THE NINE ----------------------------------------------------
// Two tags the workspace rule does not name, both of which this page declared and silently lost.

const themeColor = meta("theme-color");
themeColor
  ? pass("chrome: theme-color", `"${themeColor}"`)
  : fail("chrome: theme-color", 'absent — Next 14 drops `themeColor` from the metadata export and only warns at build time, so the browser bar stays default white on a black app');

const androidCapable = meta("mobile-web-app-capable");
androidCapable === "yes"
  ? pass("standalone: mobile-web-app-capable", `"${androidCapable}"`)
  : fail("standalone: mobile-web-app-capable", androidCapable ? `"${androidCapable}", required "yes"` : "absent — this is the spelling Chrome on Android reads; the apple- prefixed one does not cover it");

// --- verdict ---------------------------------------------------------------

console.log();
if (failures > 0) {
  console.log(`RESULT  ${failures} check(s) failed. This page is not ready to be pasted into a text message.`);
  process.exit(1);
}
if (unmeasurable > 0) { console.log("RESULT  nothing measured. A skip is not a pass."); process.exit(2); }
console.log("RESULT  all checks passed. The bytes are present and correctly typed; whether the card READS well is still a human test.");
