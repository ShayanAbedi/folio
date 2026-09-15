/**
 * Renders Store screenshots (2000x1250) from the bundled fixtures with privacy-safe sample balances.
 * These are placeholders that mirror the Raycast layout; replace with real Raycast "Window Capture"
 * shots before submitting to the Store. Usage: node scripts/screenshots.mjs
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const tmp = join(process.cwd(), ".test-build", "shots");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

await build({
  stdin: {
    contents: `
      export * from "./src/lib/portfolio";
      export * from "./src/lib/format";
      export * from "./src/fixtures/index";
    `,
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: join(tmp, "lib.mjs"),
  logLevel: "error",
});
const lib = await import(pathToFileURL(join(tmp, "lib.mjs")).href);
const { FIXTURE_HOLDINGS, FIXTURE_ACTIVITIES, netWorth, flattenPositions, computeFog, quietStreak, groupByInstitution, formatMoney, formatMoneyWithCode, formatSigned, formatPercent, formatUnits, fogIdleLabel } = lib;

const snapshots = FIXTURE_HOLDINGS.map((h) => ({ account: h.account, holdings: h }));
const now = new Date();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const css = `
  html,body{margin:0;width:2000px;height:1250px;overflow:hidden;font-family:-apple-system,"SF Pro Text",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  body{background:radial-gradient(1200px 800px at 30% 20%,#2a3350 0%,#141724 55%,#0b0d14 100%)}
  .win{position:absolute;left:250px;top:160px;width:1500px;height:930px;background:#1c1d22;border-radius:26px;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08);color:#f2f2f4;display:flex;flex-direction:column;overflow:hidden}
  .search{height:96px;display:flex;align-items:center;padding:0 40px;border-bottom:1px solid rgba(255,255,255,.08);font-size:30px;color:#8a8d98}
  .search .ph{flex:1}
  .search .dd{background:rgba(255,255,255,.06);padding:8px 20px;border-radius:12px;font-size:24px;color:#d4d6de}
  .body{flex:1;display:flex;min-height:0}
  .list{flex:1;padding:16px 20px;overflow:hidden}
  .sec{margin:22px 20px 10px;font-size:22px;color:#8a8d98;text-transform:uppercase;letter-spacing:.02em}
  .row{display:flex;align-items:center;height:64px;padding:0 20px;border-radius:14px;font-size:28px;gap:20px}
  .row.sel{background:rgba(255,255,255,.09)}
  .ic{width:34px;height:34px;border-radius:9px;display:inline-block;flex:none}
  .t{white-space:nowrap}
  .st{color:#8a8d98;font-size:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sp{flex:1}
  .acc{color:#b9bcc6;font-size:24px;white-space:nowrap}
  .tag{padding:4px 14px;border-radius:10px;font-size:22px;background:rgba(255,255,255,.08);color:#d4d6de}
  .g{color:#4cd964}.r{color:#ff5b5b}.gt{background:rgba(76,217,100,.16);color:#4cd964}.rt{background:rgba(255,91,91,.16);color:#ff5b5b}
  .detail{width:560px;border-left:1px solid rgba(255,255,255,.08);padding:30px 34px;font-size:24px;overflow:hidden}
  .detail h1{font-size:44px;margin:0 0 6px}
  .detail .sub{color:#8a8d98;margin-bottom:24px;font-size:24px}
  .kv{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .kv span:first-child{color:#8a8d98}
  .foot{height:76px;display:flex;align-items:center;padding:0 30px;border-top:1px solid rgba(255,255,255,.08);font-size:24px;color:#b9bcc6;gap:18px}
  .foot .logo{width:30px;height:30px;border-radius:8px;background:#6B8CFF}
  .foot .k{margin-left:auto;display:flex;gap:26px}
  .kbd{background:rgba(255,255,255,.08);padding:4px 12px;border-radius:8px;color:#d4d6de;font-size:22px}
  .md{padding:44px 60px;font-size:28px;line-height:1.5;flex:1}
  .md h1{font-size:88px;margin:0 0 10px;letter-spacing:-.02em}
  .md h2{font-size:34px;margin:36px 0 10px;color:#d4d6de}
  .md p{margin:0 0 12px;color:#c5c8d2}
  .md table{border-collapse:collapse;font-size:26px}
  .md td,.md th{padding:10px 40px 10px 0;text-align:left;border-bottom:1px solid rgba(255,255,255,.08)}
  .md td:last-child{text-align:right}
  .meta{width:520px;border-left:1px solid rgba(255,255,255,.08);padding:40px 36px;font-size:25px}
  .meta .kv{padding:14px 0}
  .caption{position:absolute;left:250px;top:74px;font-size:34px;color:#c9ccd6;letter-spacing:.01em}
  .caption b{color:#fff}
`;

function frame({ title, search, dropdown, body, detail, foot, caption }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
  <div class="caption"><b>${esc(caption)}</b></div>
  <div class="win">
    <div class="search"><div class="ph">${esc(search)}</div>${dropdown ? `<div class="dd">${esc(dropdown)} ▾</div>` : ""}</div>
    <div class="body"><div class="list">${body}</div>${detail ? `<div class="detail">${detail}</div>` : ""}</div>
    <div class="foot"><div class="logo"></div>${esc(title)}<div class="k">${foot.map((f) => `<span>${esc(f)} <span class="kbd">${esc(f === "Actions" ? "⌘K" : f === "Hide Balances" ? "⌘⇧P" : f === "Refresh" ? "⌘R" : "↩")}</span></span>`).join("")}</div></div>
  </div></body></html>`;
}

// ---- 1. Show Portfolio ----
const nw = netWorth(snapshots.map((s) => s.account));
const fixedChange = { CAD: 570.75, USD: 1204.33 };
let body = `<div class="sec">Net Worth</div>`;
nw.byCurrency.forEach((t, i) => {
  const c = fixedChange[t.currency];
  body += `<div class="row${i === 0 ? " sel" : ""}"><span class="ic" style="background:${i === 0 ? "#6B8CFF" : "#3a3d47"}"></span><span class="t">${esc(formatMoneyWithCode(t.amount, t.currency))}</span>${i === 0 ? `<span class="st">${nw.accountCount} accounts</span>` : ""}<span class="sp"></span>${c ? `<span class="tag ${c >= 0 ? "gt" : "rt"}">${esc(formatSigned(c, t.currency))}</span>` : ""}</div>`;
});
for (const g of groupByInstitution(snapshots)) {
  body += `<div class="sec">${esc(g.institution)} · ${g.items.length} account${g.items.length === 1 ? "" : "s"}</div>`;
  for (const s of g.items) {
    const total = s.account.balance.total;
    const cash = (s.holdings.balances ?? []).map((b) => formatMoney(b.cash, b.currency?.code)).join(" · ");
    const n = (s.holdings.positions ?? []).length + (s.holdings.option_positions ?? []).length;
    body += `<div class="row"><span class="ic" style="background:#6B8CFF"></span><span class="t">${esc(s.account.name)}</span><span class="st">${esc(s.account.raw_type)} · ${esc(s.account.number)} · ${n} positions</span><span class="sp"></span><span class="tag">${esc(cash)}</span><span class="acc">${esc(formatMoneyWithCode(total.amount, total.currency))}</span></div>`;
  }
}
const shot1 = frame({ title: "Show Portfolio", search: "Search accounts…", body, foot: ["Show Holdings", "Actions"], caption: "Net worth and every account, grouped by institution" });

// ---- 2. Show Positions (with detail) ----
const positions = flattenPositions(snapshots);
const sel = positions.find((p) => p.rawTicker === "NVDA") ?? positions[0];
body = `<div class="sec">Positions · ${positions.length}</div>`;
for (const p of positions.slice(0, 11)) {
  body += `<div class="row${p === sel ? " sel" : ""}"><span class="ic" style="background:${p.isOption ? "#c58cff" : "#6B8CFF"}"></span><span class="t">${esc(p.ticker)}</span><span class="st">${esc(p.description)}</span><span class="sp"></span><span class="acc">${esc(formatMoney(p.marketValue, p.currency))}</span></div>`;
}
const detail = `<h1>${esc(sel.ticker)}</h1><div class="sub">${esc(sel.description)}</div>
  <div class="kv"><span>Account</span><span>${esc(sel.institution)} · ${esc(sel.accountName)}</span></div>
  <div class="kv"><span>Market Value</span><span>${esc(formatMoneyWithCode(sel.marketValue, sel.currency))}</span></div>
  <div class="kv"><span>Units</span><span>${esc(formatUnits(sel.units))}</span></div>
  <div class="kv"><span>Price</span><span>${esc(formatMoney(sel.price, sel.currency))}</span></div>
  <div class="kv"><span>Average Cost</span><span>${esc(formatMoney(sel.averageCost, sel.currency))}</span></div>
  <div class="kv"><span>Open P&amp;L</span><span class="${sel.openPnl >= 0 ? "g" : "r"}">${esc(formatSigned(sel.openPnl, sel.currency))} (${esc(formatPercent(sel.openPnlRatio))})</span></div>
  <div class="kv"><span>Weight</span><span>${esc(formatPercent(sel.weight))} of ${esc(sel.currency)} positions</span></div>
  <div class="kv"><span>Type</span><span>${esc(sel.securityType ?? "")}</span></div>
  <div class="kv"><span>Exchange</span><span>${esc(sel.exchange ?? "")}</span></div>`;
const shot2 = frame({ title: "Show Positions", search: "Search ticker, name or account…", body, detail, foot: ["Hide Details", "Actions"], caption: "Every position across brokerages, searchable, with weight and open P&L" });

// ---- 3. Show Fog ----
const fog = computeFog(snapshots, FIXTURE_ACTIVITIES, now, 365);
const streak = quietStreak(FIXTURE_ACTIVITIES, now, 365);
const idle = fogIdleLabel(fog);
const amount = formatMoneyWithCode(fog.primary.amount, fog.primary.currency);
const rows = fog.cash.flatMap((c) => c.accounts.map((a) => `<tr><td>${esc(a.institution)} · ${esc(a.accountName)}</td><td>${esc(formatMoney(a.amount, c.currency))} ${c.currency}</td></tr>`)).join("");
const other = fog.cash.slice(1).map((c) => formatMoneyWithCode(c.amount, c.currency)).join(", ");
const md = `<h1>${idle} days idle</h1>
  <p><b style="color:#fff">${esc(amount)}</b> undeployed${other ? ` · plus ${esc(other)}` : ""}</p>
  <p>Counted from your most recent deposit. Cash can't have been idle longer than that, so this understates rather than guesses.</p>
  <h2>Where it sits</h2><table><tr><th>Account</th><th style="text-align:right">Cash</th></tr>${rows}</table>
  <h2>Quiet streak</h2><p>${streak.days} days since your last trade.</p>`;
const meta = `<div class="kv"><span>Idle</span><span>${idle} days</span></div><div class="kv"><span>Undeployed</span><span>${esc(amount)}</span></div>${fog.cash.slice(1).map((c) => `<div class="kv"><span>Also in ${c.currency}</span><span>${esc(formatMoneyWithCode(c.amount, c.currency))}</span></div>`).join("")}<div class="kv"><span>Last buy</span><span>12 days ago</span></div><div class="kv"><span>Last deposit</span><span>4 days ago</span></div><div class="kv"><span>Quiet streak</span><span>${streak.days} days</span></div><div class="kv"><span>Window</span><span>365 days of activity</span></div>`;
const shot3 = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>
  <div class="caption"><b>Fog: how much cash is idle, and for how long</b></div>
  <div class="win"><div class="search"><div class="ph" style="color:#f2f2f4">Show Fog</div></div>
  <div class="body"><div class="md">${md}</div><div class="meta">${meta}</div></div>
  <div class="foot"><div class="logo"></div>Show Fog<div class="k"><span>Copy Fog Summary <span class="kbd">↩</span></span><span>Hide Balances <span class="kbd">⌘⇧P</span></span><span>Actions <span class="kbd">⌘K</span></span></div></div></div></body></html>`;

const shots = [
  ["fathom-1.png", shot1],
  ["fathom-2.png", shot2],
  ["fathom-3.png", shot3],
];
mkdirSync("metadata", { recursive: true });
for (const [name, html] of shots) {
  const file = join(tmp, name.replace(".png", ".html"));
  writeFileSync(file, html);
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=2000,1250", `--screenshot=${join("metadata", name)}`, pathToFileURL(file).href], { stdio: "ignore" });
  console.log("wrote metadata/" + name);
}
