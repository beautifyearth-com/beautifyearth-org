// One-time: strip Wix-capture scaffolding from content markdown.
// - "### Navigation" / "### Footer Navigation" / "### Social Media Links"
//   headings + their link lists (duplicates of the site chrome)
// - "**Copyright:** ..." lines (footer already has it)
// - bare "### Main Heading" / "## Subheading" label lines
// - "### Section: Foo" -> "## Foo"
// - "**Call-to-action buttons:**" label lines (the links themselves stay)
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const roots = ["content/pages", "content/posts"].map(p => fileURLToPath(new URL("../" + p + "/", import.meta.url)));

const chromeHeading = /^#{2,4}\s*(Navigation( & Header)?|Site Navigation|Footer Navigation|Footer|Social Media( Links)?)\s*$/;
const labelLine = /^(#{2,4}\s*(Main Heading|Subheading|Heading)\s*|\*\*Call-to-action buttons?:\*\*\s*|\*\*Copyright:\*\*.*)$/;
const sectionLabel = /^(#{2,4})\s*Section:\s*(.+)$/;

let changed = 0;
for (const root of roots) {
  for (const f of readdirSync(root)) {
    if (!f.endsWith(".md")) continue;
    const p = path.join(root, f);
    const lines = readFileSync(p, "utf8").split("\n");
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (chromeHeading.test(line)) {
        // skip heading, following blank lines, then the list block (- or 1. items)
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === "") j++;
        while (j < lines.length && /^(-|\*|\d+\.)\s/.test(lines[j])) j++;
        i = j - 1;
        continue;
      }
      if (labelLine.test(line)) continue;
      const m = line.match(sectionLabel);
      out.push(m ? `## ${m[2]}` : line);
    }
    // collapse runs of 3+ blank lines left behind
    const result = out.join("\n").replace(/\n{4,}/g, "\n\n\n");
    if (result !== lines.join("\n")) { writeFileSync(p, result); changed++; console.log("cleaned", f); }
  }
}
console.log(`\n${changed} files cleaned.`);
