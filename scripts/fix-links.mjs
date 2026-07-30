// One-time link repair across content/, driven by the 2026-07-30 link audit:
// 1. strip Wix post-footer taxonomy lines (Categories:/Tags:/Filed under lists)
//    and unlink any remaining /blog/{categories,tags,hashtags}/ links
// 2. make own-domain absolute links relative (www.beautifyearth.org/x -> /x)
// 3. repoint dead beautifyearth.com URLs at their live local equivalents
// 4. unlink dead external URLs (keep the anchor text)
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootUrl = new URL("../", import.meta.url);
const roots = ["content/pages", "content/posts"].map(p => fileURLToPath(new URL(p + "/", rootUrl)));
const postsDir = fileURLToPath(new URL("content/posts/", rootUrl));

const localPost = slug => existsSync(path.join(postsDir, slug + ".md"));

// dead .com page -> local page (verified to exist here, 404 on .com)
const comPageMap = {
  "how-it-works": "/how-it-works/",
  "artists": "/artists/",
  "brands-agencies": "/brands-agencies/",
  "local-organizations": "/local-organizations/",
  "local-business": "/local-business/",
  "back-to-the-streets": "/back-to-the-streets/",
  "community-members": "/community-members/",
  "nonprofit": "/nonprofit/",
  "nonprofit-schools": "/nonprofit/",
  "nonprofit-donate": "/nonprofit/",
  "contact": "https://www.beautifyearth.com/contact-us",
  "contact-us": "https://www.beautifyearth.com/contact-us",
};

const deadExternal = [
  /https?:\/\/(www\.)?picopassport\.com[^\s)"']*/,
  /https?:\/\/nina-palomba\.squarespace\.com[^\s)"']*/,
  /https?:\/\/(www\.)?eca-partners\.com[^\s)"']*/,
  /https?:\/\/michaelortizart\.com[^\s)"']*/,
  /https?:\/\/(www\.)?rjoyoakland\.org[^\s)"']*/,
  /https?:\/\/(www\.)?calenblake\.com[^\s)"']*/,
  /https?:\/\/(www\.)?planethostel\.com\.mx[^\s)"']*/,
  /https?:\/\/(www\.)?fojac\.org[^\s)"']*/,
  /https?:\/\/(www\.)?dumpsterbeautificationproject\.org[^\s)"']*/,
  /https?:\/\/(www\.)?brianraymondsimmonds\.com[^\s)"']*/,
  /https?:\/\/[a-z0-9-]+\.intercom-clicks\.com[^\s)"']*/,
  /https?:\/\/intercom\.help[^\s)"']*/,
  /https?:\/\/(www\.)?beautifyearth\.com\/post\/why-a-mural-instead-of-an-awning[^\s)"']*/,
  /https?:\/\/(www\.)?beautifyearth\.com\/post\/experiential-marketing[^\s)"']*/,
  /https?:\/\/(www\.)?beautifyearth\.com\/nonprofit-projects[^\s)"']*/,
];

const taxonomyLine = /^\*\*(Categories|Tags|Hashtags|Filed under):?\*\*.*$/gmi;
const taxonomyLink = /\[([^\]]+)\]\((?:https?:\/\/(?:www\.)?beautifyearth\.org)?\/blog\/(?:categories|tags|hashtags)\/[^)]*\)/g;

let changed = 0;
for (const root of roots) {
  for (const f of readdirSync(root)) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(root, f);
    let t = readFileSync(p, "utf8");
    const before = t;

    // 1. taxonomy footers and links
    t = t.replace(taxonomyLine, "");
    t = t.replace(taxonomyLink, "$1");

    // 2. own-domain absolute -> relative
    t = t.replace(/https?:\/\/(www\.)?beautifyearth\.org(\/[^\s)"']*)?/g, (m, w, pth) => pth || "/");

    // 3. dead .com URLs -> local
    t = t.replace(/https?:\/\/(www\.)?beautifyearth\.com\/post\/([a-z0-9-]+)\/?/g, (m, w, slug) => {
      if (localPost(slug)) return "/post/" + slug + "/";
      if (slug === "beautify-santa-monica") return "/post/beautify-santa-monica-a-cultural-shift-of-murals-as-experiential-community-focused-placemaking/";
      return m;
    });
    t = t.replace(/https?:\/\/(www\.)?beautifyearth\.com\/([a-z-]+)\/?(?=[\s)"'])/g, (m, w, page) => comPageMap[page] || m);

    // 4. unlink dead externals: [text](deadurl) -> text, bare urls -> removed
    for (const re of deadExternal) {
      t = t.replace(new RegExp(`\\[([^\\]]+)\\]\\(${re.source}\\)`, "g"), "$1");
      t = t.replace(new RegExp(re.source, "g"), "");
    }

    t = t.replace(/\n{4,}/g, "\n\n\n");
    if (t !== before) { writeFileSync(p, t); changed++; }
  }
}
console.log(changed + " files updated");
