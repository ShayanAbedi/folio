# Fathom auth worker

A stateless Cloudflare Worker that performs the three OAuth calls a SnapTrade **confidential** client can't make from inside a Raycast extension: token exchange, refresh, and revocation. It holds the `client_secret`; the extension never sees it.

It does not store user tokens, does not proxy portfolio data, and never logs tokens or the secret. The only upstream URLs it calls are the `token_endpoint` and `revocation_endpoint` published at `https://api.snaptrade.com/.well-known/oauth-authorization-server`.

## Endpoints

| Method | Path | Body (JSON) | Returns |
| --- | --- | --- | --- |
| POST | `/oauth/token` | `{ "grant_type": "authorization_code", "code", "code_verifier", "redirect_uri" }` | SnapTrade token response (`access_token`, `refresh_token`, `expires_in`, `scope`, `id_token`) |
| POST | `/oauth/refresh` | `{ "refresh_token" }` | New `access_token` **and** rotated `refresh_token`. Replace both. |
| POST | `/oauth/revoke` | `{ "token", "token_type_hint"? }` | `{ "revoked": true }` |
| GET | `/healthz` | – | `{ "ok": true, "configured": bool }` |

Checks performed before anything reaches SnapTrade: JSON body ≤ 16 KB, `code_verifier` is a valid PKCE verifier, and `redirect_uri` is on the allowlist (exact match). Upstream errors (for example `invalid_grant` when a refresh token has already been rotated) are relayed with their status so the extension can sign the user out.

## Setup

Requirements: Node 20+, a Cloudflare account, `npm install` in this folder (installs `wrangler`).

1. Register an OAuth app in the [SnapTrade dashboard](https://dashboard.snaptrade.com) → Settings → OAuth App. Add the Raycast redirect URI **exactly**: `https://raycast.com/redirect?packageName=Extension`. Copy the `client_id` and `client_secret`.
2. Put the credentials in Worker secrets (never in `wrangler.toml`, never in git):

   ```bash
   npx wrangler secret put SNAPTRADE_OAUTH_CLIENT_ID
   ```

   ```bash
   npx wrangler secret put SNAPTRADE_OAUTH_CLIENT_SECRET
   ```

3. Check `ALLOWED_REDIRECT_URIS` in `wrangler.toml`. It must contain the same redirect URI you registered with SnapTrade.
4. Deploy:

   ```bash
   npm run deploy
   ```

   Wrangler prints the worker URL, e.g. `https://fathom-auth.<subdomain>.workers.dev`.

5. In the extension, set `authWorkerUrl` (the `AUTH_WORKER_URL`) and `oauthClientId` defaults in `extension/package.json` to that URL and your `client_id`, then build and publish the extension.

### Local development

```bash
cp .dev.vars.example .dev.vars
```

Fill in `.dev.vars` (gitignored), then:

```bash
npm run dev
```

Point the extension's *Auth Worker URL* preference at the printed local URL. Note SnapTrade only accepts `https` redirect URIs in production, so the Raycast redirect stays the same.

### Tests

```bash
npm test
```

Runs the handler against a fake `fetch`: allowlist, PKCE validation, Basic auth header, form encoding, refresh rotation relay, revoke, and fail-closed behaviour when secrets are missing.

## Threat model in one paragraph

Anyone can call this worker, so it must not be able to do anything harmful on its own. It can only turn a one-time authorization code plus the matching PKCE verifier into tokens (both are already in the caller's hands), rotate a refresh token the caller already holds, or revoke a token the caller already holds. It cannot read accounts, mint tokens without a code, or redirect to arbitrary URIs. If the secret ever leaks, rotate it in the SnapTrade dashboard and re-run `wrangler secret put`.
