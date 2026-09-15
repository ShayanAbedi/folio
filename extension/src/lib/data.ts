/**
 * Data source switch: bundled fixtures (demo) or live SnapTrade via Bearer token.
 * Every loader returns the same shapes so the UI never knows which one it got.
 */
import {
  FIXTURE_ACCOUNTS,
  FIXTURE_AUTHORIZATIONS,
  fixtureActivities,
  fixtureBalanceHistory,
  fixtureHoldings,
} from "../fixtures";
import { authMode } from "./preferences";
import {
  createConnectionPortalLink,
  getAccountActivities,
  getAccountBalances,
  getAccountPositions,
  getBalanceHistory,
  listAccounts,
  listAuthorizations,
} from "./snaptrade";
import { isInvestmentAccount } from "./portfolio";
import type {
  Account,
  AccountHoldings,
  AccountPosition,
  AccountSnapshot,
  AccountValueHistoryResponse,
  Activity,
  Balance,
  BrokerageAuthorization,
  OptionsPosition,
  PortfolioSnapshot,
  Position,
} from "./types";

export const ACTIVITY_WINDOW_DAYS = 365;

function dayChangeFrom(history: AccountValueHistoryResponse | null, currency: string | undefined) {
  const points = (history?.history ?? [])
    .filter((h) => h.date && h.total_value !== undefined && !Number.isNaN(Number(h.total_value)))
    .sort((a, b) => (a.date! < b.date! ? -1 : 1));
  if (points.length < 2 || !currency) return undefined;
  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return { amount: Number(last.total_value) - Number(prev.total_value), currency, asOf: last.date! };
}

function num(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

const KIND_LABEL: Record<string, string> = {
  stock: "Common Stock",
  etf: "ETF",
  adr: "ADR",
  cef: "Closed End Fund",
  crypto: "Cryptocurrency",
  mutualfund: "Mutual Fund",
  future: "Future",
  cfd: "CFD",
  bond: "Bond",
  option: "Option",
};

/** Maps one entry of /positions/all onto the Position / OptionsPosition shapes the rest of Fathom consumes. */
export function adaptPosition(p: AccountPosition, account: Account): { position?: Position; option?: OptionsPosition } {
  const i = p.instrument;
  const units = num(p.units) ?? 0;
  const price = num(p.price);
  const cost = num(p.cost_basis);
  const currency = (p.currency ?? i.currency ?? account.balance.total?.currency ?? "USD").toUpperCase();
  if (i.kind === "option") {
    const multiplier = num(i.multiplier) ?? 100;
    const underlying = i.underlying?.symbol ?? i.raw_symbol ?? i.symbol;
    return {
      option: {
        symbol: {
          id: i.id,
          description:
            i.description ??
            `${underlying} ${i.strike_price ?? ""} ${i.option_type ?? ""} ${i.expiration_date ?? ""}`.trim(),
          option_symbol: {
            id: i.id,
            ticker: i.symbol,
            option_type: i.option_type ?? "CALL",
            strike_price: num(i.strike_price) ?? 0,
            expiration_date: i.expiration_date ?? "",
            underlying_symbol: {
              id: `underlying-${i.id}`,
              symbol: underlying,
              raw_symbol: i.underlying?.raw_symbol ?? underlying,
              description: i.underlying?.description ?? undefined,
              currency: { code: currency },
            },
          },
        },
        price,
        units,
        // cost_basis is per share; the UI treats average_purchase_price as per contract.
        average_purchase_price: cost !== null ? cost * multiplier : null,
        currency: { code: currency },
        multiplier,
      },
    };
  }
  return {
    position: {
      symbol: {
        id: i.id,
        description: i.description ?? "",
        symbol: {
          id: i.id,
          symbol: i.symbol,
          raw_symbol: i.raw_symbol ?? i.symbol,
          description: i.description ?? undefined,
          currency: { code: currency },
          exchange: i.exchange ? { code: i.exchange } : undefined,
          type: { code: i.kind, description: KIND_LABEL[i.kind] ?? i.kind },
        },
      },
      units,
      price,
      average_purchase_price: cost,
      open_pnl: price !== null && cost !== null ? (price - cost) * units : null,
      currency: { code: currency },
      cash_equivalent: Boolean(p.cash_equivalent),
    },
  };
}

export function buildHoldings(account: Account, balances: Balance[], positions: AccountPosition[]): AccountHoldings {
  const out: AccountHoldings = { account, balances, positions: [], option_positions: [] };
  for (const p of positions) {
    const { position, option } = adaptPosition(p, account);
    if (position) out.positions!.push(position);
    if (option) out.option_positions!.push(option);
  }
  return out;
}

async function snapshotFor(
  account: Account,
  fresh: boolean,
  mode: ReturnType<typeof authMode>,
): Promise<AccountSnapshot> {
  if (mode === "fixtures") {
    return {
      account,
      holdings: fixtureHoldings(account.id),
      dayChange: dayChangeFrom(fixtureBalanceHistory(account.id), account.balance.total?.currency),
    };
  }
  const [balances, positions, history] = await Promise.all([
    getAccountBalances(account.id, fresh),
    getAccountPositions(account.id, fresh),
    getBalanceHistory(account.id, fresh),
  ]);
  const holdings = buildHoldings(account, Array.isArray(balances) ? balances : [], positions.results ?? []);
  return { account, holdings, dayChange: dayChangeFrom(history, account.balance.total?.currency) };
}

export async function loadPortfolio(fresh = false): Promise<PortfolioSnapshot> {
  const mode = authMode();
  const accounts = (mode === "fixtures" ? FIXTURE_ACCOUNTS : await listAccounts(fresh)).filter(isInvestmentAccount);
  const snapshots = await Promise.all(accounts.map((a) => snapshotFor(a, fresh, mode)));
  return { accounts: snapshots, fetchedAt: new Date().toISOString() };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Activities across all accounts for the last `days` days, newest first, each tagged with its account. */
export async function loadActivities(days = ACTIVITY_WINDOW_DAYS, fresh = false): Promise<Activity[]> {
  const mode = authMode();
  const accounts = (mode === "fixtures" ? FIXTURE_ACCOUNTS : await listAccounts(fresh)).filter(isInvestmentAccount);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const perAccount = await Promise.all(
    accounts.map(async (account) => {
      const list =
        mode === "fixtures"
          ? fixtureActivities(account.id, days)
          : await getAccountActivities(account.id, isoDate(start), isoDate(end), fresh);
      return list.map((a) => ({
        ...a,
        institution: a.institution ?? account.institution_name,
        account: a.account ?? { id: account.id, name: account.name, number: account.number },
      }));
    }),
  );
  return perAccount.flat();
}

export async function loadConnections(fresh = false): Promise<BrokerageAuthorization[]> {
  if (authMode() === "fixtures") return FIXTURE_AUTHORIZATIONS;
  return listAuthorizations(fresh);
}

export async function connectionPortalUrl(opts?: { reconnect?: string }): Promise<string> {
  if (authMode() === "fixtures") {
    throw new Error("Demo mode: turn off fixtures in preferences to open the real Connection Portal.");
  }
  const res = await createConnectionPortalLink(opts);
  if (!res.redirectURI) throw new Error("SnapTrade did not return a Connection Portal link.");
  return res.redirectURI;
}
