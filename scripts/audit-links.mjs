// Link audit over the built _site/: verifies internal links against the real
// page set + vercel.json redirects, and live-checks external links.
// Usage: node scripts/audit-links.mjs [--no-external]
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../_site/", import.meta.url));
const vercel = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url)));
const redirects = new Set(vercel.redirects.filter(r => !r.source.includes(":")).map(r => r.source.replace(/\/$/, "")));
const redirectPrefixes = vercel.redirects.filter(r => r.source.includes(":")).map(r => r.source.slice(0, r.source.indexOf(":")));
const redirected = u => redirects.has(u) || redirectPrefixes.some(p => u.startsWith(p) || (u + "/").startsWith(p));

const htmlFiles = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) htmlFiles.push(p);
  }
})(root);

const internal = new Map(); // path -> [pages]
const external = new Map();
const attrRe = /(?:href|src)="([^"#]+)[^"]*"/g;

for (const f of htmlFiles) {
  const page = "/" + path.relative(root, f).replace(/\\/g, "/").replace(/index\.html$/, "");
  const html = readFileSync(f, "utf8");
  for (const m of html.matchAll(attrRe)) {
    let u = m[1].trim();
    if (u.startsWith("mailto:") || u.startsWith("tel:") || u.startsWith("data:") || u.startsWith("javascript:")) continue;
    const own = u.match(/^https?:\/\/(www\.)?beautifyearth\.org(\/.*)?$/);
    if (own) u = own[2] || "/";
    if (u.startsWith("/")) {
      if (!internal.has(u)) internal.set(u, []);
      if (internal.get(u).length < 3) internal.get(u).push(page);
    } else if (u.startsWith("http")) {
      if (!external.has(u)) external.set(u, []);
      if (external.get(u).length < 3) external.get(u).push(page);
    }
  }
}

console.log("== INTERNAL: broken (no file, no redirect) ==");
let brokenInt = 0;
for (const [u, pages] of [...internal.entries()].sort()) {
  const clean = u.split("?")[0].replace(/\/$/, "");
  const candidates = [
    path.join(root, clean, "index.html"),
    path.join(root, clean),
    path.join(root, decodeURIComponent(clean), "index.html"),
    path.join(root, decodeURIComponent(clean)),
  ];
  const ok = clean === "" || candidates.some(existsSync) || redirected(clean);
  if (!ok) { brokenInt++; console.log(`  ${u}    <- ${pages.join(", ")}`); }
}
console.log(`  (${brokenInt} broken of ${internal.size} unique internal)`);

if (!process.argv.includes("--no-external")) {
  console.log("\n== EXTERNAL: checking " + external.size + " unique URLs ==");
  const entries = [...external.entries()];
  const results = [];
  const check = async (u) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      let res = await fetch(u, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (link-audit)" } });
      if (res.status === 405 || res.status === 403 || res.status === 404) {
        res = await fetch(u, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (link-audit)" } });
      }
      return res.status;
    } catch (e) {
      return "ERR " + (e.name === "AbortError" ? "timeout" : e.cause?.code || e.message).toString().slice(0, 40);
    } finally { clearTimeout(t); }
  };
  const pool = 10;
  let i = 0;
  await Promise.all(Array.from({ length: pool }, async () => {
    while (i < entries.length) {
      const [u, pages] = entries[i++];
      const status = await check(u);
      if (!(typeof status === "number" && status < 400)) results.push([status, u, pages]);
    }
  }));
  results.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  for (const [status, u, pages] of results) console.log(`  [${status}] ${u}    <- ${pages.join(", ")}`);
  console.log(`  (${results.length} failing of ${external.size} unique external)`);
}
