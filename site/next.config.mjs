/**
 * Static export: `npm run build` writes a plain folder of HTML/CSS/JS to site/out
 * with no server, no cookies and no analytics.
 *
 * SITE_URL drives everything. Deploying at a root domain:
 *   SITE_URL=https://folio.example npm run build
 * Deploying under a sub-path (a GitHub Pages project site, say) needs nothing else:
 *   SITE_URL=https://shayanabedi.github.io/folio npm run build
 * basePath is taken from SITE_URL's path, so canonical URLs and asset paths cannot
 * drift apart. BASE_PATH overrides it if the two ever need to differ.
 *
 * The default is deliberately a root-path URL. A default carrying a sub-path prefixes
 * every asset with it, so a build that forgets SITE_URL doesn't just get the canonical
 * URL wrong — it 404s its own CSS, JS and images wherever it is served. Getting the
 * host wrong should stay cosmetic; keep any new default path-free.
 */
const siteUrl = (process.env.SITE_URL ?? "https://folioext.com").replace(/\/$/, "");
const basePath = (process.env.BASE_PATH ?? new URL(siteUrl).pathname).replace(/\/$/, "");

/** @type {import('next').NextConfig} */
export default {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  reactStrictMode: true,
  // next/image needs a server to optimise; these assets are pre-optimised by
  // scripts/optimize-images.mjs and served as plain <picture> elements instead.
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
};
