import { CopyButton } from "@/components/CopyButton";
import { HeroGlow } from "@/components/HeroGlow";
import { Shot } from "@/components/Shot";

import {
  asset,
  AUTH_WORKER,
  GITHUB,
  INSTALL_COMMAND,
  RELAUNCH_COMMAND,
  RAYCAST,
  RAYCAST_STORE,
  SECURITY_MD,
  SNAPTRADE,
  SNAPTRADE_SIGNUP,
  TAGLINE,
} from "./content";

/** Feature shots sit in the wider grid column: ~650px once the layout stops growing. */
const FEATURE_SIZES =
  "(min-width: 1180px) 648px, (min-width: 900px) 55vw, 90vw";

export default function Page() {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="hero">
        <HeroGlow />
        <div className="wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="hero__logo"
            src={asset("/folio-icon-256.webp")}
            alt=""
            width={256}
            height={256}
            fetchPriority="high"
          />
          <p className="hero__name">Folio</p>
          <h1>{TAGLINE}</h1>
          <p className="hero__liner">
            A keyboard-first, read-only view of every brokerage account
            you&rsquo;ve connected through <a href={SNAPTRADE}>SnapTrade</a>:
            net worth, holdings, activities, and <em>Fog</em>, the cash
            you&rsquo;ve left idle.
          </p>

          <div className="hero__actions">
            {RAYCAST_STORE ? (
              <a className="btn btn--primary" href={RAYCAST_STORE}>
                Install from Raycast Store
              </a>
            ) : (
              <a className="btn btn--primary" href="#install">
                Install from Raycast Store
                <span className="btn__pill">In review</span>
              </a>
            )}
            <a className="btn btn--ghost" href={GITHUB} rel="noreferrer">
              View on GitHub
            </a>
          </div>

          <p className="hero__note">
            Free and open source, MIT licensed. Read-only by design: Folio
            cannot place trades or move money.
          </p>

          <div className="hero__shot">
            <Shot
              name="portfolio"
              priority
              tightBelow="760px"
              sizes="(min-width: 1260px) 1084px, 90vw"
              alt="The Show Portfolio command in Raycast: net worth of $167,648.17 CAD across 4 accounts and $94,118.77 USD, with accounts listed under Wealthsimple, Questrade and Interactive Brokers, each showing cash, day change and total value."
            />
          </div>
        </div>
      </header>

      <main id="main">
        <div className="wrap">
          <section className="features" aria-label="Features">
            <article className="feature">
              <div className="feature__text">
                <h2>Net worth at a glance</h2>
                <p>
                  Every connected account, grouped by the institution it lives
                  at, with totals per currency at the top. Where your brokerage
                  reports it, the day&rsquo;s change sits on the line.
                </p>
                <ul className="feature__meta">
                  <li>Grouped by institution</li>
                  <li>Per-currency totals</li>
                  <li>
                    Day change when SnapTrade has balance history for every
                    account
                  </li>
                </ul>
              </div>
              <div className="feature__media">
                <Shot
                  name="portfolio"
                  variant="tight"
                  sizes={FEATURE_SIZES}
                  alt="Net worth rows for CAD and USD above accounts grouped under Wealthsimple, Questrade and Interactive Brokers, each with cash, day change and total."
                />
              </div>
            </article>

            <article className="feature feature--flip">
              <div className="feature__text">
                <h2>Every position, searchable</h2>
                <p>
                  Type a ticker anywhere and land on the holding. The detail
                  panel carries weight, open P&amp;L, average cost and exchange,
                  across every account at once.
                </p>
                <ul className="feature__meta">
                  <li>Weight</li>
                  <li>Open P&amp;L</li>
                  <li>Average cost</li>
                  <li>Exchange</li>
                </ul>
              </div>
              <div className="feature__media">
                <Shot
                  name="positions"
                  variant="tight"
                  sizes={FEATURE_SIZES}
                  alt="The Show Positions command: a searchable list of 15 holdings beside a detail panel for NVDA showing market value, units, price, average cost, open P&L of +$9,696.00 (+88.2%), weight and exchange."
                />
              </div>
            </article>

            <article className="feature">
              <div className="feature__text">
                <h2>Trades, dividends, deposits</h2>
                <p>
                  A year of activity across every account, newest first and
                  grouped by month. Narrow it to trades, dividends or deposits,
                  or search the whole list.
                </p>
                <ul className="feature__meta">
                  <li>All · Trades · Dividends · Deposits</li>
                  <li>Last 365 days</li>
                  <li>Grouped by month</li>
                </ul>
              </div>
              <div className="feature__media">
                <Shot
                  name="activities"
                  variant="tight"
                  sizes={FEATURE_SIZES}
                  alt="The Show Activities command: activity grouped by month, with contributions, dividends and buys each showing the account, amount and date, and an All filter in the search bar."
                />
              </div>
            </article>

            <article className="feature feature--flip">
              <div className="feature__text">
                <h2>Fog: cash you forgot</h2>
                <p>
                  How much cash is sitting undeployed, and for how long. Counted
                  from your last buy or deposit, whichever came later, so the
                  number understates on purpose rather than guessing.
                </p>
                <ul className="feature__meta">
                  <li>Idle days</li>
                  <li>Undeployed per account</li>
                  <li>Understated on purpose</li>
                </ul>
              </div>
              <div className="feature__media">
                <Shot
                  name="fog"
                  variant="tight"
                  sizes={FEATURE_SIZES}
                  alt="The Show Fog command: 4 days idle, $25,022.27 USD undeployed plus $17,537.05 CAD, a table of where the cash sits by account, and a sidebar with last buy, last deposit and quiet streak."
                />
              </div>
            </article>
          </section>

          <hr className="rule" />

          <section className="callout" aria-labelledby="menubar-heading">
            <div className="callout__inner">
              <div>
                <h2 id="menubar-heading">And in the menu bar</h2>
                <p>
                  Net worth sits in the macOS menu bar, with per-account totals
                  and Fog one click away. <kbd>⌘⇧P</kbd> hides every balance,
                  everywhere Folio shows one, menu bar included.
                </p>
              </div>
              <div className="menubar" aria-hidden="true">
                <div className="menubar__strip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset("/folio-icon-128.webp")}
                    alt=""
                    width={128}
                    height={128}
                  />
                  <span className="num">$167,648.17</span>
                  <span className="menubar__label">Normal</span>
                </div>
                <div className="menubar__strip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset("/folio-icon-128.webp")}
                    alt=""
                    width={128}
                    height={128}
                  />
                  <span className="menubar__dots">••••••••</span>
                  <span className="menubar__label">Privacy mode</span>
                </div>
              </div>
            </div>
          </section>

          <hr className="rule" />

          <section className="block" aria-labelledby="how-heading">
            <div className="section-head">
              <p className="eyebrow">How it works</p>
              <h2 id="how-heading">Three commands from nothing to net worth</h2>
            </div>
            <ol className="steps">
              <li>
                <h3>Sign In with SnapTrade</h3>
                <p>
                  Your browser opens SnapTrade&rsquo;s consent page. Approve
                  read-only access and Raycast picks it up from there. Nothing
                  to paste.
                </p>
              </li>
              <li>
                <h3>Connect a brokerage</h3>
                <p>
                  Connect Brokerage opens SnapTrade&rsquo;s portal:
                  Wealthsimple, Questrade, Interactive Brokers, or any other
                  brokerage SnapTrade supports.
                </p>
              </li>
              <li>
                <h3>Show Portfolio</h3>
                <p>
                  That is the whole setup. <kbd>⌘R</kbd> refreshes,{" "}
                  <kbd>⌘I</kbd> toggles position details, <kbd>⌘⇧P</kbd> hides
                  balances.
                </p>
              </li>
            </ol>
            <p className="facts__footnote">
              Folio reads from SnapTrade, so you need a{" "}
              <a href={SNAPTRADE_SIGNUP} rel="noreferrer">
                SnapTrade account
              </a>{" "}
              with at least one brokerage connected.
            </p>
          </section>

          <hr className="rule" />

          <section className="block" aria-labelledby="privacy-heading">
            <div className="section-head">
              <p className="eyebrow">Privacy and security</p>
              <h2 id="privacy-heading">What Folio can and cannot do</h2>
            </div>
            <ul className="facts">
              <li>
                <b>Read-only scopes</b>
                Folio requests <code>read</code>, <code>openid</code> and{" "}
                <code>email</code>. SnapTrade OAuth apps cannot place, modify or
                cancel trades, and cannot move money.
              </li>
              <li>
                <b>Your data does not pass through us</b>
                Accounts, balances, positions and activities go directly from
                your Mac to <code>api.snaptrade.com</code>. No third-party
                server sees them.
              </li>
              <li>
                <b>Tokens stay on your Mac</b>
                They live in Raycast&rsquo;s encrypted OAuth store. Signing out
                revokes them at SnapTrade and deletes them locally, and tells
                you if the revoke didn&rsquo;t go through.
              </li>
              <li>
                <b>One small server component</b>A stateless, open-source{" "}
                <a href={AUTH_WORKER} rel="noreferrer">
                  Cloudflare Worker
                </a>{" "}
                turns your one-time sign-in code into tokens. It stores nothing.
              </li>
              <li>
                <b>No analytics, no telemetry</b>
                The extension makes no network calls beyond SnapTrade and that
                worker. This page sets no cookies and loads no third-party
                scripts.
              </li>
            </ul>
            <p className="facts__footnote">
              The full threat model, including known limitations, is in{" "}
              <a href={SECURITY_MD} rel="noreferrer">
                SECURITY.md
              </a>
              .
            </p>
          </section>

          <hr className="rule" />

          <section
            className="block"
            id="install"
            aria-labelledby="install-heading"
          >
            <div className="section-head">
              <p className="eyebrow">Install</p>
              <h2 id="install-heading">
                Two commands, until the Store listing is live
              </h2>
              <p>
                The Raycast Store listing is in review. Until it clears, Folio
                installs from source.
              </p>
            </div>
            <p className="install-step">
              <strong>1.</strong> Clone, install and import into Raycast. Leave
              this running until it says <em>built extension successfully</em>.
            </p>
            <div className="command">
              <div className="command__bar">
                <span>Terminal</span>
                <CopyButton value={INSTALL_COMMAND} />
              </div>
              <pre>
                <code>
                  git clone https://github.com/ShayanAbedi/folio{" "}
                  <span className="op">&amp;&amp;</span> cd folio/extension{" "}
                  <span className="op">&amp;&amp;</span> npm install{" "}
                  <span className="op">&amp;&amp;</span> npx ray develop
                </code>
              </pre>
            </div>
            <p className="install-step">
              <strong>
                2. Then quit and reopen Raycast. This step is required.
              </strong>{" "}
              Raycast only routes sign-in callbacks to extensions that were
              present when it started, so without a relaunch the SnapTrade
              sign-in will open in your browser and never come back.
            </p>
            <div className="command">
              <div className="command__bar">
                <span>Terminal</span>
                <CopyButton value={RELAUNCH_COMMAND} />
              </div>
              <pre>
                <code>
                  killall Raycast<span className="op">;</span> open -a Raycast
                </code>
              </pre>
            </div>
            <p className="requirements">
              Requires macOS, <a href={RAYCAST}>Raycast</a> and Node 20+. After
              the relaunch you can stop the dev server with Ctrl+C; Folio stays
              installed under Raycast&rsquo;s Extension Development section. To
              update, <code>git pull</code>, run step 1 again, then step 2.
            </p>
          </section>
        </div>
      </main>

      <footer>
        <div className="wrap foot">
          <div className="foot__links">
            <a href={GITHUB} rel="noreferrer">
              GitHub
            </a>
            <a href={SECURITY_MD} rel="noreferrer">
              Security
            </a>
            <a href={SNAPTRADE} rel="noreferrer">
              SnapTrade
            </a>
          </div>
          <p className="foot__legal">
            Not affiliated with any brokerage. SnapTrade is a trademark of its
            owner. Folio is MIT licensed.
          </p>
        </div>
      </footer>
    </>
  );
}
