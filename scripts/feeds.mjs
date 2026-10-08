// RSS 2.0, Atom 1.0, JSON Feed and sitemap.
import { SITE, absolute } from "./layout.mjs";
import { category } from "./categories.mjs";
import { storyPath } from "./teaser.mjs";
import { esc } from "./markdown.mjs";

const FEED_SIZE = 50;
const cdata = (s) => `<![CDATA[${String(s).replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
const rfc822 = (d) => new Date(`${d}T12:00:00Z`).toUTCString();
const iso = (d) => `${d}T12:00:00Z`;

export function rss(stories) {
  const items = stories.slice(0, FEED_SIZE).map((s) => `<item><title>${cdata(s.headline)}</title><link>${absolute(storyPath(s))}</link><guid isPermaLink="true">${absolute(storyPath(s))}</guid><pubDate>${rfc822(s.date)}</pubDate><category>${esc(category(s.category).name)}</category><description>${cdata(s.dek)}</description><content:encoded>${cdata(s.html)}</content:encoded></item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel><title>${esc(SITE.name)}</title><link>${SITE.url}/</link><description>${esc(SITE.description)}</description><language>en-us</language>
<atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/><lastBuildDate>${rfc822(stories[0].date)}</lastBuildDate>
${items}
</channel></rss>
`;
}

export function atom(stories) {
  const entries = stories.slice(0, FEED_SIZE).map((s) => `<entry><title>${esc(s.headline)}</title><link href="${absolute(storyPath(s))}"/><id>${absolute(storyPath(s))}</id><published>${iso(s.date)}</published><updated>${iso(s.date)}</updated><author><name>${esc(s.author)}</name></author><category term="${esc(category(s.category).name)}"/><summary>${esc(s.dek)}</summary><content type="html">${esc(s.html)}</content></entry>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"><title>${esc(SITE.name)}</title><subtitle>${esc(SITE.tagline)}</subtitle><link href="${SITE.url}/"/><link rel="self" href="${SITE.url}/atom.xml"/><id>${SITE.url}/</id><updated>${iso(stories[0].date)}</updated>
${entries}
</feed>
`;
}

export function jsonFeed(stories) {
  return JSON.stringify({ version: "https://jsonfeed.org/version/1.1", title: SITE.name, home_page_url: SITE.url + "/", feed_url: SITE.url + "/feed.json", description: SITE.description,
    items: stories.slice(0, FEED_SIZE).map((s) => ({ id: absolute(storyPath(s)), url: absolute(storyPath(s)), title: s.headline, summary: s.dek, content_html: s.html, date_published: iso(s.date), tags: [category(s.category).name, ...s.tags] })) });
}

export function sitemap(paths) {
  const urls = paths.map(({ path, lastmod }) => `<url><loc>${absolute(path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
