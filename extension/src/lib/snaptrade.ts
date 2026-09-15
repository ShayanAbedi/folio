/** Typed SnapTrade endpoints used by Fathom. All GET except the Connection Portal link. */
import { snaptrade } from "./api";
import type {
  Account,
  AccountHoldings,
  AccountValueHistoryResponse,
  Activity,
  BrokerageAuthorization,
  LoginRedirectURI,
  PaginatedActivities,
} from "./types";

export function listAccounts(fresh = false): Promise<Account[]> {
  return snaptrade<Account[]>("/accounts", { fresh, ttlMs: 120_000 });
}

export function getAccountHoldings(accountId: string, fresh = false): Promise<AccountHoldings> {
  return snaptrade<AccountHoldings>(`/accounts/${encodeURIComponent(accountId)}/holdings`, { fresh, ttlMs: 90_000 });
}

export async function getBalanceHistory(accountId: string, fresh = false): Promise<AccountValueHistoryResponse | null> {
  try {
    return await snaptrade<AccountValueHistoryResponse>(`/accounts/${encodeURIComponent(accountId)}/balanceHistory`, {
      fresh,
      ttlMs: 120_000,
    });
  } catch {
    // Optional on some plans/brokerages. Missing history just means "no day change", never a fake one.
    return null;
  }
}

export async function getAccountActivities(
  accountId: string,
  startDate: string,
  endDate: string,
  fresh = false,
): Promise<Activity[]> {
  const out: Activity[] = [];
  const limit = 1000;
  let offset = 0;
  for (let page = 0; page < 20; page += 1) {
    const res = await snaptrade<PaginatedActivities>(`/accounts/${encodeURIComponent(accountId)}/activities`, {
      query: { startDate, endDate, offset, limit },
      fresh,
      ttlMs: 120_000,
    });
    const data = res.data ?? [];
    out.push(...data);
    const total = res.pagination?.total;
    offset += data.length;
    if (data.length < limit || (typeof total === "number" && offset >= total)) break;
  }
  return out;
}

export function listAuthorizations(fresh = false): Promise<BrokerageAuthorization[]> {
  return snaptrade<BrokerageAuthorization[]>("/authorizations", { fresh, ttlMs: 60_000 });
}

/** Read-only Connection Portal link. `reconnect` repairs a disabled connection. */
export function createConnectionPortalLink(opts?: { reconnect?: string; broker?: string }): Promise<LoginRedirectURI> {
  return snaptrade<LoginRedirectURI>("/snapTrade/login", {
    method: "POST",
    body: {
      connectionType: "read",
      connectionPortalVersion: "v4",
      immediateRedirect: false,
      ...(opts?.reconnect ? { reconnect: opts.reconnect } : {}),
      ...(opts?.broker ? { broker: opts.broker } : {}),
    },
  });
}
