// Front page and paginated section pages.
import { CATEGORIES, category } from "./categories.mjs";
import { page, SITE, absolute } from "./layout.mjs";
import { teaser, grid, storyPath } from "./teaser.mjs";
import { esc } from "./markdown.mjs";

export const PER_PAGE = 24;

function pickLead(stories) {
  // Lead with the newest feature or research story when one is recent; otherwise the newest story.
  const editorial = stories.find((s) => s.category === "features" || s.category === "research");
  return editorial && editorial.date >= stories[Math.min(40, stories.length - 1)].date ? editorial : stories[0];
}

export function renderHome(stories) {
  const lead = pickLead(stories);
  const rest = stories.filter((s) => s !== lead);
  const top = rest.slice(0, 4);
  const shown = new Set([lead, ...top]);
  const sections = CATEGORIES.map((c) => {
    const items = stories.filter((s) => s.category === c.id && !shown.has(s)).slice(0, 3);
    if (!items.length) return "";
    return `<section class="section" aria-labelledby="sec-${c.id}">
  <div class="section-head"><h2 id="sec-${c.id}">${esc(c.name)}</h2><a class="more" href="/${c.id}/">See all ${esc(c.name.toLowerCase())}<span class="visually-hidden"> stories</span><span aria-hidden="true"> →</span></a></div>
  ${grid(items, { heading: "h3" })}
</section>`;
  }).join("\n");
  const body = `<h1 class="visually-hidden">${esc(SITE.name)}: ${esc(SITE.tagline)}</h1>
<div class="wrap">
  <section class="lead-row" aria-label="Top stories">
    ${teaser(lead, { size: "lead", heading: "h2" })}
    <div class="top-list">
      <h2 class="rail-head">Latest news</h2>
      ${top.map((s) => teaser(s, { size: "compact", heading: "h3" })).join("\n")}
    </div>
  </section>
  ${sections}
  <p class="all-link"><a class="button" href="/latest/">Browse all ${stories.length.toLocaleString("en-US")} stories</a></p>
</div>`;
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: SITE.name, url: SITE.url + "/", description: SITE.description,
    publisher: { "@type": "Organization", name: SITE.publisher, url: SITE.home, logo: absolute("/assets/apple-touch-icon.png") },
    mainEntity: { "@type": "ItemList", itemListElement: [lead, ...top].map((s, i) => ({ "@type": "ListItem", position: i + 1, url: absolute(storyPath(s)) })) } };
  return page({ title: SITE.name, description: SITE.description, path: "/", body, head: `<script type="application/ld+json">${JSON.stringify(ld)}</script>` });
}

function pager(base, n, pages) {
  if (pages <= 1) return "";
  const href = (i) => (i === 1 ? base : `${base}page/${i}/`);
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - n) <= 2) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const links = nums.map((i) => (i === "…" ? `<li aria-hidden="true">…</li>` : `<li><a href="${href(i)}"${i === n ? ' aria-current="page"' : ""}><span class="visually-hidden">Page </span>${i}</a></li>`)).join("");
  return `<nav class="pager" aria-label="Pages"><ul>${n > 1 ? `<li><a href="${href(n - 1)}" rel="prev">Newer</a></li>` : ""}${links}${n < pages ? `<li><a href="${href(n + 1)}" rel="next">Older</a></li>` : ""}</ul></nav>`;
}

/** Returns [{ path, html }] for every page of one listing. */
export function renderListing({ id, name, blurb, stories }) {
  const base = `/${id}/`;
  const pages = Math.max(1, Math.ceil(stories.length / PER_PAGE));
  const out = [];
  for (let n = 1; n <= pages; n++) {
    const slice = stories.slice((n - 1) * PER_PAGE, n * PER_PAGE);
    const path = n === 1 ? base : `${base}page/${n}/`;
    const title = n === 1 ? name : `${name}, page ${n}`;
    const body = `<div class="wrap">
  <header class="listing-head"><h1>${esc(title)}</h1><p>${esc(blurb)}</p><p class="count">${stories.length.toLocaleString("en-US")} stories</p></header>
  ${grid(slice, { heading: "h2" })}
  ${pager(base, n, pages)}
</div>`;
    out.push({ path, html: page({ title, description: blurb, path, current: category(id) ? id : "", body }) });
  }
  return out;
}
