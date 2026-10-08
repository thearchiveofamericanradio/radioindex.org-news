// Reads the blog repo's posts/ and turns each into a news story record.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { renderMarkdown, plain } from "./markdown.mjs";
import { categoryFor } from "./categories.mjs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function readFrontMatter(raw) {
  if (!raw.startsWith("---\n")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 4);
  if (end < 0) return { meta: {}, body: raw };
  const meta = {};
  for (const line of raw.slice(4, end).split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith("[")) {
      try { v = JSON.parse(v); } catch { v = v.slice(1, -1).split(",").map((s) => s.trim().replace(/^"|"$/g, "")); }
    } else v = v.replace(/^"|"$/g, "");
    meta[m[1]] = v;
  }
  return { meta, body: raw.slice(end + 4) };
}

function readInlineMeta(body) {
  const lines = body.split("\n");
  const meta = {};
  let start = 0;
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const line = lines[i].trim();
    const field = line.match(/^(?:\*\*)?(Date|Author|Tags)(?:\*\*)?:\s*(.*)$/);
    if (line.startsWith("# ") && !meta.title) { meta.title = line.slice(2).trim(); start = i + 1; }
    else if (field) { meta[field[1].toLowerCase()] = field[2].trim(); start = i + 1; }
    else if (line === "---" && meta.date) { start = i + 1; break; }
  }
  if (typeof meta.tags === "string") meta.tags = meta.tags.split(",").map((t) => t.trim()).filter(Boolean);
  return { meta, body: lines.slice(start).join("\n") };
}

/** First date each post file was added to the blog repo, from git history. */
export function gitAddedDates(blogDir) {
  const out = new Map();
  try {
    const log = execFileSync("git", ["-C", blogDir, "log", "--diff-filter=A", "--format=>%cs", "--name-only", "--", "posts/"], { encoding: "utf8", maxBuffer: 64 << 20 });
    let day = "";
    for (const line of log.split("\n")) {
      if (line.startsWith(">")) day = line.slice(1);
      else if (line.startsWith("posts/")) out.set(path.basename(line, ".md"), day); // log is newest-first, so the last write is the oldest add
    }
  } catch { /* shallow or missing history: fall back to the post's own date */ }
  return out;
}

/** Splits "a, b (c, d), and e" into items, ignoring commas inside brackets or quotes. */
function items(text) {
  const out = [];
  let depth = 0, cur = "";
  for (const ch of text) {
    if ("([".includes(ch)) depth++;
    if (")]".includes(ch)) depth = Math.max(0, depth - 1);
    if ((ch === "," || ch === "&") && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((t) => t.trim().replace(/^(and|&)\s+/i, "").trim()).filter(Boolean);
}

function headlineAndDek(title, body) {
  const clean = title.replace(/^Archival (Dispatch|Calendar Walk):\s*/, "").replace(/\s+/g, " ").trim();
  const firstPara = body.split(/\n\s*\n/).map((p) => p.trim())
    .find((p) => p && !/^(#|\||-|\d+\.|\*\*[A-Z][\w ]+\*\*:|>|`|<)/.test(p) && p.length > 60) || "";
  const lead = plain(firstPara);
  const parts = clean.split(/\s+—\s+/);
  if (parts.length < 2) return { headline: clean, dek: lead };
  const subject = parts.slice(1).join(" — ").replace(/^100% (Enriched|Complete),?\s*/i, "");
  const list = items(subject);
  // Headline: "October 8 Calendar Walk: Don Larsen Perfect Game and 12 Postseason Baseball Classics"
  let take = 1;
  if (list.length > 1 && `${parts[0]}: ${list[0]} and ${list[1]}`.length <= 96) take = 2;
  const named = take === 2 ? `${list[0]} and ${list[1]}` : list[0];
  if (`${parts[0]}: ${named}`.length > 120) return { headline: parts[0], dek: subject };
  const restItems = list.slice(take);
  const dek = restItems.length ? `Also in this dispatch: ${restItems.join(", ")}.` : lead;
  return { headline: `${parts[0]}: ${named}`, dek };
}

const TECHNICAL = /[0-9a-f]{8}-[0-9a-f]{4}|\.json|catalog\/|meta\/|`/i;

/** Featured broadcasts from an archival inventory table: canonical title, year, synopsis. */
function fromInventory(body) {
  const lines = body.split("\n");
  const head = lines.findIndex((l) => /^\|.*Canonical/i.test(l));
  if (head < 0) return [];
  const out = [];
  for (const row of lines.slice(head + 2)) {
    if (!row.startsWith("|")) break;
    const title = (row.match(/\*\*"([^"]+)"\*\*/) || [])[1];
    if (!title) continue;
    const year = (row.match(/\b(1[89]\d\d|20[0-2]\d)-\d\d-\d\d\b/) || [])[1];
    const synopsis = (row.match(/\*\*Synopsis\*\*:\s*([^<|]+)/) || [])[1];
    out.push(plain(`${title}${year && !title.includes(year) ? ` (${year})` : ""}${synopsis ? `: ${synopsis.trim()}` : ""}`));
  }
  return out;
}

function takeaways(body) {
  const inventory = fromInventory(body);
  if (inventory.length >= 2) return inventory.slice(0, 4);
  const strip = (s) => plain(s).replace(/^([A-Z]|\d+)[.)]\s+/, "").trim();
  const listed = [...body.matchAll(/^#{3,4}\s+((?:[A-Z]|\d+)[.)]\s+.+)$/gm)].map((m) => m[1]).filter((t) => !TECHNICAL.test(t)).map(strip);
  if (listed.length >= 2) return listed.slice(0, 4);
  const h3 = [...body.matchAll(/^#{3,4}\s+(.+)$/gm)].map((m) => m[1]).filter((t) => !TECHNICAL.test(t)).map(strip);
  const useful = h3.filter((t) => t.length > 24 && !/^(summary|overview|notes?|sources?|methodology|cardinal|quality)\b/i.test(t));
  if (useful.length >= 3) return useful.slice(0, 4);
  const bullets = [...body.matchAll(/^(?:[-*]|\d+\.)\s+(.+)$/gm)].map((m) => m[1]).filter((t) => !TECHNICAL.test(t)).map(strip).filter((t) => t.length >= 30 && t.length <= 260);
  if (bullets.length >= 2) return bullets.slice(0, 4);
  return [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => strip(m[1])).filter((t) => t.length > 8 && !TECHNICAL.test(t)).slice(0, 4);
}

export function clamp(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:—–-]+$/, "") + "…";
}

export function loadPosts(blogDir, today) {
  const dir = path.join(blogDir, "posts");
  const added = gitAddedDates(blogDir);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const stories = files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(dir, file), "utf8").replace(/\r\n/g, "\n");
    const fm = readFrontMatter(raw);
    const inline = readInlineMeta(fm.body);
    const meta = { ...inline.meta, ...fm.meta };
    let body = inline.body.trim();
    const title = (meta.title || slug).trim();
    body = body.replace(new RegExp(`^#{1,3}\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\n`), "");
    const fileDay = slug.slice(0, 10);
    const stated = DATE_RE.test(String(meta.date)) ? String(meta.date) : (DATE_RE.test(fileDay) ? fileDay : today);
    // A calendar walk is named for the broadcast day it covers, which can be ahead
    // of the day it went up. Publish date is never in the future.
    const date = stated > today ? (added.get(slug) && added.get(slug) <= today ? added.get(slug) : today) : stated;
    const { headline, dek } = headlineAndDek(title, body);
    const text = plain(body);
    const words = text.split(/\s+/).filter(Boolean).length;
    const author = !meta.author || /^radio ?index$/i.test(meta.author) ? "Radio Index Newsroom" : meta.author;
    return {
      slug, title, headline, dek: clamp(dek || text, 240), date, author,
      tags: (Array.isArray(meta.tags) ? meta.tags : []).slice(0, 12),
      category: categoryFor(slug, title),
      takeaways: takeaways(body).map((t) => clamp(t, 200)),
      minutes: Math.max(1, Math.round(words / 230)),
      html: renderMarkdown(body),
      summary: clamp(text, 300),
    };
  });
  stories.sort((a, b) => (b.date === a.date ? b.slug.localeCompare(a.slug) : b.date.localeCompare(a.date)));
  return stories;
}
