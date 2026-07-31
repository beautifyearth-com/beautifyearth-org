// Generates content/_data/postmeta.json: { <slug>: { thumb, excerpt } }
// thumb = first content image (display copy if one exists), excerpt = first prose paragraph.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const postsDir = path.join(root, "content/posts");
const imagesDir = path.join(root, "public/images");
const meta = {};
const bigThumbs = [];

// fallback: first substantial manifest image captured on the post's Wix page
const manifest = JSON.parse(readFileSync(path.join(root, "images-manifest.json"), "utf8"));
const urlMap = JSON.parse(readFileSync(path.join(root, "image-url-map.json"), "utf8"));
const fullRes = u => { const m = u.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+)/); return m ? m[1] : u; };
const CHROME = /^(035a3a7adf|190155a248|b45e34ce0f|129aff4cf7|e75d7fa657|78aa2057|01c3aff5)/;
function manifestThumb(slug) {
  for (const h of manifest.filter(x => x.page === "post/" + slug)) {
    const local = urlMap[fullRes(h.url)];
    if (!local) continue;
    const name = local.replace("/images/", "");
    if (CHROME.test(name)) continue;
    const p = path.join(imagesDir, name);
    if (!existsSync(p) || statSync(p).size < 30 * 1024) continue;
    return name;
  }
  return null;
}

for (const f of readdirSync(postsDir).filter(f => f.endsWith(".md"))) {
  const slug = f.replace(/\.md$/, "");
  const t = readFileSync(path.join(postsDir, f), "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const body = t.replace(/^---\n[\s\S]*?\n---/, "");

  const img = body.match(/\/images\/(?!display\/)([^\s)"']+\.(?:jpe?g|png))/i);
  let name = img ? img[1] : manifestThumb(slug);
  let thumb = null;
  if (name && existsSync(path.join(imagesDir, name))) {
    const displayName = name.replace(/\.(png|jpeg)$/i, ".jpg");
    if (existsSync(path.join(imagesDir, "display", displayName))) {
      thumb = "/images/display/" + displayName;
    } else if (statSync(path.join(imagesDir, name)).size > 400 * 1024) {
      bigThumbs.push(name);
      thumb = "/images/display/" + displayName;
    } else {
      thumb = "/images/" + name;
    }
  }

  let excerpt = "";
  for (const line of body.split("\n")) {
    const s = line.trim();
    if (!s || /^[#!<>\-*|]/.test(s) || /^\*\*(Author|Date|Published|Updated|Read)/i.test(s) || /^\[/.test(s) || /^\d+\.?\s/.test(s) || /^Video links/i.test(s) || /^\*[^*]/.test(s)) continue;
    const plain = s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*?/g, "").trim();
    if (plain.length > 60) { excerpt = plain.length > 150 ? plain.slice(0, 147).replace(/\s\S*$/, "") + "…" : plain; break; }
  }
  meta[slug] = { thumb, excerpt };
}

mkdirSync(path.join(root, "content/_data"), { recursive: true });
writeFileSync(path.join(root, "content/_data/postmeta.json"), JSON.stringify(meta, null, 1));
const withThumb = Object.values(meta).filter(m => m.thumb).length;
console.log(`${Object.keys(meta).length} posts, ${withThumb} with thumbnails`);
if (bigThumbs.length) console.log("NEED DISPLAY COPIES:\n" + bigThumbs.join("\n"));
