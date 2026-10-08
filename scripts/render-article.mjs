// One story page in newsroom form: section, headline, dek, byline, art, takeaways, body, related.
import { category } from "./categories.mjs";
import { page, SITE, absolute } from "./layout.mjs";
import { heroArt } from "./art.mjs";
import { teaser, storyPath, displayDate } from "./teaser.mjs";
import { esc } from "./markdown.mjs";

const BLOG = "https://blog.radioindex.org";

function share(s) {
  const url = encodeURIComponent(absolute(storyPath(s)));
  const text = encodeURIComponent(s.headline);
  const links = [
    ["X", `https://x.com/intent/post?url=${url}&text=${text}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${url}`],
    ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${url}`],
    ["Email", `mailto:?subject=${text}&body=${url}`],
  ];
  return `<ul class="share" aria-label="Share this story">
  ${links.map(([n, h]) => `<li><a href="${h}"${n === "Email" ? "" : ' target="_blank" rel="noopener"'}>${n}${n === "Email" ? "" : '<span class="visually-hidden"> (opens in a new tab)</span>'}</a></li>`).join("")}
  <li><button type="button" class="copy" data-url="${esc(absolute(storyPath(s)))}" hidden>Copy link</button></li>
</ul>`;
}

const COPY_JS = `<script>document.querySelectorAll(".copy").forEach(function(b){if(!navigator.clipboard)return;b.hidden=false;b.addEventListener("click",function(){navigator.clipboard.writeText(b.dataset.url).then(function(){b.textContent="Link copied";setTimeout(function(){b.textContent="Copy link"},2000)})})})</script>`;

function related(s, all) {
  const same = all.filter((o) => o !== s && o.category === s.category);
  const near = same.sort((a, b) => Math.abs(a.pos - s.pos) - Math.abs(b.pos - s.pos)).slice(0, 3);
  const extra = all.filter((o) => o !== s && o.category !== s.category && (o.category === "features" || o.category === "research")).slice(0, 4 - near.length);
  return [...near, ...extra].slice(0, 4);
}

function jsonLd(s, c) {
  const url = absolute(storyPath(s));
  return [{
    "@context": "https://schema.org", "@type": "NewsArticle",
    mainEntityOfPage: url, url, headline: s.headline.slice(0, 110),
    description: s.dek, datePublished: s.date, dateModified: s.date, articleSection: c.name, keywords: s.tags.join(", ") || undefined,
    wordCount: s.minutes * 230, inLanguage: "en-US", isAccessibleForFree: true,
    image: [absolute("/assets/og-default.png")],
    author: { "@type": "Organization", name: s.author, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.publisher, url: SITE.home, logo: { "@type": "ImageObject", url: absolute("/assets/apple-touch-icon.png"), width: 180, height: 180 } },
  }, {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "News", item: SITE.url + "/" },
      { "@type": "ListItem", position: 2, name: c.name, item: absolute(`/${c.id}/`) },
      { "@type": "ListItem", position: 3, name: s.headline, item: url },
    ],
  }];
}

export function renderArticle(s, all, papers) {
  const c = category(s.category);
  const paper = papers.get(s.source);
  const canonical = paper ? `${BLOG}/paper/${paper}` : undefined;
  const takeaways = s.takeaways.length >= 2 ? `<aside class="takeaways" aria-labelledby="kt-${s.slug}">
    <h2 id="kt-${s.slug}">Key takeaways</h2>
    <ul>${s.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
  </aside>` : "";
  const tags = s.tags.length ? `<ul class="tags" aria-label="Tags">${s.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "";
  const rel = related(s, all);
  const body = `<article class="wrap story-page">
  <header class="story-head">
    <p class="eyebrow"><a href="/${c.id}/">${esc(c.name)}</a></p>
    <h1>${esc(s.headline)}</h1>
    <p class="dek">${esc(s.dek)}</p>
    <div class="byline-row">
      <p class="byline">Written by <strong>${esc(s.author)}</strong><br><time datetime="${s.date}">${displayDate(s.date)}</time><span aria-hidden="true"> · </span>${s.minutes} min read</p>
      ${share(s)}
    </div>
  </header>
  <figure class="story-hero">${heroArt(s, { cls: "art" })}</figure>
  <div class="story-body">
    ${takeaways}
    <div class="prose">${s.html}</div>
    ${tags}
  </div>
</article>
${rel.length ? `<section class="wrap related" aria-labelledby="related-head"><h2 id="related-head">Related stories</h2><div class="story-grid">${rel.map((r) => teaser(r, { heading: "h3", dek: false })).join("\n")}</div></section>` : ""}
${COPY_JS}`;
  const head = `<meta property="article:published_time" content="${s.date}">
<meta property="article:section" content="${esc(c.name)}">
${s.tags.map((t) => `<meta property="article:tag" content="${esc(t)}">`).join("\n")}
<script type="application/ld+json">${JSON.stringify(jsonLd(s, c)).replace(/</g, "\\u003c")}</script>`;
  return page({ title: s.headline, description: s.dek, path: storyPath(s), current: c.id, head, body, ogType: "article", canonical });
}
