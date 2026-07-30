// Retry images that failed the bare full-res fetch, using the original manifest
// URL (with Wix resize params) as a fallback. Merges results into image-url-map.json.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(readFileSync(new URL("../images-manifest.json", import.meta.url)));
const mapUrl = new URL("../image-url-map.json", import.meta.url);
const map = JSON.parse(readFileSync(mapUrl));
const outDir = fileURLToPath(new URL("../public/images/", import.meta.url));

function fullRes(u) {
  const m = u.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/);
  return m ? m[1] : u;
}

const seen = new Set();
for (const { url } of manifest) {
  const src = fullRes(url);
  if (map[src] || seen.has(src)) continue;
  seen.add(src);
  const name = createHash("md5").update(src).digest("hex").slice(0, 10) + "-" +
    decodeURIComponent(src.split("/").pop()).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const dest = path.join(outDir, name);
  for (const candidate of [url, src]) {
    try {
      const res = await fetch(candidate, { headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.beautifyearth.org/" } });
      if (!res.ok) throw new Error(res.status);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      map[src] = "/images/" + name;
      console.log("ok  ", name, "(via", candidate === url ? "original url)" : "full-res url)");
      break;
    } catch (e) {
      console.error("FAIL", candidate, String(e));
    }
  }
}
writeFileSync(mapUrl, JSON.stringify(map, null, 1));
console.log(`\nMap now has ${Object.keys(map).length} images.`);
