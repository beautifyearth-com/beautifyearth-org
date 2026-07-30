// Generates web-sized display copies of large images into public/images/display/.
// Originals in public/images/ are kept as the full-res archive.
// Usage: node scripts/make-display-images.mjs <filename...>  (or no args = all >400KB)
import sharp from "sharp";
import { readdirSync, statSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = fileURLToPath(new URL("../public/images/", import.meta.url));
const outDir = path.join(srcDir, "display");
mkdirSync(outDir, { recursive: true });

const args = process.argv.slice(2);
const files = args.length
  ? args
  : readdirSync(srcDir).filter(f => /\.(jpe?g|png)$/i.test(f) && statSync(path.join(srcDir, f)).size > 400 * 1024);

for (const f of files) {
  const src = path.join(srcDir, f);
  const out = path.join(outDir, f.replace(/\.(png|jpeg)$/i, ".jpg"));
  const meta = await sharp(src).metadata();
  await sharp(src)
    .resize({ width: Math.min(1600, meta.width || 1600), withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(out);
  const kb = n => Math.round(statSync(n).size / 1024) + "KB";
  console.log(f, kb(src), "->", path.basename(out), kb(out));
}
