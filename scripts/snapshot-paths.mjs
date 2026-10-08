// Adds every story's current path to data/past-paths.json so later slug changes keep redirecting.
import fs from "node:fs";
import path from "node:path";
import { loadPosts } from "./load-posts.mjs";
import { storyPath } from "./teaser.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const file = path.join(ROOT, "data/past-paths.json");
const past = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
for (const s of loadPosts(path.resolve(process.env.BLOG_DIR || path.join(ROOT, "blog")), today)) {
  past[s.source] = [...new Set([...(past[s.source] || []), storyPath(s)])];
}
fs.writeFileSync(file, JSON.stringify(past).replace(/\],/g, "],\n") + "\n");
console.log(`${Object.keys(past).length} stories in ${path.relative(ROOT, file)}`);
