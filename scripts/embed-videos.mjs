// One-time: turn plain-text /videos/*.mp4 references (capture artifacts of the
// original Wix embedded players) into HTML5 <video> elements.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const files = [
  "content/posts/applaud-our-local-heroes.md",
  "content/posts/diesel-films-strikes-again-beautifying-2-schools.md",
  "content/posts/living-with-murals.md",
].map(f => fileURLToPath(new URL("../" + f, import.meta.url)));

const tag = p => `<video controls preload="metadata" src="${p}"></video>`;

for (const f of files) {
  let t = readFileSync(f, "utf8");
  t = t.replace(/^\[(\/videos\/[^\]]+)\]\(\/videos\/[^)]+\)$/gm, (m, p) => tag(p));
  t = t.replace(/^- (\/videos\/\S+)$/gm, (m, p) => tag(p));
  t = t.replace(/^Video links:\s*\n/gm, "");
  writeFileSync(f, t);
  console.log("done", f);
}
