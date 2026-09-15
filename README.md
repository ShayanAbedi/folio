# Fathom

**Your portfolio in Raycast.** A keyboard-first, read-only view of every brokerage account you've connected through [SnapTrade](https://snaptrade.com): net worth, holdings, activities, and *Fog*, the cash you've left idle.

MIT licensed. No trading. No proxying of your holdings through anyone's server.

```
fathom/
├── extension/    Raycast Store extension (TypeScript, @raycast/api)
└── auth-worker/  Tiny stateless Cloudflare Worker holding the SnapTrade OAuth client secret
```

## Why two pieces

SnapTrade dashboard OAuth apps are *confidential* clients: exchanging, refreshing and revoking tokens needs HTTP Basic `client_id:client_secret` on top of PKCE. A Raycast extension is public code, so the secret can't live there. The worker does exactly those three calls and nothing else. Every portfolio read goes straight from Raycast to `api.snaptrade.com` with the user's own Bearer token.

```
Raycast ──(PKCE authorize)──▶ dashboard.snaptrade.com
Raycast ──(code + verifier)──▶ auth-worker ──(Basic + PKCE)──▶ api.snaptrade.com/oauth/token
Raycast ──(Bearer)───────────▶ api.snaptrade.com/accounts, /holdings, /activities …
```

## Users

Install Fathom from the Raycast Store, run **Sign in with SnapTrade**, then **Connect Brokerage** if you haven't linked one yet. See [`extension/README.md`](extension/README.md).

## Maintainers

1. Register a SnapTrade OAuth app and note the `client_id` / `client_secret`.
2. Deploy the worker with the secret in its environment: [`auth-worker/README.md`](auth-worker/README.md).
3. Set the worker URL and client_id defaults in `extension/package.json`, then `npm run lint && npm run build` in `extension/`.

Demo mode (`Use bundled fixture data` preference) renders sample Wealthsimple, Questrade and IBKR accounts without any network access; it's what the Store screenshots use.

## Development

```bash
cd extension && npm install && npm run dev
```

```bash
cd extension && npm test
```

```bash
cd auth-worker && npm install && npm test
```

Nothing secret is ever committed: `.dev.vars`, `.env*` and keys are gitignored, and the extension has no place to put a secret in the first place.
