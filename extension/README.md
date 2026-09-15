# Fathom

Your portfolio in Raycast. Net worth, holdings, activities and idle cash from every brokerage you've connected through [SnapTrade](https://snaptrade.com). Keyboard-first, read-only, MIT.

Fathom never places trades or moves money. SnapTrade OAuth apps are read-only by design, and the extension only ever sends `Authorization: Bearer <your token>` to SnapTrade.

## Commands

| Command | What it shows |
| --- | --- |
| Sign in with SnapTrade | Start or end a read-only SnapTrade session |
| Show Portfolio | Net worth per currency, accounts by institution, holdings per account |
| Show Positions | Every position across accounts, searchable, with weight and open P&L |
| Search Position | A ticker across all accounts (`Search Position AAPL`) |
| Show Activities | All · Trades · Dividends · Deposits for the last 365 days |
| Show Fog | Idle cash: "{N} days idle" and the undeployed amount |
| Connect Brokerage | Read-only SnapTrade Connection Portal and connection status |
| Menu Bar Portfolio | Net worth in the menu bar, per-account totals, Fog |

Everywhere: **⌘⇧P** hides balances (privacy mode), **⌘R** refreshes past the 60–120 s cache, **⌘I** toggles position details.

## Using Fathom

1. Run **Sign in with SnapTrade**. Your browser opens SnapTrade's consent page; approve read access.
2. Run **Connect Brokerage** if you haven't linked a brokerage to SnapTrade yet. The Connection Portal opens in your browser and only asks for read-only access.
3. Run **Show Portfolio**.

Nothing to paste: the OAuth client secret lives in a small worker run by the maintainer, and your tokens are stored by Raycast's OAuth client on your Mac.

### Preferences

| Preference | Purpose |
| --- | --- |
| Auth Worker URL | The maintainer's deployed `auth-worker` (see below). Pre-filled for the Store build. |
| SnapTrade OAuth Client ID | Public identifier of the maintainer's SnapTrade OAuth app. Not a secret. |
| Use bundled fixture data | Demo mode with sample Wealthsimple, Questrade and IBKR accounts. No network. |
| Use a Personal API key (dev) | Developers only: bypass OAuth with your own SnapTrade Personal API key. Off by default and not meant for Store users. |

## How Fog is computed

Fog is cash that isn't doing anything. The amount is the sum of cash balances across accounts (per currency). The idle days are counted from the later of your last buy and your last deposit within the activity window. If neither happened inside the window, Fathom reports "365+" rather than guessing. It understates on purpose.

## For maintainers: setting up OAuth

SnapTrade dashboard OAuth apps are confidential clients: the token, refresh and revoke calls need HTTP Basic `client_id:client_secret` on top of PKCE. The secret cannot ship inside an extension, so those three calls go through the stateless Cloudflare Worker in [`../auth-worker`](../auth-worker). All portfolio reads go straight from Raycast to SnapTrade.

1. In the [SnapTrade dashboard](https://dashboard.snaptrade.com) open **Settings → OAuth App** and register an app. Copy the `client_id` and the `client_secret` (shown once).
2. Add the exact Raycast redirect URI to the app. Run **Sign in with SnapTrade** in Raycast and use *Copy Redirect URI*; it is `https://raycast.com/redirect?packageName=Extension` for Raycast's Web redirect method. It must match character for character.
3. Deploy the worker: see [`../auth-worker/README.md`](../auth-worker/README.md). Put the secret in the worker's environment with `wrangler secret put`, never in git.
4. Set `AUTH_WORKER_URL` (the `authWorkerUrl` preference default in `package.json`) and `oauthClientId` to your worker URL and client_id before publishing.
5. `npm run lint && npm run build` must pass. Then `npm run publish`.

Local development: `npm install`, `npm run dev`. `npm test` runs the pure portfolio math against the fixtures.

Screenshots: the three images in `metadata/` are rendered from the fixtures by `node scripts/screenshots.mjs` (headless Chrome, 2000×1250) so they contain no real balances. Before a Store submission, replace them with real captures from Raycast's *Window Capture* command with demo mode on.

## Security notes

- The extension never sends `clientId`, `consumerKey`, `userId`, `userSecret`, `timestamp` or a `Signature` header. Bearer only.
- Tokens are stored through `OAuth.PKCEClient.setTokens`. Sign out revokes the refresh token through the worker and then removes both tokens.
- On a 401 the extension refreshes once and retries once. If that fails it clears the session and asks you to sign in again.
- The `id_token` (if `openid` was granted) is only decoded locally to show your email on the sign-in screen. It is never sent anywhere.
