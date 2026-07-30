# beautifyearth.org — static site (migrated from Wix)

## Background

- This repo is the complete replacement for the former Wix site at beautifyearth.org: all 105 Wix URLs captured (17 live pages + 78 blog posts; 8 draft/test pages intentionally excluded and 301-redirected instead). Same slugs, same titles, same meta descriptions ⇒ zero-SEO-loss relaunch.
- The domain stays at its current registrar; only hosting moved. Nav links already point at beautifyearth.com properties (Contact, Artists, Sign-up), so no cross-link changes needed.

## Stack

Eleventy v3 static site. `content/pages/*.md` + `content/posts/*.md` (front-matter: title, description, permalink, originalUrl). Layouts in `_includes/` (base/page/post njk). `content/blog.njk` = blog index, `content/sitemap.njk` = sitemap. `vercel.json` = 301s + trailingSlash. Build: `npx @11ty/eleventy` → `_site/`. Vercel auto-detects.

## HARD CONSTRAINTS (SEO)

1. **Never change a permalink, page title, or meta description** without being explicitly asked — they were carried over from Wix exactly and preserve rankings.
2. Keep `www.beautifyearth.org` as canonical host (matches Wix-era canonicals; base layout emits canonical + OG tags).
3. Blog posts stay at `/post/<slug>/`. Pages stay at `/<slug>/`.
4. Redirects in `vercel.json` mirror old Wix behavior (incl. `/property-owners` → beautifyearth.com) — don't remove. Sources use trailing slashes because Vercel normalizes URLs before matching redirect rules.

## Media

All images (`public/images/`) and videos (`public/videos/`) are served locally — content must never reference `wixstatic.com`. `images-manifest.json` + the `scripts/` directory document how media was captured.

## Remaining launch steps

1. **Domain cutover**: Vercel project → Settings → Domains: add beautifyearth.org + www (www primary). At the DNS host: `A @ → 76.76.21.21`, `CNAME www → cname.vercel-dns.com`. SSL is automatic.
2. **SEO lock-in**: Google Search Console domain property (DNS TXT verification), submit `/sitemap.xml`. Run a broken-link check.
3. **Forms/Donate**: the old Wix form ("Enter Contest") and donate flow are gone — embed Tally/Formspree on relevant pages; put a PayPal/Givebutter/Zeffy link on `/nonprofit/`.
4. **Restyle** (ongoing): match beautifyearth.com branding; restyle freely within the constraints above.
