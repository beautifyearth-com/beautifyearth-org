// One-time pass 2: remove remaining site-chrome duplicates from content.
// - bare "©20xx Beautify Earth..." lines
// - the header logo image linking to beautifyearth.com
// - runs of >=3 consecutive list items that are pure nav links (Artists/Contact/...)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const roots = ["content/pages", "content/posts"].map(p => fileURLToPath(new URL("../" + p + "/", import.meta.url)));

const NAV_LABELS = new Set(["artists", "contact", "schools", "donate", "sign up", "sign in", "blog", "about", "news", "privacy", "terms", "home", "faq", "how it works", "learn"]);
const navItem = /^-\s*\[([^\]]+)\]\((https?:\/\/(www\.)?(art\.)?beautifyearth\.(com|org)[^)]*)\)\s*$/;
const copyright = /^©20\d\d Beautify Earth\. All Rights Reserved\s*$/;
const logo = /^\[!\[Asset 5\.png\]\(\/images\/[^)]+\)\]\(https?:\/\/(www\.)?beautifyearth\.com\/?\)\s*$/;

let changed = 0;
for (const root of roots) {
  for (const f of readdirSync(root)) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(root, f);
    const lines = readFileSync(p, "utf8").split("\n");
    const drop = new Set();
    for (let i = 0; i < lines.length; i++) {
      if (copyright.test(lines[i]) || logo.test(lines[i])) { drop.add(i); continue; }
      const m = lines[i].match(navItem);
      if (m && NAV_LABELS.has(m[1].trim().toLowerCase())) {
        // extend the run
        let j = i;
        const run = [];
        while (j < lines.length) {
          const mm = lines[j].match(navItem);
          if (mm && NAV_LABELS.has(mm[1].trim().toLowerCase())) { run.push(j); j++; } else break;
        }
        if (run.length >= 3) run.forEach(k => drop.add(k));
        i = j - 1;
      }
    }
    if (!drop.size) continue;
    const result = lines.filter((_, i) => !drop.has(i)).join("\n").replace(/\n{4,}/g, "\n\n\n");
    writeFileSync(p, result);
    changed++;
    console.log("cleaned", f, `(-${drop.size} lines)`);
  }
}
console.log(`\n${changed} files cleaned.`);
