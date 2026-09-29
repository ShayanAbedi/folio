/** Every link, string and toggle the page needs, in one place. */

export const GITHUB = "https://github.com/ShayanAbedi/folio";
export const SECURITY_MD = `${GITHUB}/blob/main/SECURITY.md`;
export const AUTH_WORKER = `${GITHUB}/tree/main/auth-worker`;
export const SNAPTRADE_SIGNUP = "https://dashboard.snaptrade.com/signup?personal=";
export const SNAPTRADE = "https://snaptrade.com";
export const RAYCAST_STORE = "https://www.raycast.com/shayan_abedi/folio";

export const TAGLINE = "Your portfolio, one keystroke away.";

export const ONE_LINER =
  "A keyboard-first, read-only view of every brokerage account you've connected through SnapTrade: net worth, holdings, activities, and Fog, the cash you've left idle.";

/** Prefixes a public/ asset with BASE_PATH so sub-path deploys keep working. */
export const asset = (p: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${p}`;

/** Origin (plus sub-path, if any) the build is deployed at. Set via SITE_URL; see next.config.mjs. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://folioext.com";
