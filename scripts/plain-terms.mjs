// Plain words for readers. The blog's working vocabulary ("calendar walk",
// "dispatch", "recovery", "batch") is replaced with common terms, and
// "old-time radio" is always hyphenated.

import { OPS, dropNumbers } from "./plain-body.mjs";

const MONTH = "(?:January|February|March|April|May|June|July|August|September|October|November|December)";

function matchCase(found, word) {
  if (found === found.toUpperCase() && found !== found.toLowerCase()) return word.toUpperCase();
  if (found[0] === found[0].toUpperCase()) {
    const titled = found.split(/[\s-]+/).every((w) => !w || w[0] === w[0].toUpperCase());
    return titled ? word.replace(/(^|[\s-])([a-z])/g, (m, p, c) => (["by", "of"].includes(word.slice(word.indexOf(m) + p.length).split(/[\s-]/)[0]) ? m : p + c.toUpperCase())) : word[0].toUpperCase() + word.slice(1);
  }
  return word;
}

const TERMS = [
  // "Old Time Radio Researchers" is an organisation's proper name; leave it.
  [/\bold[ -]time radio\b(?! Researchers)/gi, "old-time radio"],
  [/\barchival dispatch(es)?\b/gi, (m, s) => (s ? "reports" : "report")],
  [/\bdispatch(es)?\b/gi, (m, s) => (s ? "reports" : "report")],
  [/\bcalendar[- ](?:walk|sweep)s?\b/gi, "day-by-day review"],
  [/\bwalk[- ]\d+\b/gi, "review"],
  // "walk" as the blog's name for its date-by-date pass; "walk-off", "walk-on" and titles stay.
  [/\b(chronological|sequential|archival|calendar|daily|this|the|its|[\d–-]+) walk\b(?![- ](?:off|on)\b)/gi, (m, lead) => `${lead} review`],
  [/\brecover(y|ies|ed|ing|s)?\b/gi, (m, s = "") => ({ "": "restore", y: "restoration", ies: "restorations", ed: "restored", ing: "restoring", s: "restores" })[s.toLowerCase()]],
];

/** Rewrites one plain-text string. ops adds the bookkeeping words (batch, enrichment, ...). */
export function plainTerms(text, { ops = true } = {}) {
  let out = ops ? dropNumbers(String(text)) : String(text);
  for (const [re, to] of ops ? [...TERMS, ...OPS] : TERMS) {
    out = out.replace(re, (...args) => matchCase(args[0], typeof to === "function" ? to(...args) : to));
  }
  return out;
}

/** Rewrites only the text of an HTML fragment: never tags, attributes, code or pre. */
export function plainTermsHtml(html, opts) {
  let skip = 0;
  return html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith("<")) {
      if (/^<(code|pre)\b/i.test(part)) skip++;
      else if (/^<\/(code|pre)>/i.test(part)) skip = Math.max(0, skip - 1);
      return part;
    }
    return skip ? part.replace(TERMS[0][0], (m) => matchCase(m, "old-time radio")) : plainTerms(part, opts);
  }).join("");
}

const HEADLINE_RULES = [
  [new RegExp(`^(${MONTH}(?: \\d{1,2}(?:/\\d{1,2})?)?)(?: Calendar)? (?:Walk|Sweep|Day|Serial)\\b.*?(\\((?:\\d{4})(?:[–-]\\d{4})?\\))?$`), (m, day, years) => `On This Day, ${day}${years ? ` ${years}` : ""}`],
  [new RegExp(`^(${MONTH} \\d{1,2}) Complete$`), (m, day) => `On This Day, ${day}`],
  [/^Undated Broadcast Resolution.*$/, () => "Undated Broadcasts Identified"],
  [/^(?:Post-\d+ )?Audio Enrichment Batch \d+$/, () => "Archive Update"],
  [/^Batch \d+ (\(.*\))$/, (m, years) => `Archive Update ${years}`],
];

/** Turns the blog's internal headline prefix into a plain one. */
export function plainHeadline(left) {
  for (const [re, to] of HEADLINE_RULES) if (re.test(left)) return left.replace(re, to);
  return plainTerms(left.replace(/\s*\(Batch \d+\)/, ""));
}
