// Deterministic, text-free hero art per story: radio waves over a tuning dial.
const HUES = new Map([
  ["features", ["#7a3a00", "#F08A0C"]],
  ["research", ["#001a66", "#0050EE"]],
  ["news", ["#2b1b4d", "#7d4cdb"]],
]);

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function heroArt(story, { cls = "art", label = "" } = {}) {
  const [deep, lift] = HUES.get(story.category) || HUES.get("features");
  const h = hash(story.slug);
  const cx = 160 + (h % 880);
  const needle = 90 + ((h >>> 8) % 1020);
  const id = `g${h.toString(36)}`;
  const rings = Array.from({ length: 9 }, (_, i) => `<circle cx="${cx}" cy="700" r="${120 + i * 95}"/>`).join("");
  const ticks = Array.from({ length: 49 }, (_, i) => {
    const x = 60 + i * 22.5;
    return `<line x1="${x}" x2="${x}" y1="${i % 4 ? 586 : 572}" y2="600"/>`;
  }).join("");
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="${cls}" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice" ${a11y} focusable="false" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lift}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs><rect width="1200" height="675" fill="url(#${id})"/><g fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="3">${rings}</g><rect x="40" y="556" width="1120" height="64" rx="32" fill="#000" fill-opacity=".28"/><g stroke="#fff" stroke-opacity=".55" stroke-width="2">${ticks}</g><rect x="${needle}" y="548" width="6" height="80" rx="3" fill="#F08A0C"/></svg>`;
}
