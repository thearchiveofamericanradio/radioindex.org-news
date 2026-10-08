// Newsroom sections. Order is nav order; first matching rule wins.
export const CATEGORIES = [
  { id: "news", name: "News", blurb: "Daily reports on old-time radio broadcasts added to the archive, dated and identified." },
  { id: "features", name: "Features", blurb: "Stories about finding, dating and restoring old-time radio." },
  { id: "research", name: "Research", blurb: "Technical reports and methods from the archive." },
];

/** Section ids used by earlier builds, for redirects. */
export const RETIRED = new Map([["calendar-walks", "news"], ["recoveries", "news"]]);

const RULES = [
  { test: (s) => /dating-the-undated|register-awl|title-hygiene/.test(s), id: "research" },
  { test: (s, t) => /-walk-|calendar-walk|oct-walk|-oct-1-|batch|enrichment|^\d{4}-\d{2}-\d{2}-(august|september|october)-\d/.test(s) || /Calendar (Walk|Day)/i.test(t), id: "news" },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryFor(slug, title) {
  const rule = RULES.find((r) => r.test(slug, title));
  return rule ? rule.id : "features";
}

export function category(id) {
  return BY_ID.get(id);
}
