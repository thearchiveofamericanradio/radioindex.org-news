// Page shell shared by every newsroom page.
import fs from "node:fs";
import { CATEGORIES } from "./categories.mjs";
import { esc } from "./markdown.mjs";

export const SITE = {
  name: "radioindex.org News",
  tagline: "Old-Time Radio",
  url: "https://news.radioindex.org",
  home: "https://www.radioindex.org",
  description: "News, features and research from radioindex.org, the archive of American Old-Time Radio.",
  publisher: "The Archive of American Radio",
};

const LOGO = fs.readFileSync(new URL("../assets/logo.svg", import.meta.url), "utf8")
  .replace("<svg ", '<svg class="logo" aria-hidden="true" focusable="false" ').replace(/ (height|width)="32"/g, "");

export function absolute(p) {
  return SITE.url + p;
}

function nav(current) {
  const items = [{ id: "", name: "All news", href: "/" }, ...CATEGORIES.map((c) => ({ id: c.id, name: c.name, href: `/${c.id}/` }))];
  return items.map((i) => `<li><a href="${i.href}"${i.id === current ? ' aria-current="page"' : ""}>${esc(i.name)}</a></li>`).join("");
}

export function page({ title, description, path, current = "", head = "", body, ogType = "website", image, canonical }) {
  const url = absolute(path);
  const fullTitle = path === "/" ? `${SITE.name} | ${SITE.tagline}` : `${title} | ${SITE.name}`;
  const img = image || absolute("/assets/og-default.png");
  return `<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical || url)}">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/assets/favicon-32x32.png" sizes="32x32">
<link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="alternate" type="application/rss+xml" title="${esc(SITE.name)} (RSS)" href="/rss.xml">
<link rel="alternate" type="application/atom+xml" title="${esc(SITE.name)} (Atom)" href="/atom.xml">
<link rel="preload" href="https://cdn.fontshare.com/wf/BFBSY7LX5W2U2EROCLVVTQP4VS7S4PC3/IIUX4FGTMD2LK2VWD3RVTAS4SSMUN7B5/53RZKGODFYDW3QHTIL7IPOWTBCSUEZK7.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/news.css?v=${process.env.ASSET_VERSION || "1"}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:type" content="${ogType}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(img)}">
${head}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="masthead">
  <div class="wrap masthead-row">
    <a class="brand" href="/" aria-label="${esc(SITE.name)} home">${LOGO}<span class="brand-text"><span class="brand-name">radioindex.org <span class="brand-news">News</span></span><span class="brand-tag">${esc(SITE.tagline)}</span></span></a>
    <a class="listen" href="${SITE.home}/">Listen<span class="listen-more"> on radioindex.org</span><span aria-hidden="true"> →</span></a>
  </div>
  <nav class="sections" aria-label="Sections"><ul class="wrap">${nav(current)}</ul></nav>
</header>
<main id="main" tabindex="-1">
${body}
</main>
<footer class="footer">
  <div class="wrap footer-row">
    <p class="footer-brand">${LOGO}<span><strong>radioindex.org</strong> · ${esc(SITE.tagline)}</span></p>
    <ul class="footer-links">
      <li><a href="${SITE.home}/">Listen</a></li>
      <li><a href="/about/">About the newsroom</a></li>
      <li><a href="/rss.xml">RSS</a></li>
      <li><a href="/atom.xml">Atom</a></li>
      <li><a href="/sitemap.xml">Sitemap</a></li>
    </ul>
    <p class="footer-fine">© ${new Date().getUTCFullYear()} ${esc(SITE.publisher)}. Stories are published from the radioindex.org blog.</p>
  </div>
</footer>
</body>
</html>
`;
}
