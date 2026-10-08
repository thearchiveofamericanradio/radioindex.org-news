// Builds the static newsroom into dist/ from a checkout of the blog repo.
// BLOG_DIR defaults to ./blog (CI checks the blog repo out there).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadPosts } from "./load-posts.mjs";
import { CATEGORIES } from "./categories.mjs";
import { renderHome, renderListing } from "./render-index.mjs";
import { renderArticle } from "./render-article.mjs";
import { rss, atom, jsonFeed, sitemap } from "./feeds.mjs";
import { page, SITE } from "./layout.mjs";
import { storyPath } from "./teaser.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const BLOG = path.resolve(process.env.BLOG_DIR || path.join(ROOT, "blog"));
const DIST = path.join(ROOT, "dist");
const today = process.env.BUILD_DAY || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

function write(rel, content) {
  const file = path.join(DIST, rel.endsWith("/") ? `${rel}index.html` : rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function papersOf(blogDir) {
  // Scholarly papers keep their canonical URL on the blog; see blog src/paper-registry.ts.
  const out = new Map();
  const file = path.join(blogDir, "src/paper-registry.ts");
  if (!fs.existsSync(file)) return out;
  for (const m of fs.readFileSync(file, "utf8").matchAll(/"([\w-]+)":\s*{[^}]*canonicalSlug:\s*"([\w-]+)"/g)) out.set(m[1], m[2]);
  return out;
}

function blogSha() {
  try { return execFileSync("git", ["-C", BLOG, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { return "unknown"; }
}

const started = Date.now();
fs.rmSync(DIST, { recursive: true, force: true });
const stories = loadPosts(BLOG, today);
stories.forEach((s, i) => { s.pos = i; });
const papers = papersOf(BLOG);
const sitePaths = [{ path: "/", lastmod: stories[0].date }];

write("/", renderHome(stories));
const listings = [
  { id: "latest", name: "All stories", blurb: "Every story from the radioindex.org newsroom, newest first.", stories },
  ...CATEGORIES.map((c) => ({ ...c, stories: stories.filter((s) => s.category === c.id) })),
];
for (const l of listings) {
  for (const p of renderListing(l)) { write(p.path, p.html); sitePaths.push({ path: p.path }); }
}
for (const s of stories) {
  write(storyPath(s), renderArticle(s, stories, papers));
  if (!papers.has(s.slug)) sitePaths.push({ path: storyPath(s), lastmod: s.date });
}

write("/about/", page({ title: "About the newsroom", description: SITE.description, path: "/about/", body: `<div class="wrap prose-page"><h1>About the newsroom</h1>
<p>${SITE.name} publishes the stories behind <a href="${SITE.home}/">radioindex.org</a>, the archive of American Old-Time Radio: how lost broadcasts are found, dated and named, and what each day of the archive's calendar walk turns up.</p>
<p>Every story here is published from the radioindex.org blog. New posts appear in the newsroom automatically, usually within half an hour.</p>
<h2>Follow along</h2><ul><li><a href="/rss.xml">RSS feed</a></li><li><a href="/atom.xml">Atom feed</a></li><li><a href="/feed.json">JSON Feed</a></li></ul></div>` }));
sitePaths.push({ path: "/about/" });
fs.writeFileSync(path.join(DIST, "404.html"), page({ title: "Page not found", description: "That page is not in the newsroom.", path: "/404", body: `<div class="wrap prose-page"><h1>Page not found</h1><p>That page is not in the newsroom. Try the <a href="/">latest news</a> or <a href="/latest/">all stories</a>.</p></div>` }).replace('<meta name="description"', '<meta name="robots" content="noindex">\n<meta name="description"'));

write("rss.xml", rss(stories));
write("atom.xml", atom(stories));
write("feed.json", jsonFeed(stories));
write("sitemap.xml", sitemap(sitePaths));
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
write("build.json", JSON.stringify({ blog_sha: blogSha(), stories: stories.length, built_at: new Date().toISOString() }));
write("_headers", `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: interest-cohort=()\n/build.json\n  Cache-Control: no-store\n`);
fs.cpSync(path.join(ROOT, "assets"), path.join(DIST, "assets"), { recursive: true });

const counts = Object.fromEntries(listings.map((l) => [l.id, l.stories.length]));
console.log(`Built ${stories.length} stories in ${Date.now() - started} ms`, counts);
