// Downloads every Wix-hosted image referenced by the site into public/images/
// and prints a sed-able mapping. Run LOCALLY (needs open network):  npm run download-images
// Then run:  node scripts/rewrite-image-urls.mjs   to point content at /images/.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const manifest = JSON.parse(readFileSync(new URL("../images-manifest.json", import.meta.url)));
const outDir = fileURLToPath(new URL("../public/images/", import.meta.url));
mkdirSync(outDir, { recursive: true });

// Wix image URLs contain resize params (/v1/fill/w_49,...) — strip to the original full-res asset.
function fullRes(u) {
  const m = u.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/);
  return m ? m[1] : u;
}

const map = {};
const seen = new Set();
for (const { url } of manifest) {
  const src = fullRes(url);
  if (seen.has(src)) continue;
  seen.add(src);
  const name = createHash("md5").update(src).digest("hex").slice(0, 10) + "-" +
    decodeURIComponent(src.split("/").pop()).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const dest = path.join(outDir, name);
  if (!existsSync(dest)) {
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(res.status);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      console.log("ok ", name);
    } catch (e) {
      console.error("FAIL", src, String(e));
      continue;
    }
  }
  map[src] = "/images/" + name;
}
writeFileSync(new URL("../image-url-map.json", import.meta.url), JSON.stringify(map, null, 1));
console.log(`\nDownloaded ${Object.keys(map).length} images. Map saved to image-url-map.json`);
