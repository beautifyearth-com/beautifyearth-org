// Downloads every video.wixstatic.com mp4 referenced in content/ into public/videos/
// and writes video-url-map.json (same shape as image-url-map.json).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../public/videos/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const roots = ["content/pages", "content/posts"].map(p => fileURLToPath(new URL("../" + p + "/", import.meta.url)));
const urls = new Set();
for (const root of roots) {
  for (const f of readdirSync(root)) {
    if (!f.endsWith(".md")) continue;
    const txt = readFileSync(path.join(root, f), "utf8");
    for (const m of txt.matchAll(/https:\/\/video\.wixstatic\.com\/video\/[^\s)"'\]]+/g)) urls.add(m[0]);
  }
}

const map = {};
for (const u of urls) {
  const id = u.match(/\/video\/([^/]+)\/(\d+p)\//);
  const name = id ? `${id[1]}-${id[2]}.mp4` : u.split("/").slice(-3).join("_");
  const dest = path.join(outDir, name);
  if (!existsSync(dest)) {
    try {
      const res = await fetch(u);
      if (!res.ok) throw new Error(res.status);
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    } catch (e) {
      console.error("FAIL", u, String(e));
      continue;
    }
  }
  const mb = (statSync(dest).size / 1048576).toFixed(1);
  console.log("ok  ", name, mb + " MB");
  map[u] = "/videos/" + name;
}
writeFileSync(new URL("../video-url-map.json", import.meta.url), JSON.stringify(map, null, 1));
console.log(`\nDownloaded ${Object.keys(map).length}/${urls.size} videos.`);
