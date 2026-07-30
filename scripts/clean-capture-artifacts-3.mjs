// One-time pass 3: remaining Wix-capture scaffold headings.
// - REMOVE_KEEP: label headings whose content below is real -> drop heading only
// - REMOVE_BLOCK: chrome-duplicate headings -> drop heading + following list block
// - "X Section" -> "X" for everything else
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const roots = ["content/pages", "content/posts"].map(p => fileURLToPath(new URL("../" + p + "/", import.meta.url)));

const REMOVE_KEEP = new Set([
  "main content", "main content section", "main section", "hero section",
  "team section", "call-to-action links", "call-to-action section",
]);
const REMOVE_BLOCK = new Set([
  "category links", "footer links", "footer section", "recent posts section",
  "legal navigation links", "social media icons & links", "navigation header",
]);

const heading = /^(#{2,4})\s*(.+?):?\s*$/;

let changed = 0;
for (const root of roots) {
  for (const f of readdirSync(root)) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(root, f);
    const lines = readFileSync(p, "utf8").split("\n");
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(heading);
      if (m) {
        const label = m[2].toLowerCase();
        if (REMOVE_KEEP.has(label)) continue;
        if (REMOVE_BLOCK.has(label)) {
          let j = i + 1;
          while (j < lines.length && lines[j].trim() === "") j++;
          while (j < lines.length && /^(-|\*|\d+\.)\s/.test(lines[j])) j++;
          i = j - 1;
          continue;
        }
        const sec = m[2].match(/^(.+?)\s+Section$/);
        if (sec) { out.push(`${m[1]} ${sec[1]}`); continue; }
      }
      out.push(lines[i]);
    }
    const result = out.join("\n").replace(/\n{4,}/g, "\n\n\n");
    if (result !== lines.join("\n")) { writeFileSync(p, result); changed++; console.log("cleaned", f); }
  }
}
console.log(`\n${changed} files cleaned.`);
