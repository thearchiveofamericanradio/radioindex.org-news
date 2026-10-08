// Markdown to HTML for story bodies, plus a plain-text reducer.
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

const ALERT_RE = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gim;

export function renderMarkdown(md) {
  const withAlerts = md.replace(ALERT_RE, (_, kind, lines) => {
    const inner = lines.split("\n").map((l) => l.replace(/^>\s?/, "")).join("\n").trim();
    return `<aside class="note note-${kind.toLowerCase()}"><p class="note-title">${kind[0] + kind.slice(1).toLowerCase()}</p>${marked.parse(inner)}</aside>\n\n`;
  });
  let html = marked.parse(withAlerts);
  // Wide archival tables scroll inside their own frame on phones.
  html = html.replace(/<table>/g, '<div class="table-scroll" tabindex="0" role="region" aria-label="Table"><table>').replace(/<\/table>/g, "</table></div>");
  // The story page owns the h1; demote any h1 inside the body.
  html = html.replace(/<h1([ >])/g, "<h2$1").replace(/<\/h1>/g, "</h2>");
  return html;
}

export function plain(md) {
  return String(md)
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*\|.*\|\s*$/gm, " ")
    .replace(/[#*_`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
