# Contributing to Fathom

```
fathom/
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

The extension defaults to the maintainer's deployed worker, so contributors don't need their own. If you are forking Fathom for your own SnapTrade OAuth app, [`auth-worker/README.md`](auth-worker/README.md) covers registering the app, setting secrets with `wrangler secret put`, the exact Raycast redirect URI, and deploying. Then point `authWorkerUrl` and `oauthClientId` in `extension/package.json` at your worker and client ID.

```bash
cd auth-worker && npm install && npm test
```

## Developer-only preferences

Two preferences exist for development and are off by default: the fixture toggle, and a **Personal API key** mode that signs requests with a SnapTrade `clientId` + `consumerKey` instead of OAuth. Neither is meant for Store users.

## Rules of the road

- Never commit credentials. `.dev.vars`, `.env*` and key files are gitignored; the extension has no place for a secret by design.
- The extension talks to SnapTrade with `Authorization: Bearer` only. Don't add `clientId`, `consumerKey`, `userId`, `userSecret` or signature headers to the OAuth path.
- Don't proxy portfolio data through the worker. It exists only for token exchange, refresh and revoke.
- Never show a number the API didn't give us. If data is missing, show nothing rather than an estimate.
