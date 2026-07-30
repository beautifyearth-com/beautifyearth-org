// Rewrites static.wixstatic.com URLs in content/ to local /images/ paths
// using image-url-map.json produced by download-images.mjs.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const map = JSON.parse(readFileSync(new URL("../image-url-map.json", import.meta.url)));
const roots = ["content/pages", "content/posts"].map(p => fileURLToPath(new URL("../" + p + "/", import.meta.url)));

let changed = 0;
for (const root of roots) {
  for (const f of readdirSync(root)) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(root, f);
    let txt = readFileSync(p, "utf8");
    const before = txt;
    // Replace any wixstatic URL whose base asset is in the map (params variant included)
    txt = txt.replace(/https:\/\/static\.wixstatic\.com\/media\/[^\s)"']+/g, (u) => {
      const base = u.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/)?.[1];
      return (base && map[base]) ? map[base] : u;
    });
    if (txt !== before) { writeFileSync(p, txt); changed++; }
  }
}
console.log(`Rewrote image URLs in ${changed} files.`);
