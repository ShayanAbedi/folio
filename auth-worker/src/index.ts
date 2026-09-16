/**
 * Folio auth worker.
 *
 * SnapTrade Dashboard OAuth apps are confidential clients: token exchange, refresh and revocation
 * require HTTP Basic client_id:client_secret in addition to PKCE. This worker holds that secret so
 * the Raycast extension never does. It is deliberately tiny and stateless:
 *
 *   POST /oauth/token    { grant_type: "authorization_code", code, code_verifier, redirect_uri }
 *   POST /oauth/refresh  { refresh_token }               -> new access + rotated refresh token
 *   POST /oauth/revoke   { token, token_type_hint? }
 *   GET  /healthz
 *
 * It never stores user tokens, never proxies portfolio data, never logs tokens or the secret, and
 * only ever talks to the token/revocation endpoints published by SnapTrade's discovery document.
 */

export interface Env {
  SNAPTRADE_OAUTH_CLIENT_ID: string;
  SNAPTRADE_OAUTH_CLIENT_SECRET: string;
  ALLOWED_REDIRECT_URIS?: string;
  SNAPTRADE_ISSUER?: string;
  /** Optional Workers rate-limit binding (see wrangler.toml). Per client IP. */
  RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

interface Discovery {
  issuer: string;
  token_endpoint: string;
  revocation_endpoint?: string;
}

const DEFAULT_ISSUER = "https://api.snaptrade.com";
const DISCOVERY_TTL_MS = 60 * 60 * 1000;
const MAX_BODY_BYTES = 16 * 1024;

let discoveryCache: { at: number; issuer: string; doc: Discovery } | null = null;

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  // No CORS headers on purpose: browsers must not be able to call this from web pages.
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function oauthError(status: number, error: string, description?: string): Response {
  return json(status, { error, ...(description ? { error_description: description } : {}) });
}

export function isAllowedRedirect(uri: string, allowlist: string | undefined): boolean {
  const allowed = (allowlist ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(uri);
}

function isHttpsUrl(value: string, host?: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && (!host || u.host === host);
  } catch {
    return false;
  }
}

export async function getDiscovery(env: Env, fetcher: typeof fetch = fetch): Promise<Discovery> {
  const issuer = (env.SNAPTRADE_ISSUER ?? DEFAULT_ISSUER).replace(/\/+$/, "");
  if (discoveryCache && discoveryCache.issuer === issuer && Date.now() - discoveryCache.at < DISCOVERY_TTL_MS) {
    return discoveryCache.doc;
  }
  const res = await fetcher(`${issuer}/.well-known/oauth-authorization-server`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`discovery failed: ${res.status}`);
  const doc = (await res.json()) as Partial<Discovery>;
  const issuerHost = new URL(issuer).host;
  if (
    !doc ||
    doc.issuer !== issuer ||
    typeof doc.token_endpoint !== "string" ||
    !isHttpsUrl(doc.token_endpoint, issuerHost) ||
    (doc.revocation_endpoint !== undefined && !isHttpsUrl(doc.revocation_endpoint, issuerHost))
  ) {
    throw new Error("discovery document failed validation");
  }
  const valid: Discovery = { issuer: doc.issuer, token_endpoint: doc.token_endpoint, revocation_endpoint: doc.revocation_endpoint };
  discoveryCache = { at: Date.now(), issuer, doc: valid };
  return valid;
}

function basicAuth(env: Env): string {
  return "Basic " + btoa(`${env.SNAPTRADE_OAUTH_CLIENT_ID}:${env.SNAPTRADE_OAUTH_CLIENT_SECRET}`);
}

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  const len = Number(request.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) return null;
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    const parsed = JSON.parse(text) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function str(v: unknown, max = 4096): string | null {
  return typeof v === "string" && v.length > 0 && v.length <= max ? v : null;
}

/** Forwards a form-encoded request to SnapTrade with client credentials and relays the JSON verbatim. */
async function forward(env: Env, endpoint: string, form: Record<string, string>, fetcher: typeof fetch): Promise<Response> {
  const upstream = await fetcher(endpoint, {
    method: "POST",
    headers: {
      Authorization: basicAuth(env),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(form).toString(),
  });
  const text = await upstream.text();
  // Relay status + JSON body untouched. No logging: bodies contain tokens.
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: "upstream_error", error_description: `SnapTrade returned non-JSON (${upstream.status})` };
  }
  const status = upstream.ok ? 200 : upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
  return json(status, body);
}

export async function handle(request: Request, env: Env, fetcher: typeof fetch = fetch): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/healthz") {
    return json(200, { ok: true, configured: Boolean(env.SNAPTRADE_OAUTH_CLIENT_ID && env.SNAPTRADE_OAUTH_CLIENT_SECRET) });
  }
  if (request.method !== "POST") {
    return oauthError(405, "invalid_request", "POST only");
  }
  if (env.RATE_LIMITER) {
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return oauthError(429, "slow_down", "too many requests from this address; try again in a minute");
  }
  if (!env.SNAPTRADE_OAUTH_CLIENT_ID || !env.SNAPTRADE_OAUTH_CLIENT_SECRET) {
    return oauthError(500, "server_error", "worker is missing SNAPTRADE_OAUTH_CLIENT_ID / SNAPTRADE_OAUTH_CLIENT_SECRET");
  }

  const body = await readJsonBody(request);
  if (!body) return oauthError(400, "invalid_request", "expected a JSON object body");

  let discovery: Discovery;
  try {
    discovery = await getDiscovery(env, fetcher);
  } catch {
    return oauthError(502, "server_error", "could not load SnapTrade discovery document");
  }

  switch (url.pathname) {
    case "/oauth/token": {
      if (body.grant_type !== "authorization_code") {
        return oauthError(400, "unsupported_grant_type", "grant_type must be authorization_code");
      }
      const code = str(body.code);
      const verifier = str(body.code_verifier, 256);
      const redirectUri = str(body.redirect_uri, 2048);
      if (!code || !verifier || !redirectUri) {
        return oauthError(400, "invalid_request", "code, code_verifier and redirect_uri are required");
      }
      if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) {
        return oauthError(400, "invalid_request", "code_verifier is not a valid PKCE verifier");
      }
      if (!isAllowedRedirect(redirectUri, env.ALLOWED_REDIRECT_URIS)) {
        return oauthError(400, "invalid_request", "redirect_uri is not allowlisted");
      }
      return forward(
        env,
        discovery.token_endpoint,
        { grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: redirectUri },
        fetcher,
      );
    }
    case "/oauth/refresh": {
      const refreshToken = str(body.refresh_token);
      if (!refreshToken) return oauthError(400, "invalid_request", "refresh_token is required");
      return forward(env, discovery.token_endpoint, { grant_type: "refresh_token", refresh_token: refreshToken }, fetcher);
    }
    case "/oauth/revoke": {
      const token = str(body.token);
      if (!token) return oauthError(400, "invalid_request", "token is required");
      if (!discovery.revocation_endpoint) return oauthError(501, "server_error", "provider does not advertise a revocation endpoint");
      const hint = str(body.token_type_hint, 32);
      const form: Record<string, string> = { token };
      if (hint === "refresh_token" || hint === "access_token") form.token_type_hint = hint;
      const res = await forward(env, discovery.revocation_endpoint, form, fetcher);
      // RFC 7009: a 200 with an empty body is success. Normalise so the client gets JSON either way.
      return res.status === 200 ? json(200, { revoked: true }) : res;
    }
    default:
      return oauthError(404, "invalid_request", "unknown endpoint");
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    return handle(request, env);
  },
};
