/**
 * Generates every image the site ships, from the sources already in the repo.
 *
 *   design/folio-icon-1024.png        -> logo, favicons, Open Graph card
 *   extension/metadata/folio-{1,2,3}  -> responsive AVIF + WebP screenshots
 *
 * Run with `npm run images`; `npm run build` runs it first. Outputs are
 * deterministic, so re-running is a no-op in git.
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const siteDir = path.resolve(import.meta.dirname, "..");
const repoDir = path.resolve(siteDir, "..");
const publicDir = path.join(siteDir, "public");
const appDir = path.join(siteDir, "app");

const src = (p) => path.join(repoDir, p);

/** Screenshots are 2000x1250 (16:10). These are the widths the <picture> offers. */
const SHOT_WIDTHS = [640, 960, 1280, 1600, 2000];

/**
 * The feature blocks render each shot at roughly half the hero's width, where the
 * desktop wallpaper around the Raycast window eats the space that the UI needs.
 * These crops keep the 16:10 frame but pull it in to the window, which renders the
 * interface about 1.2x larger, and keeps the feature blocks from looking like a
 * duplicate of the hero. Bounds measured from the source pixels: the window sits at
 * x 250-1749, y 150-1099 in all four.
 */
const TIGHT_CROP = { left: 170, top: 105, width: 1660, height: 1038 };
const TIGHT_WIDTHS = [480, 720, 960, 1200, 1440];

const SHOTS = [
  { file: "extension/metadata/folio-1.png", name: "portfolio" },
  { file: "extension/metadata/folio-2.png", name: "positions" },
  { file: "extension/metadata/folio-3.png", name: "activities" },
  { file: "extension/metadata/folio-4.png", name: "fog" },
];

const LOGO = src("design/folio-icon-1024.png");
const BG = { r: 0x0e, g: 0x0f, b: 0x12, alpha: 1 };

async function screenshots() {
  await mkdir(path.join(publicDir, "shots"), { recursive: true });
  for (const { file, name } of SHOTS) {
    const full = sharp(src(file)).flatten({ background: BG });
    const tight = sharp(src(file)).flatten({ background: BG }).extract(TIGHT_CROP);

    const encode = async (base, widths, suffix) => {
      for (const w of widths) {
        const resized = () => base.clone().resize({ width: w, withoutEnlargement: true });
        await resized()
          .avif({ quality: 52, effort: 4, chromaSubsampling: "4:2:0" })
          .toFile(path.join(publicDir, "shots", `${name}${suffix}-${w}.avif`));
        await resized()
          .webp({ quality: 80, effort: 5, smartSubsample: true })
          .toFile(path.join(publicDir, "shots", `${name}${suffix}-${w}.webp`));
      }
    };

    await encode(full, SHOT_WIDTHS, "");
    await encode(tight, TIGHT_WIDTHS, "-tight");
  }
}

/** macOS-style rounded tile, so the icon's own black square doesn't butt against the page. */
const CORNER = 0.2237;

function roundedLogo(size) {
  const r = Math.round(size * CORNER);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#fff"/></svg>`,
  );
  return sharp(LOGO)
    .resize(size, size)
    .composite([{ input: mask, blend: "dest-in" }]);
}

async function icons() {
  // Hero logo, and the favicon/apple-touch files Next picks up by convention.
  for (const w of [128, 256, 512]) {
    await roundedLogo(w).webp({ quality: 90, effort: 5, alphaQuality: 100 })
      .toFile(path.join(publicDir, `folio-icon-${w}.webp`));
  }
  await roundedLogo(256).png({ compressionLevel: 9 }).toFile(path.join(appDir, "icon.png"));
  // Apple touch icons get their own mask from iOS, so this one stays square.
  await sharp(LOGO).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(appDir, "apple-icon.png"));
}

/** 1200x630 Open Graph card: the logo, the name, the tagline. PNG, because scrapers are old. */
async function openGraph() {
  const W = 1200;
  const H = 630;
  const logoSize = 232;
  const logo = await roundedLogo(logoSize).png().toBuffer();

  const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow" cx="26%" cy="34%" r="52%">
      <stop offset="0%" stop-color="#1E4C86" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#0E0F12" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0E0F12"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="472" y="288" font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        font-size="96" font-weight="700" fill="#F2F4F8" letter-spacing="-3">Folio</text>
  <text x="472" y="356" font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        font-size="42" font-weight="500" fill="#BFD8EE" letter-spacing="-0.6">Your portfolio in Raycast.</text>
  <text x="472" y="424" font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        font-size="28" font-weight="400" fill="#8A92A6">Read-only. Open source. Powered by SnapTrade.</text>
  <rect x="0" y="626" width="${W}" height="4" fill="#163A6B"/>
</svg>`);

  await sharp({ create: { width: W, height: H, channels: 4, background: BG } })
    .composite([
      { input: text, top: 0, left: 0 },
      { input: logo, top: Math.round((H - logoSize) / 2), left: 152 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "og.png"));
}

async function main() {
  await mkdir(publicDir, { recursive: true });
  await Promise.all([screenshots(), icons(), openGraph()]);
  console.log("images: wrote screenshots, icons and og.png into site/public");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
