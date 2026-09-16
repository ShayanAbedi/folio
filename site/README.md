# folio-site

The marketing page for Folio. One route, static export, no backend, no cookies, no
analytics, no third-party requests at runtime (the webfont is self-hosted at build time).

```bash
npm install
npm run dev     # http://localhost:3000/folio
npm run build   # writes ./out
```

## Images

`npm run build` runs `scripts/optimize-images.mjs` first. It reads the originals that
already live in this repo — `design/folio-icon-1024.png` and
`extension/metadata/folio-{1,2,3,4}.png` (portfolio, positions, activities, fog) — and
writes everything the page serves into `public/`:

- responsive AVIF + WebP screenshots at five widths, in two framings: `full` (the whole
  2000×1250 capture, used by the hero) and `-tight` (cropped to the Raycast window, used
  by the feature blocks and by the hero below 760px, where the full desktop capture is
  too small to read). Both are 16:10, so swapping between them costs no layout shift.
- the rounded app-icon tiles, the favicon and apple-touch icon
- `og.png`, the 1200×630 Open Graph card

The 2.5 MB source PNGs come down to roughly 40–90 KB per screenshot. Outputs are
deterministic, so re-running changes nothing in git. Re-run it after replacing a source
image; if the Raycast window moves within a new capture, re-measure `TIGHT_CROP` in that
script.

## Motion

`components/HeroGlow.tsx` eases two radial layers toward the pointer at different rates
and writes the result to custom properties; the hero's own CSS carries centred fallbacks,
so the page is unchanged with JavaScript off. The hero entrance and the scroll-driven
reveals are pure CSS, the reveals behind `@supports (animation-timeline: view())`.

Every one of these lives inside `@media (prefers-reduced-motion: no-preference)`, and
nothing depends on an animation to become visible — with reduced motion on, or in a
browser without scroll-driven animations, the page renders complete and static.

## Deploying

`SITE_URL` is the only knob. It sets the canonical URL, the absolute Open Graph image URL,
and — from its path — `basePath`, so those cannot drift apart.

```bash
SITE_URL=https://folio.example npm run build          # root domain
SITE_URL=https://shayanabedi.github.io/folio npm run build   # project sub-path
```

The default is `https://shayanabedi.github.io/folio`. Upload `out/` to any static host.

### Cloudflare Pages

Connect the repo and set:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Root directory | `site` |
| Build command | `npm run build` |
| Build output directory | `out` |
| Environment variable | `SITE_URL` = the production URL |

`.node-version` pins Node 22 for the builder. `public/_headers` is copied into `out/`
on every build and is what Cloudflare reads for cache and security headers: a
year-long immutable cache on the content-hashed `_next/static` assets, a day on the
screenshots (their filenames are stable, so they must be allowed to go stale), and a
`default-src 'none'` CSP.

That CSP is only possible because the page loads nothing from anywhere else. It needs
`'unsafe-inline'` for scripts — a static export has no server to mint nonces for Next's
two hydration scripts — but sources stay limited to `'self'`, which is what turns the
page's "no third-party scripts" claim into something the browser enforces.

Set `SITE_URL` to the production URL and leave it: preview deployments get their own
`*.pages.dev` hostnames, and canonical and Open Graph URLs should point at production
from any of them.

Note that GitHub Pages cannot build this on its own — it only runs Jekyll — so it would
need an Actions workflow to run `npm run build` and publish `out/`.

## When the Raycast Store listing clears review

Set `RAYCAST_STORE` in [`app/content.ts`](app/content.ts) to the listing URL. The hero
button becomes a real link and drops its "In review" pill on its own. The copy in the
Install section still describes the source install, so revisit that paragraph too.
