// Removes the blog's internal bookkeeping from news and feature bodies and puts
// the remaining labels and words into plain English. Research papers are left as written.

const DROP_SECTION = /verification summary|quality gates|integrity metrics|cardinal rules?|compliance|invariants?|grounded verification|multi-repo status|operational rhythm|cumulative (summary|progress)|progress tracker/i;

const DROP_LABEL = /^\s*(?:[-*]|\d+\.)\s+\*\*(?:Target Repositories Synchronized|UUID|Identifier|Audio SHA256|Subtitle SHA256|Batch Index|Batch Scope|ASR Ladder|Zero Synthesis[^*]*|Cumulative Resolved[^*]*|Broadcasts Resolved This (?:Increment|Batch)|Total Dated Targets[^*]*|Active [^*]*Remaining|Series Target|Quality Verification|Subtitles|Metadata|Two-Way Parity|Completion Level|Invariant[^*]*|[^*]*Subtitles Deployed|VTT SHA256|[^*]*SHA256[^*]*)\*\*/i;

const LABELS = [
  [/\*\*Target Calendar Day\*\*/g, "**Date**"],
  [/\*\*(?:Discovered Insights|Archival Discovery)\*\*/g, "**Background**"],
  [/\*\*Newspaper Log\*\*/g, "**Newspaper listing**"],
  [/\*\*(?:Verified )?Synopsis(?: \(\d+ chars\))?\*\*/g, "**Synopsis**"],
  [/\*\*Primary Source Citation\*\*/g, "**Source**"],
  [/\*\*Extracted Archival Ground Truth\*\*/g, "**What we found**"],
  [/\*\*Audio Duration\*\*/g, "**Length**"],
  [/^(#{2,4}\s+(?:\d+\.\s+)?)\*?(?:Master Evidence & Archival Table|.*Archival Inventory.*)\*?\s*$/gim, "$1Broadcasts"],
  [/^(#{2,4}\s+(?:\d+\.\s+)?)(?:Archival Discoveries & Grounded \d+-Sentence Synopses|Key Historical & Archival Insights Extracted|Key Archival & Production Highlights)\s*$/gim, "$1Highlights"],
  [/^(#{2,4}\s+(?:\d+\.\s+)?)Grounded \d+-Sentence Synopses.*$/gim, "$1Synopses"],
  [/\bCanonical Clean Title\b|\bCanonical Title\b/g, "Title"],
];

/** Inventory tables open with a column of source file names; readers get the table without it. */
function dropFilenameColumn(md) {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (!/^\|\s*[^|]*Filename/i.test(lines[i])) continue;
    for (let j = i; j < lines.length && lines[j].startsWith("|"); j++) lines[j] = "|" + lines[j].split("|").slice(2).join("|");
  }
  return lines.join("\n");
}

function dropSections(md) {
  const lines = md.split("\n");
  const out = [];
  let dropLevel = 0;
  for (const line of lines) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      if (dropLevel && level <= dropLevel) dropLevel = 0;
      if (!dropLevel && DROP_SECTION.test(h[2])) { dropLevel = level; continue; }
    }
    if (!dropLevel && !DROP_LABEL.test(line)) out.push(line);
  }
  return out.join("\n").replace(/(\n---\s*){2,}/g, "\n---\n").replace(/\n---\s*$/, "\n");
}

export function plainBody(md) {
  // Fenced blocks in reports are pipeline diagrams and file paths, not reading.
  let out = dropSections(dropFilenameColumn(md).replace(/^```[\s\S]*?^```\s*$/gm, "")
    // Parenthesised pointers to internal files and hashes.
    .replace(/\s*\(`[^`]*(?:\/|sha256|\.md|\.json)[^`]*`\)/gi, "")
    .replace(/^\s*[-*]\s+(?:WebVTT )?Subtitles Deployed:.*$/gim, ""));
  for (const [re, to] of LABELS) out = out.replace(re, to);
  return out;
}

/** Batch and increment numbers are dropped; where the sentence needs a subject it becomes "this update". */
export function dropNumbers(text) {
  return text
    .replace(/\s*\((?:Milestone |Final )?(?:Batch|Increment) \d+[^)]*\)/gi, "")
    .replace(/\b(?:Milestone |Final )?(?:Batch|Increment) \d+(?: Completion)?!?:?\s+(?=[A-Z"“])/g, "")
    .replace(/(^|[.!?]\s+|>)(?:Batch|Increment) \d+\b/g, "$1This update")
    .replace(/\b(?:batch|increment) \d+\b/gi, "this update");
}

const OPS = [
  [/\bbatch(es)?\b/gi, (m, s) => (s ? "updates" : "update")],
  [/\bincrements?\b/gi, (m) => (/s$/i.test(m) ? "updates" : "update")],
  [/\b(?:archival )?(?:metadata )?enrich(ment|ments|ed|es|ing)?\b/gi, (m, s = "") => ({ "": "update", ment: "update", ments: "updates", ed: "updated", es: "updates", ing: "updating" })[s.toLowerCase()]],
  [/\bupdate of this update\b/gi, "update"],
  [/\bMaster Undated Resolution Pipeline\b/g, "Undated broadcasts project"],
  [/\bcalendar days?\b/gi, (m) => (/s$/i.test(m) ? "days" : "day")],
  [/\bsweep(s)?\b/gi, (m, s) => (s ? "reviews" : "review")],
  [/\bcanonical(?: clean)? (title|name)(s)?\b/gi, (m, w, s) => w + (s || "")],
  [/\bcanonical\b/gi, "standard"],
  [/\bscraper(s)?\b/gi, (m, s) => (s ? "downloads" : "download")],
  [/\brip numbers?\b/gi, (m) => (/s$/i.test(m) ? "file numbers" : "file number")],
  [/\bparity\b/gi, "match"],
  [/\bneural (?:ASR )?transcription\b/gi, "AI transcription"],
  [/\bASR\b/g, "speech recognition"],
  [/\bzero[- ]synthesis\b/gi, "no invented details"],
  [/\bground truth\b/gi, "facts"],
];

export { OPS };
