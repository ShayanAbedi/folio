import { test } from "node:test";
import assert from "node:assert/strict";
import { handle, isAllowedRedirect, type Env } from "../src/index.ts";

const env: Env = {
  SNAPTRADE_OAUTH_CLIENT_ID: "cid",
  SNAPTRADE_OAUTH_CLIENT_SECRET: "sekrit",
  ALLOWED_REDIRECT_URIS: "https://raycast.com/redirect?packageName=Extension",
};

const discovery = {
  issuer: "https://api.snaptrade.com",
  token_endpoint: "https://api.snaptrade.com/oauth/token/",
  revocation_endpoint: "https://api.snaptrade.com/oauth/revoke_token/",
};

function fakeFetch(calls: { url: string; init?: RequestInit }[], upstream: (url: string, init?: RequestInit) => Response) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.endsWith("/.well-known/oauth-authorization-server")) return new Response(JSON.stringify(discovery), { status: 200 });
    return upstream(url, init);
  }) as typeof fetch;
}

const post = (path: string, body: unknown) =>
  new Request(`https://worker.test${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

const VERIFIER = "a".repeat(64);

test("redirect allowlist is exact-match", () => {
  assert.equal(isAllowedRedirect("https://raycast.com/redirect?packageName=Extension", env.ALLOWED_REDIRECT_URIS), true);
  assert.equal(isAllowedRedirect("https://raycast.com/redirect?packageName=Extension/", env.ALLOWED_REDIRECT_URIS), false);
  assert.equal(isAllowedRedirect("https://evil.example/redirect", env.ALLOWED_REDIRECT_URIS), false);
  assert.equal(isAllowedRedirect("https://raycast.com/redirect?packageName=Extension", undefined), false);
});

test("token exchange forwards PKCE + Basic auth to the discovered token endpoint", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = fakeFetch(calls, () => new Response(JSON.stringify({ access_token: "at", refresh_token: "rt", expires_in: 36000 }), { status: 200 }));
  const res = await handle(
    post("/oauth/token", { grant_type: "authorization_code", code: "abc", code_verifier: VERIFIER, redirect_uri: "https://raycast.com/redirect?packageName=Extension" }),
    env,
    f,
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as Record<string, unknown>;
  assert.equal(body.access_token, "at");
  const upstream = calls.find((c) => c.url === discovery.token_endpoint)!;
  assert.ok(upstream, "called discovered token endpoint");
  const headers = upstream.init!.headers as Record<string, string>;
  assert.equal(headers.Authorization, "Basic " + Buffer.from("cid:sekrit").toString("base64"));
  assert.equal(headers["Content-Type"], "application/x-www-form-urlencoded");
  const form = new URLSearchParams(String(upstream.init!.body));
  assert.equal(form.get("grant_type"), "authorization_code");
  assert.equal(form.get("code"), "abc");
  assert.equal(form.get("code_verifier"), VERIFIER);
  assert.equal(form.get("redirect_uri"), "https://raycast.com/redirect?packageName=Extension");
  assert.equal(form.has("client_secret"), false);
});

test("token exchange rejects non-allowlisted redirect_uri before touching SnapTrade", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = fakeFetch(calls, () => new Response("{}", { status: 200 }));
  const res = await handle(post("/oauth/token", { grant_type: "authorization_code", code: "abc", code_verifier: VERIFIER, redirect_uri: "https://evil.example/cb" }), env, f);
  assert.equal(res.status, 400);
  assert.equal(calls.some((c) => c.url === discovery.token_endpoint), false);
});

test("refresh forwards refresh_token grant and relays the rotated pair", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = fakeFetch(calls, () => new Response(JSON.stringify({ access_token: "at2", refresh_token: "rt2", expires_in: 36000 }), { status: 200 }));
  const res = await handle(post("/oauth/refresh", { refresh_token: "rt1" }), env, f);
  assert.equal(res.status, 200);
  const body = (await res.json()) as Record<string, unknown>;
  assert.equal(body.refresh_token, "rt2");
  const form = new URLSearchParams(String(calls.find((c) => c.url === discovery.token_endpoint)!.init!.body));
  assert.equal(form.get("grant_type"), "refresh_token");
  assert.equal(form.get("refresh_token"), "rt1");
});

test("refresh relays upstream invalid_grant so the client can sign out", async () => {
  const f = fakeFetch([], () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }));
  const res = await handle(post("/oauth/refresh", { refresh_token: "dead" }), env, f);
  assert.equal(res.status, 400);
  assert.equal(((await res.json()) as { error: string }).error, "invalid_grant");
});

test("revoke posts to the discovered revocation endpoint", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = fakeFetch(calls, () => new Response("", { status: 200 }));
  const res = await handle(post("/oauth/revoke", { token: "rt", token_type_hint: "refresh_token" }), env, f);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { revoked: true });
  const form = new URLSearchParams(String(calls.find((c) => c.url === discovery.revocation_endpoint)!.init!.body));
  assert.equal(form.get("token"), "rt");
  assert.equal(form.get("token_type_hint"), "refresh_token");
});

test("bad input and unknown routes are rejected", async () => {
  const f = fakeFetch([], () => new Response("{}", { status: 200 }));
  assert.equal((await handle(post("/oauth/token", { grant_type: "password" }), env, f)).status, 400);
  assert.equal((await handle(post("/oauth/token", { grant_type: "authorization_code", code: "x", code_verifier: "short", redirect_uri: "https://raycast.com/redirect?packageName=Extension" }), env, f)).status, 400);
  assert.equal((await handle(post("/oauth/refresh", {}), env, f)).status, 400);
  assert.equal((await handle(post("/nope", {}), env, f)).status, 404);
  assert.equal((await handle(new Request("https://worker.test/oauth/token"), env, f)).status, 405);
  assert.equal((await handle(new Request("https://worker.test/oauth/token", { method: "POST", body: "not json" }), env, f)).status, 400);
});

test("missing secrets fail closed without calling upstream", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = fakeFetch(calls, () => new Response("{}", { status: 200 }));
  const res = await handle(post("/oauth/refresh", { refresh_token: "rt" }), { ...env, SNAPTRADE_OAUTH_CLIENT_SECRET: "" }, f);
  assert.equal(res.status, 500);
  assert.equal(calls.length, 0);
});

test("healthz reports configuration without leaking values", async () => {
  const res = await handle(new Request("https://worker.test/healthz"), env);
  const body = (await res.json()) as Record<string, unknown>;
  assert.deepEqual(body, { ok: true, configured: true });
});

test("rate limiter rejects with 429 when the binding says no", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const f = fakeFetch(calls, () => new Response("{}", { status: 200 }));
  const limited: Env = { ...env, RATE_LIMITER: { limit: async () => ({ success: false }) } };
  const res = await handle(post("/oauth/refresh", { refresh_token: "rt" }), limited, f);
  assert.equal(res.status, 429);
  assert.equal(calls.length, 0, "nothing forwarded upstream");
  const ok: Env = { ...env, RATE_LIMITER: { limit: async () => ({ success: true }) } };
  assert.equal((await handle(post("/oauth/refresh", { refresh_token: "rt" }), ok, f)).status, 200);
});

test("responses carry no-store and nosniff, and no CORS headers", async () => {
  const res = await handle(new Request("https://worker.test/healthz"), env);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("access-control-allow-origin"), null);
});
