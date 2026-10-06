/**
 * Visit analytics: PostHog, cookieless and first-party.
 *
 * - posthog-js is bundled with the page, so nothing loads from a third-party origin.
 * - Events go to /ingest on this site, which vercel.json rewrites to PostHog. The
 *   browser only ever talks to 'self', so the CSP stays `connect-src 'self'`.
 * - persistence: "memory" sets no cookies and no localStorage. The cost: a returning
 *   visitor counts as a new one. utm_* params and the referrer are still recorded on
 *   every event of the visit.
 *
 * Runs only in production builds with NEXT_PUBLIC_POSTHOG_KEY set; `next dev` has no
 * /ingest rewrite, and a fork that builds without the key sends nothing.
 */
import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key && process.env.NODE_ENV === "production") {
  posthog.init(key, {
    api_host: `${process.env.NEXT_PUBLIC_BASE_PATH}/ingest`,
    ui_host: "https://us.posthog.com",
    defaults: "2026-08-30",
    persistence: "memory",
    // Every visit is a new anonymous id anyway; person profiles would just pile up.
    person_profiles: "identified_only",
    // Nothing fetched at runtime beyond the event endpoint: no recorder, surveys,
    // toolbar or remote-config scripts.
    disable_external_dependency_loading: true,
    disable_session_recording: true,
    disable_surveys: true,
  });

  // One clean event per outbound click (Store, GitHub, SnapTrade…), so a funnel can
  // go utm_source → $pageview → outbound_link_clicked { href: Raycast Store }.
  document.addEventListener("click", (event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement) || link.origin === location.origin) return;
    posthog.capture("outbound_link_clicked", {
      href: link.href,
      text: link.textContent?.trim().slice(0, 100),
      // Which of the page's repeated Store links it was: hero, install section, footer.
      placement: placementOf(link),
    });
  });
}

function placementOf(link: Element): string | undefined {
  const region = link.closest("section, header, footer");
  if (!region) return undefined;
  return region.getAttribute("aria-labelledby") ?? region.getAttribute("aria-label") ?? region.tagName.toLowerCase();
}
