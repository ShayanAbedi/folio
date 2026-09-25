import { Fragment, type CSSProperties, type ReactElement } from "react";

import { asset } from "@/app/content";

import { ACTIVITIES, COMMANDS, FILTERS, FOG, MASK, POSITION, PORTFOLIO, type ActivityRow } from "./data";
import * as Icon from "./icons";
import type { Filter, Frame, View } from "./timeline";

const PLACEHOLDER: Record<View, string> = {
  root: "Search for apps and commands…",
  portfolio: "Search accounts…",
  positions: "Search ticker, name or account…",
  activities: "Search activities…",
  fog: "",
};

const COMMAND_TITLE: Record<View, string> = {
  root: "",
  portfolio: "Show Portfolio",
  positions: "Show Positions",
  activities: "Show Activities",
  fog: "Show Fog",
};

/** Staggers a row's entrance by its position. */
const nth = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Folio running in Raycast, redrawn in HTML at the size of the Store screenshots
 * (a 1068×668 stage, the window at 802×508), so the stage can scale it as a unit.
 */
export function RaycastWindow({ frame }: { frame: Frame }) {
  const { view } = frame;
  const q = frame.query.toLowerCase();
  const results = view === "root" && q ? COMMANDS.filter((c) => c.toLowerCase().includes(q)) : COMMANDS.slice(0, 4);
  const showArg = view === "root" && q !== "" && results[0] === "Show Positions";

  return (
    <div className="rc" data-open={frame.open}>
      <div className="rc__search">
        {view !== "root" && (
          <span className="rc__back">
            <Icon.Back />
          </span>
        )}
        {view !== "fog" && (
          <div className="rc__field">
            {frame.query && <span className="rc__text">{frame.query}</span>}
            {!frame.argFocused && <span className="rc__caret" />}
            {!frame.query && <span className="rc__placeholder">{PLACEHOLDER[view]}</span>}
            {showArg && (
              <span className="rc__arg" data-focused={frame.argFocused}>
                {frame.arg && <span className="rc__text">{frame.arg}</span>}
                {frame.argFocused && <span className="rc__caret rc__caret--small" />}
                {!frame.arg && <span className="rc__placeholder">Ticker</span>}
              </span>
            )}
          </div>
        )}
        {view === "activities" && (
          <span className="rc__filter" data-open={frame.dropdown !== null}>
            {frame.filter === "dividends" ? "Dividends" : "All"}
            <Icon.ChevronDown />
          </span>
        )}
      </div>

      {frame.dropdown !== null && (
        <div className="rc__dropdown">
          {FILTERS.map((f, i) => (
            <div key={f} className="rc__option" data-highlighted={i === frame.dropdown}>
              <span className="rc__check">{i === 0 && <Icon.Check />}</span>
              {f}
            </div>
          ))}
        </div>
      )}

      {/* Keyed by view, so each view mounts fresh and plays its entrance. */}
      <div className="rc__body" key={view}>
        {view === "root" && <Root results={results} searching={q !== ""} />}
        {view === "portfolio" && <Portfolio selected={frame.selected} privacy={frame.privacy} />}
        {view === "positions" && <Positions />}
        {view === "activities" && <Activities key={frame.filter} filter={frame.filter} />}
        {view === "fog" && <Fog />}
      </div>

      <Footer view={view} selected={frame.selected} />
    </div>
  );
}

function Section({ title, count }: { title: string; count?: string }) {
  return (
    <div className="rc__section">
      {title}
      {count && <span className="rc__count">{count}</span>}
    </div>
  );
}

function FolioIcon({ size }: { size: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="rc__app-icon" src={asset("/folio-icon-128.webp")} alt="" width={size} height={size} />;
}

function Root({ results, searching }: { results: readonly string[]; searching: boolean }) {
  return (
    <div className="rc__list">
      <Section title={searching ? "Results" : "Suggestions"} />
      {results.map((title, i) => (
        <div key={title} className="rc__row" data-selected={i === 0}>
          <FolioIcon size={21} />
          <span className="rc__title">{title}</span>
          <span className="rc__subtitle">Folio</span>
          <span className="rc__accessories rc__muted">Command</span>
        </div>
      ))}
    </div>
  );
}

function Portfolio({ selected, privacy }: { selected: number; privacy: boolean }) {
  const money = (s: string) => (privacy ? MASK : s);
  let n = 0;
  return (
    <div className="rc__list">
      {PORTFOLIO.map((section) => (
        <Fragment key={section.title}>
          <Section title={section.title} count={section.count} />
          {section.rows.map((row) => {
            const i = n++;
            return (
              <div key={row.title} className="rc__row rc__enter" data-selected={i === selected} style={nth(i)}>
                <span className="rc__icon">{row.icon === "coins" ? <Icon.Coins /> : <Icon.Wallet />}</span>
                <span className="rc__title">{row.titleIsMoney ? money(row.title) : row.title}</span>
                {row.subtitle && <span className="rc__subtitle">{row.subtitle}</span>}
                <span className="rc__accessories">
                  {row.tags.map((tag) => (
                    <span key={tag.text} className="rc__tag" data-tone={tag.tone}>
                      {money(tag.text)}
                    </span>
                  ))}
                  {row.total && <span className="rc__total">{money(row.total)}</span>}
                </span>
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function Positions() {
  return (
    <div className="rc__split">
      <div className="rc__list rc__list--pane">
        <Section title="Matches for NVDA" count="1" />
        <div className="rc__row" data-selected="true">
          <span className="rc__icon">
            <Icon.Chart />
          </span>
          <span className="rc__title">NVDA</span>
          <span className="rc__accessories rc__value">$20,688.00</span>
        </div>
      </div>
      <div className="rc__detail">
        {POSITION.map(([label, value, tone], i) => (
          <div key={label} className="rc__meta rc__enter" data-tone={tone} style={nth(i + 2)}>
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ACTIVITY_ICON: Record<ActivityRow["icon"], ReactElement> = {
  plus: <Icon.Plus />,
  coins: <Icon.Coins />,
  buy: <Icon.ArrowDownCircle />,
};

function Activities({ filter }: { filter: Filter }) {
  let n = 0;
  return (
    <div className="rc__list">
      {ACTIVITIES[filter].map((section) => (
        <Fragment key={section.title}>
          <Section title={section.title} count={section.count} />
          {section.rows.map((row) => {
            const i = n++;
            return (
              <div key={`${row.title}-${row.date}`} className="rc__row rc__enter" data-selected={i === 0} style={nth(i)}>
                <span className="rc__icon" data-kind={row.icon}>
                  {ACTIVITY_ICON[row.icon]}
                </span>
                <span className="rc__title">{row.title}</span>
                <span className="rc__subtitle">{row.subtitle}</span>
                <span className="rc__accessories">
                  <span className="rc__tag" data-tone="neutral">
                    {row.where}
                  </span>
                  {row.units && <span className="rc__muted">{row.units}</span>}
                  <span data-tone={row.amount.startsWith("+") ? "up" : undefined}>{row.amount}</span>
                  <span className="rc__date">{row.date}</span>
                </span>
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function Fog() {
  return (
    <div className="rc__split">
      <div className="rc__markdown">
        <p className="rc__h1 rc__enter">{FOG.headline}</p>
        <p className="rc__enter" style={nth(1)}>
          <b>{FOG.primary}</b> undeployed · {FOG.secondary}
        </p>
        <p className="rc__enter" style={nth(2)}>
          {FOG.note}
        </p>
        <p className="rc__h2 rc__enter" style={nth(3)}>
          Where it sits
        </p>
        <div className="rc__table rc__enter" style={nth(4)}>
          <div className="rc__tr rc__tr--head">
            <span>Account</span>
            <span>Cash</span>
          </div>
          {FOG.where.map(([account, cash]) => (
            <div key={account} className="rc__tr">
              <span>{account}</span>
              <span>{cash}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rc__sidebar">
        {FOG.meta.map(([label, value], i) => (
          <div key={label} className="rc__label rc__enter" style={nth(i + 2)}>
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer({ view, selected }: { view: View; selected: number }) {
  const primary = {
    root: "Open Command",
    portfolio: selected < 2 ? "Copy Net Worth" : "Show Holdings",
    positions: "Hide Details",
    activities: "Copy Activity",
    fog: "Copy Fog Summary",
  }[view];

  return (
    <div className="rc__footer">
      {view === "root" ? (
        <span />
      ) : (
        <span className="rc__pill rc__pill--command">
          <FolioIcon size={22} />
          {COMMAND_TITLE[view]}
        </span>
      )}
      <span className="rc__pill">
        <span className="rc__action">{primary}</span>
        <span className="rc__key">↵</span>
        <span className="rc__divider" />
        <span className="rc__muted">Actions</span>
        <span className="rc__key">⌘</span>
        <span className="rc__key">K</span>
      </span>
    </div>
  );
}
