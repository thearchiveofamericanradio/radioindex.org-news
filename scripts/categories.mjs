// Newsroom sections. Order is nav order; first matching rule wins.
export const CATEGORIES = [
  { id: "features", name: "Features", blurb: "Long-form stories about recovering, dating and restoring American radio." },
  { id: "research", name: "Research", blurb: "Technical reports and methods from the archive." },
  { id: "calendar-walks", name: "Calendar walks", blurb: "Day-by-day dispatches from the walk through every broadcast date." },
  { id: "recoveries", name: "Recoveries", blurb: "Batch reports on undated and unidentified broadcasts, now dated and named." },
];

const RULES = [
  { test: (s) => /dating-the-undated|register-awl|title-hygiene/.test(s), id: "research" },
  { test: (s, t) => /-walk-|calendar-walk|oct-walk|-oct-1-|^\d{4}-\d{2}-\d{2}-(august|september|october)-\d/.test(s) || /Calendar (Walk|Day)/i.test(t), id: "calendar-walks" },
  { test: (s) => /batch|enrichment/.test(s), id: "recoveries" },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function categoryFor(slug, title) {
  const rule = RULES.find((r) => r.test(slug, title));
  return rule ? rule.id : "features";
}

export function category(id) {
  return BY_ID.get(id);
}
