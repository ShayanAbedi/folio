import { useCachedPromise } from "@raycast/utils";
import { useCallback } from "react";
import { cacheClear } from "./cache";
import { ACTIVITY_WINDOW_DAYS, loadActivities, loadConnections, loadPortfolio } from "./data";
import { authMode } from "./preferences";

let refreshing: Promise<void> | null = null;

/**
 * ⌘R: clears the HTTP cache once, then reloads every view passed in. A second ⌘R while one is still
 * running joins it instead of clearing again and starting a second full load, which would double the
 * requests against SnapTrade's per-account rate limit.
 */
export function refreshTogether(...reloads: (() => unknown)[]): Promise<void> {
  if (!refreshing) {
    cacheClear();
    // useCachedPromise types revalidate as void, but it returns the reload's promise.
    refreshing = Promise.all(reloads.map((reload) => Promise.resolve(reload())))
      .then(() => undefined)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

/**
 * Portfolio snapshot with Raycast-level caching (instant paint) plus our HTTP TTL cache.
 * `load: false` reads the snapshot another view already loaded without starting a load of its own
 * (a pushed view in the same command); `refresh` still reloads.
 */
export function usePortfolio(opts?: { load?: boolean }) {
  const mode = authMode();
  const { data, isLoading, error, revalidate } = useCachedPromise(
    (m: string) => loadPortfolio(false).then((s) => ({ ...s, mode: m })),
    [mode],
    {
      keepPreviousData: true,
      execute: opts?.load ?? true,
    },
  );
  const refresh = useCallback(() => refreshTogether(revalidate), [revalidate]);
  return { snapshot: data, isLoading, error, refresh, revalidate };
}

export function useActivities(days = ACTIVITY_WINDOW_DAYS) {
  const mode = authMode();
  const { data, isLoading, error, revalidate } = useCachedPromise(
    (d: number, m: string) => loadActivities(d).then((r) => ({ ...r, mode: m })),
    [days, mode],
    {
      keepPreviousData: true,
    },
  );
  const refresh = useCallback(() => refreshTogether(revalidate), [revalidate]);
  return { activities: data?.activities, failures: data?.failures ?? [], isLoading, error, refresh, revalidate };
}

export function useConnections() {
  const mode = authMode();
  const { data, isLoading, error, revalidate } = useCachedPromise(
    (m: string) => loadConnections(false).then((c) => ({ connections: c, mode: m })),
    [mode],
    {
      keepPreviousData: true,
    },
  );
  const refresh = useCallback(() => refreshTogether(revalidate), [revalidate]);
  return { connections: data?.connections, isLoading, error, refresh };
}
