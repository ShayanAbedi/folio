import { asset } from "@/app/content";

/**
 * Two framings, both 16:10, both written by scripts/optimize-images.mjs:
 *   full  — the whole 2000x1250 capture, desktop and all, for the hero
 *   tight — cropped in to the Raycast window, for the smaller feature blocks
 */
const VARIANTS = {
  full: { suffix: "", widths: [640, 960, 1280, 1600, 2000], width: 2000, height: 1250 },
  tight: { suffix: "-tight", widths: [480, 720, 960, 1200, 1440], width: 1660, height: 1038 },
} as const;

type Props = {
  name: "portfolio" | "positions" | "activities" | "fog";
  alt: string;
  /** Rendered width of the image, so the browser picks the right srcset entry. */
  sizes: string;
  variant?: keyof typeof VARIANTS;
  /**
   * Swap to the tight crop below this width. A full desktop capture shown at phone
   * width leaves the Raycast UI too small to read; the crop spends those pixels on
   * the window instead. Both framings are 16:10, so the swap costs no layout shift.
   */
  tightBelow?: string;
  /** The hero shot only: loads eagerly and takes priority. */
  priority?: boolean;
};

export function Shot({
  name,
  alt,
  sizes,
  variant = "full",
  tightBelow,
  priority = false,
}: Props) {
  const { suffix, widths, width, height } = VARIANTS[variant];
  const src = (s: string, w: number, ext: "avif" | "webp") =>
    asset(`/shots/${name}${s}-${w}.${ext}`);
  const set = (s: string, ws: readonly number[], ext: "avif" | "webp") =>
    ws.map((w) => `${src(s, w, ext)} ${w}w`).join(", ");
  const srcSet = (ext: "avif" | "webp") => set(suffix, widths, ext);
  const fallback = widths[Math.floor(widths.length / 2)];
  const small = VARIANTS.tight;

  return (
    <figure className="shot">
      <picture>
        {tightBelow && variant !== "tight" && (
          <>
            <source
              media={`(max-width: ${tightBelow})`}
              type="image/avif"
              srcSet={set(small.suffix, small.widths, "avif")}
              sizes={sizes}
            />
            <source
              media={`(max-width: ${tightBelow})`}
              type="image/webp"
              srcSet={set(small.suffix, small.widths, "webp")}
              sizes={sizes}
            />
          </>
        )}
        <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
        <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src(suffix, fallback, "webp")}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "auto" : "async"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    </figure>
  );
}
