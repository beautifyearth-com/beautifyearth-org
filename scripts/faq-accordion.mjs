// One-time: convert faq.md "### question" sections into <details> accordions.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const p = fileURLToPath(new URL("../content/pages/faq.md", import.meta.url));
const t = readFileSync(p, "utf8");
const [head, ...sections] = t.split(/^### /m);

const cleanedHead = head
  .replace(/^## Header Navigation\s*$/m, "")
  .replace(/# Frequently asked questions/, "# Frequently asked questions\n");

const out = [cleanedHead.trimEnd(), ""];
for (const s of sections) {
  const nl = s.indexOf("\n");
  const q = s.slice(0, nl).trim();
  let body = s.slice(nl + 1).replace(/<!--[\s\S]*?-->/g, "").trimEnd();
  out.push(`<details class="faq">\n<summary>${q}</summary>\n\n${body}\n\n</details>\n`);
}
writeFileSync(p, out.join("\n") + "\n");
console.log(sections.length + " questions converted");
