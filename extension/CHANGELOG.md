# Folio Changelog

## [Reliability Fixes] - {PR_MERGE_DATE}

- Fixed being signed out for no reason when two Folio commands refreshed the SnapTrade session at the same moment (for example the Menu Bar in the background and a command you opened)
- The session now refreshes a few minutes before it expires, so requests don't straddle the expiry
- An account whose holdings fail to refresh keeps its last loaded holdings, marked with the time they're from, instead of disappearing from the Menu Bar and its net worth
- The Menu Bar lists accounts that couldn't be loaded at all, instead of leaving them out silently
- "Updated" time in the Menu Bar and Show Portfolio, and a note when a refresh failed and older data is shown
- At most two balance and position requests at a time per brokerage connection, so brokerages are less likely to rate-limit Folio

## [Initial Version] - 2026-09-29

- Sign In with SnapTrade (OAuth, PKCE, read-only) with token refresh and revoke through the Folio auth worker
- Show Portfolio: net worth per currency, accounts grouped by institution, holdings per account
- Show Positions: every position across accounts in one searchable list with weights and open P&L; optional ticker argument jumps straight to a holding
- Show Activities: All / Trades / Dividends / Deposits across accounts
- Show Fog: idle cash and how long it has been sitting, computed from activities
- Connect Brokerage: read-only SnapTrade Connection Portal and connection status
- Menu Bar Portfolio: net worth (and day change when SnapTrade reports balance history) with masked privacy mode
- Privacy mode (⌘⇧P) that hides every balance
- Bundled Wealthsimple / Questrade / IBKR fixtures for demos and screenshots
