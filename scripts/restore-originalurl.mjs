// Restore originalUrl front-matter to absolute form after fix-links.mjs relativized it.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const roots = ["content/pages", "content/posts"].map(p => fileURLToPath(new URL("../" + p + "/", import.meta.url)));
let changed = 0;
for (const root of roots) {
  for (const f of readdirSync(root)) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(root, f);
    let t = readFileSync(p, "utf8");
    const before = t;
    t = t.replace(/^originalUrl:\s*"?\/([^"\n]*)"?\s*$/m, (m, pth) => `originalUrl: "https://www.beautifyearth.org/${pth}"`);
    t = t.replace(/^originalUrl:\s*""\s*$/m, `originalUrl: "https://www.beautifyearth.org"`);
    if (t !== before) { writeFileSync(p, t); changed++; }
  }
}
console.log(changed + " originalUrl fields restored");
