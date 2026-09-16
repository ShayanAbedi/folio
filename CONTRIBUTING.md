# Contributing to Folio

```
folio/
├── extension/    Raycast extension (TypeScript, @raycast/api)
└── auth-worker/  Stateless Cloudflare Worker holding the SnapTrade OAuth client secret
```

## Extension

```bash
cd extension && npm install && npm run dev
```

`npm run dev` imports the extension into Raycast and rebuilds on save. Turn on the **Use bundled fixture data** preference to work without a SnapTrade account.

```bash
cd extension && npm test
```

Tests cover the pure modules only: portfolio math, Fog, the `/positions/all` adapter, formatting, and the dev-only request signing. `npm run lint` and `npm run build` must both pass before a Store submission.

## Auth worker

The extension defaults to the maintainer's deployed worker, so contributors don't need their own. The worker is a stateless Cloudflare Worker that performs the three OAuth calls a confidential client can't make from inside an extension:

| Method | Path | Body (JSON) | Returns |
| --- | --- | --- | --- |
| POST | `/oauth/token` | `{ grant_type: "authorization_code", code, code_verifier, redirect_uri }` | SnapTrade token response |
| POST | `/oauth/refresh` | `{ refresh_token }` | New access token and rotated refresh token |
| POST | `/oauth/revoke` | `{ token, token_type_hint? }` | `{ revoked: true }` |
| GET | `/healthz` | – | `{ ok, configured }` |

```bash
cd auth-worker && npm install && npm test
```

### Running your own (forks)

1. Register an OAuth app in the [SnapTrade dashboard](https://dashboard.snaptrade.com) → Settings → OAuth App. Add the redirect URI exactly: `https://raycast.com/redirect?packageName=Extension`. Copy the `client_id` and `client_secret`.
2. `cd auth-worker && npx wrangler login`, then store the credentials as Worker secrets (never in `wrangler.toml`, never in git):

   ```bash
   npx wrangler secret put SNAPTRADE_OAUTH_CLIENT_ID
   ```

   ```bash
   npx wrangler secret put SNAPTRADE_OAUTH_CLIENT_SECRET
   ```

3. `npm run deploy`. Wrangler prints the worker URL; `curl <url>/healthz` should report `configured: true`.
4. Point `authWorkerUrl` and `oauthClientId` in `extension/package.json` at your worker URL and client ID.

For local work, copy `auth-worker/.dev.vars.example` to `.dev.vars` (gitignored), fill it in, run `npm run dev`, and set the extension's *Auth Worker URL* preference to `http://localhost:8787`.

## Developer-only preferences

Two preferences exist for development and are off by default: the fixture toggle, and a **Personal API key** mode that signs requests with a SnapTrade `clientId` + `consumerKey` instead of OAuth. Neither is meant for Store users.

## Rules of the road

- Never commit credentials. `.dev.vars`, `.env*` and key files are gitignored; the extension has no place for a secret by design.
- The extension talks to SnapTrade with `Authorization: Bearer` only. Don't add `clientId`, `consumerKey`, `userId`, `userSecret` or signature headers to the OAuth path.
- Don't proxy portfolio data through the worker. It exists only for token exchange, refresh and revoke.
- Never show a number the API didn't give us. If data is missing, show nothing rather than an estimate.
