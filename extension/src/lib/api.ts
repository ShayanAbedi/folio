/**
 * Thin HTTP layer for SnapTrade.
 * OAuth mode (the Store build): Bearer auth only. Never sends clientId, consumerKey, userId,
 * userSecret, timestamp or Signature. On 401: refresh once through the worker and retry once;
 * then surface a sign-in error.
 */
import { SNAPTRADE_API_BASE } from "./discovery";
import { AuthError, getAccessToken } from "./auth";
import { authMode } from "./preferences";
import { cacheGeneration, cacheGetEntry, cacheSet } from "./cache";
import { inFlight } from "./inflight";
import { rateLimitMessage } from "./rate-limit";

/** Identifies Folio in SnapTrade's request logs. */
const USER_AGENT = "Folio (Raycast extension; +https://github.com/ShayanAbedi/folio)";

/**
 * Concurrent identical GETs share one request. Several views load at once (the Menu Bar loads the
 * portfolio and activities together, both starting with /accounts), and SnapTrade rate-limits each
 * account, so a duplicate costs quota as well as time. A shared request is already in flight, so
 * its data is never older than starting a new one.
 */
const sharedGet = inFlight<{ data: unknown; at: number }>();

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  /** Cache TTL for GETs. 0 disables caching. */
  ttlMs?: number;
  /** Bypass the cache (Refresh action). */
  fresh?: boolean;
  /** Filled in with when the returned data was fetched from SnapTrade (earlier than now on a cache hit). */
  meta?: FetchMeta;
}

export interface FetchMeta {
  /** Epoch ms. */
  fetchedAt?: number;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${SNAPTRADE_API_BASE}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/** One HTTP attempt. */
async function once<T>(
  url: string,
  opts: RequestOptions,
  token: string,
): Promise<{ status: number; data: T | undefined; raw: string; headers: Headers }> {
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const raw = await res.text();
  let data: T | undefined;
  try {
    data = raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    data = undefined;
  }
  return { status: res.status, data, raw, headers: res.headers };
}

export async function snaptrade<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const url = buildUrl(path, opts.query);
  const ttl = opts.ttlMs ?? (method === "GET" ? undefined : 0);
  const cacheKey = `${authMode()}:${url}`;
  if (method === "GET" && ttl !== 0 && !opts.fresh) {
    const hit = cacheGetEntry<T>(cacheKey, ttl);
    if (hit !== undefined) {
      if (opts.meta) opts.meta.fetchedAt = hit.at;
      return hit.value;
    }
  }
  if (method !== "GET") return request<T>(url, path, method, opts);
  const generation = cacheGeneration();
  const { data, at } = await sharedGet(`${generation}:${cacheKey}`, async () => {
    const value = await request<T>(url, path, method, opts);
    // Don't put a response from before a ⌘R back into the cache it cleared.
    if (ttl !== 0 && generation === cacheGeneration()) cacheSet(cacheKey, value);
    return { data: value, at: Date.now() };
  });
  if (opts.meta) opts.meta.fetchedAt = at;
  return data as T;
}

async function request<T>(url: string, path: string, method: string, opts: RequestOptions): Promise<T> {
  let token = await getAccessToken();
  let result = await once<T>(url, opts, token);
  if (result.status === 401) {
    // Refresh once, unless another request already replaced the rejected token; then retry once.
    token = await getAccessToken({ force: true, rejected: token });
    result = await once<T>(url, opts, token);
  }
  if (result.status === 401) {
    throw new AuthError("SnapTrade rejected the session. Sign in again.", "signed-out");
  }
  if (result.status === 429) {
    throw new ApiError(
      rateLimitMessage((name) => result.headers.get(name)),
      429,
      result.data,
    );
  }
  if (result.status < 200 || result.status >= 300) {
    const detail =
      result.data && typeof result.data === "object" && "detail" in result.data
        ? String((result.data as { detail: unknown }).detail)
        : result.raw.slice(0, 200);
    throw new ApiError(
      `SnapTrade ${method} ${path} → ${result.status}${detail ? `: ${detail}` : ""}`,
      result.status,
      result.data,
    );
  }
  return result.data as T;
}
