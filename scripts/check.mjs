// Post-build checks on dist/: every page has the newsroom parts, feeds parse, links resolve.
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve(new URL("../dist", import.meta.url).pathname);
const fail = [];
const need = (cond, msg) => { if (!cond) fail.push(msg); };

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith(".html")) pages.push(p);
  }
})(DIST);

need(pages.length > 100, `only ${pages.length} pages built`);
const exists = (href) => {
  const clean = href.split(/[?#]/)[0];
  const p = path.join(DIST, clean);
  return fs.existsSync(clean.endsWith("/") ? path.join(p, "index.html") : p);
};
let stories = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(DIST, file);
  need(/<html lang="en-US">/.test(html), `${rel}: lang`);
  need((html.match(/<h1[ >]/g) || []).length === 1, `${rel}: exactly one h1`);
  need(/<link rel="canonical" href="https:\/\//.test(html), `${rel}: canonical`);
  need(/property="og:title"/.test(html), `${rel}: og:title`);
  need(/class="skip" href="#main"/.test(html), `${rel}: skip link`);
  need(!/\u0000/.test(html), `${rel}: control byte`);
  if (/"@type":"NewsArticle"/.test(html)) {
    stories++;
    need(/class="dek"/.test(html) && /class="byline"/.test(html) && /class="story-hero"/.test(html), `${rel}: story parts`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch { fail.push(`${rel}: bad JSON-LD`); }
    }
  }
  for (const m of html.matchAll(/href="(\/[^"]*)"/g)) need(exists(m[1]), `${rel}: broken link ${m[1]}`);
}
need(stories > 100, `only ${stories} story pages`);
for (const f of ["rss.xml", "atom.xml", "sitemap.xml", "feed.json", "robots.txt", "404.html", "_headers", "build.json"]) need(fs.existsSync(path.join(DIST, f)), `missing ${f}`);
JSON.parse(fs.readFileSync(path.join(DIST, "feed.json"), "utf8"));
need(/<rss version="2.0"/.test(fs.readFileSync(path.join(DIST, "rss.xml"), "utf8")), "rss root");
need(/<feed xmlns="http:\/\/www.w3.org\/2005\/Atom">/.test(fs.readFileSync(path.join(DIST, "atom.xml"), "utf8")), "atom root");

if (fail.length) {
  console.error(`${fail.length} problems:\n${[...new Set(fail)].slice(0, 40).join("\n")}`);
  process.exit(1);
}
console.log(`OK: ${pages.length} pages, ${stories} stories`);
