// One-time: embed each post's captured Wix images into the article body.
// The capture recorded images per post page (images-manifest.json) but did not
// embed them in the transcribed markdown. Hero image goes after the byline
// block; up to 6 more append as an end-of-post gallery. Large files get
// display copies via sharp.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const postsDir = path.join(root, "content/posts");
const imagesDir = path.join(root, "public/images");
const displayDir = path.join(imagesDir, "display");

const manifest = JSON.parse(readFileSync(path.join(root, "images-manifest.json"), "utf8"));
const urlMap = JSON.parse(readFileSync(path.join(root, "image-url-map.json"), "utf8"));
const fullRes = u => { const m = u.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/); return m ? m[1] : u; };
const CHROME = /^(035a3a7adf|190155a248|b45e34ce0f|129aff4cf7|e75d7fa657|78aa2057|01c3aff5|4ef638881d|3f9057cc82)/;

async function webPath(name) {
  const abs = path.join(imagesDir, name);
  if (statSync(abs).size <= 400 * 1024) return "/images/" + name;
  const displayName = name.replace(/\.(png|jpeg)$/i, ".jpg");
  const out = path.join(displayDir, displayName);
  if (!existsSync(out)) {
    const meta = await sharp(abs).metadata();
    await sharp(abs).rotate().resize({ width: Math.min(1600, meta.width || 1600), withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(out);
  }
  return "/images/display/" + displayName;
}

let changed = 0;
for (const f of readdirSync(postsDir).filter(f => f.endsWith(".md"))) {
  const slug = f.replace(/\.md$/, "");
  const p = path.join(postsDir, f);
  const raw = readFileSync(p, "utf8");
  const bom = raw.startsWith("﻿") ? "﻿" : "";
  const t = raw.replace(/^﻿/, "");

  // candidate images, in capture order
  const seen = new Set();
  const candidates = [];
  for (const h of manifest.filter(x => x.page === "post/" + slug)) {
    const local = urlMap[fullRes(h.url)];
    if (!local) continue;
    const name = local.replace("/images/", "");
    if (seen.has(name) || CHROME.test(name)) continue;
    seen.add(name);
    const abs = path.join(imagesDir, name);
    if (!existsSync(abs) || statSync(abs).size < 30 * 1024) continue;
    if (t.includes(name)) continue; // already embedded inline
    candidates.push(name);
  }
  if (!candidates.length) continue;

  const title = (t.match(/^title:\s*"?([^"\n]*)"?\s*$/m) || [, slug])[1];
  const fmEnd = t.replace(/\r\n/g, "\n").indexOf("\n---", 3);
  const lines = t.split(/\r?\n/);

  // find insertion point: after front matter + leading byline/meta lines
  let i = 0, dashes = 0;
  while (i < lines.length && dashes < 2) { if (lines[i].trim() === "---") dashes++; i++; }
  while (i < lines.length && (lines[i].trim() === "" || /^\*\*[A-Za-z ]+:?\*\*/.test(lines[i].trim()) || /^Canonical URL/.test(lines[i].trim()))) i++;

  const hero = await webPath(candidates[0]);
  const heroBlock = ["", `![${title.replace(/[\[\]]/g, "")}](${hero})`, ""];
  lines.splice(i, 0, ...heroBlock);

  const rest = candidates.slice(1, 7);
  if (rest.length) {
    const gallery = ["", "---", ""];
    for (const name of rest) gallery.push(`![${title.replace(/[\[\]]/g, "")} — project photo](${await webPath(name)})`, "");
    lines.push(...gallery);
  }
  writeFileSync(p, bom + lines.join("\n"));
  changed++;
  console.log(`${slug}: hero + ${rest.length} gallery`);
}
console.log(`\n${changed} posts updated`);
