// One-time: fetch the /schools page images (page was missed by the original capture).
// Same naming scheme as download-images.mjs; appends to image-url-map.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../public/images/", import.meta.url));
mkdirSync(outDir, { recursive: true });
const mapUrl = new URL("../image-url-map.json", import.meta.url);
const map = JSON.parse(readFileSync(mapUrl));

const urls = [
  "https://static.wixstatic.com/media/df72fd_0f626445fb564cea939177ac2e94489e~mv2.jpeg",
  "https://static.wixstatic.com/media/4d51d9_ffca45b0e23c4037af18da071aa8691d~mv2.jpeg",
  "https://static.wixstatic.com/media/e81220_5a59cc4f91564394b67bc00d3d4ac610~mv2.jpg",
  "https://static.wixstatic.com/media/55dc19_2839518f7ff144dc818eb9f434513032~mv2.jpg",
];

for (const src of urls) {
  const name = createHash("md5").update(src).digest("hex").slice(0, 10) + "-" +
    decodeURIComponent(src.split("/").pop()).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const dest = path.join(outDir, name);
  if (!existsSync(dest)) {
    const res = await fetch(src);
    if (!res.ok) { console.error("FAIL", src, res.status); continue; }
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
  map[src] = "/images/" + name;
  console.log("ok", name);
}
writeFileSync(mapUrl, JSON.stringify(map, null, 1));
