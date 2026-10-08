// Story teasers used on the front page, section pages and related stories.
import { category } from "./categories.mjs";
import { heroArt } from "./art.mjs";
import { esc } from "./markdown.mjs";

export function storyPath(s) {
  return `/${s.category}/${s.slug}/`;
}

export function displayDate(iso) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function meta(s) {
  return `<p class="story-meta"><time datetime="${s.date}">${displayDate(s.date)}</time><span aria-hidden="true"> · </span>${s.minutes} min read</p>`;
}

/** size: "lead" | "standard" | "compact" */
export function teaser(s, { size = "standard", heading = "h3", dek = true } = {}) {
  const c = category(s.category);
  return `<article class="story story-${size}">
  <a class="story-link" href="${storyPath(s)}">
    <div class="story-art">${heroArt(s)}</div>
    <div class="story-text">
      <p class="eyebrow">${esc(c.name)}</p>
      <${heading} class="story-title">${esc(s.headline)}</${heading}>
      ${dek && size !== "compact" ? `<p class="story-dek">${esc(s.dek)}</p>` : ""}
      ${meta(s)}
    </div>
  </a>
</article>`;
}

export function grid(stories, opts) {
  return `<div class="story-grid">${stories.map((s) => teaser(s, opts)).join("\n")}</div>`;
}
