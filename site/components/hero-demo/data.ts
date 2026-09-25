/**
 * What the hero demo shows. It is the extension's bundled demo data
 * (extension/src/fixtures), as it renders on the day the Store screenshots were
 * taken, so the demo and the screenshots agree to the cent. If the fixtures change,
 * change this with them.
 */

/** extension/src/lib/format.ts */
export const MASK = "••••••";

/** Folio's commands, in the order Raycast lists them. */
export const COMMANDS = [
  "Show Portfolio",
  "Show Positions",
  "Show Activities",
  "Show Fog",
  "Menu Bar Portfolio",
  "Connect Brokerage",
] as const;

export type Tone = "neutral" | "up" | "down";

export type AccountRow = {
  icon: "coins" | "wallet";
  title: string;
  /** Net worth rows carry the amount in the title, so privacy mode masks it there. */
  titleIsMoney?: boolean;
  subtitle?: string;
  tags: { text: string; tone: Tone }[];
  total?: string;
};

export const PORTFOLIO: { title: string; count?: string; rows: AccountRow[] }[] = [
  {
    title: "Net Worth",
    rows: [
      {
        icon: "coins",
        title: "$167,648.17 CAD",
        titleIsMoney: true,
        subtitle: "4 accounts",
        tags: [{ text: "+$570.75", tone: "up" }],
      },
      { icon: "coins", title: "$94,118.77 USD", titleIsMoney: true, tags: [{ text: "+$1,204.33", tone: "up" }] },
    ],
  },
  {
    title: "Wealthsimple",
    count: "2 accounts",
    rows: [
      {
        icon: "wallet",
        title: "TFSA",
        subtitle: "TFSA · ****4821 · 3 positions",
        tags: [
          { text: "$3,214.15", tone: "neutral" },
          { text: "+$412.90", tone: "up" },
        ],
        total: "$68,432.15 CAD",
      },
      {
        icon: "wallet",
        title: "RRSP",
        subtitle: "RRSP · ****7710 · 2 positions",
        tags: [
          { text: "$12,480.60", tone: "neutral" },
          { text: "−$138.25", tone: "down" },
        ],
        total: "$41,905.60 CAD",
      },
    ],
  },
  {
    title: "Questrade",
    count: "1 account",
    rows: [
      {
        icon: "wallet",
        title: "Margin",
        subtitle: "Margin · ****2093 · 6 positions",
        tags: [
          { text: "$1,842.30 · $6,120.00", tone: "neutral" },
          { text: "+$296.10", tone: "up" },
        ],
        total: "$57,310.42 CAD",
      },
    ],
  },
  {
    title: "Interactive Brokers",
    count: "1 account",
    rows: [
      {
        icon: "wallet",
        title: "Individual",
        subtitle: "INDIVIDUAL · U***1937 · 4 positions",
        tags: [
          { text: "$18,902.27", tone: "neutral" },
          { text: "+$1,204.33", tone: "up" },
        ],
        total: "$94,118.77 USD",
      },
    ],
  },
];

/** The NVDA detail panel, top to bottom. */
export const POSITION: [label: string, value: string, tone?: Tone][] = [
  ["Ticker", "NVDA"],
  ["Name", "NVIDIA Corporation"],
  ["Account", "Interactive Brokers · Individual"],
  ["Market Value", "$20,688.00 USD"],
  ["Units", "120"],
  ["Price", "$172.40"],
  ["Average Cost", "$91.60"],
  ["Open P&L", "+$9,696.00 (+88.2%)", "up"],
  ["Weight", "19.7% of USD positions"],
  ["Type", "Common Stock"],
  ["Exchange", "NASDAQ"],
  ["Currency", "USD"],
];

export type ActivityRow = {
  icon: "plus" | "coins" | "buy";
  title: string;
  subtitle: string;
  where: string;
  units?: string;
  amount: string;
  date: string;
};

type ActivitySection = { title: string; count: string; rows: ActivityRow[] };

const dividend = (symbol: string, where: string, amount: string, date: string): ActivityRow => ({
  icon: "coins",
  title: `Dividend ${symbol}`,
  subtitle: `Dividend ${symbol}`,
  where,
  amount,
  date,
});

const interest = (where: string, amount: string, date: string): ActivityRow => ({
  icon: "coins",
  title: "Interest",
  subtitle: "Interest on cash balance",
  where,
  amount,
  date,
});

/** Counts are the whole month; the window only has room for the start of August. */
export const ACTIVITIES: Record<"all" | "dividends", ActivitySection[]> = {
  all: [
    {
      title: "September 2026",
      count: "5",
      rows: [
        {
          icon: "plus",
          title: "Contribution",
          subtitle: "Electronic funds transfer in",
          where: "Wealthsimple · TFSA",
          amount: "+$2,000.00",
          date: "Sep 12",
        },
        dividend("MSFT", "Questrade · Margin", "+$21.60", "Sep 10"),
        dividend("ENB.TO", "Wealthsimple · RRSP", "+$118.30", "Sep 7"),
        {
          icon: "buy",
          title: "Buy XEQT.TO",
          subtitle: "Bought 100 XEQT.TO @ 33.12",
          where: "Wealthsimple · TFSA",
          units: "100 @ $33.12",
          amount: "−$3,312.00",
          date: "Sep 4",
        },
        dividend("SCHD", "Interactive Brokers · Individual", "+$74.10", "Sep 1"),
      ],
    },
    {
      title: "August 2026",
      count: "8",
      rows: [
        {
          icon: "buy",
          title: "Buy VTI",
          subtitle: "Bought 30 VTI @ 289.7",
          where: "Questrade · Margin",
          units: "30 @ $289.70",
          amount: "−$8,691.00",
          date: "Aug 28",
        },
        dividend("CNQ.TO", "Questrade · Margin", "+$46.20", "Aug 25"),
        {
          icon: "plus",
          title: "Contribution",
          subtitle: "Electronic funds transfer in",
          where: "Interactive Brokers · Individual",
          amount: "+$15,000.00",
          date: "Aug 20",
        },
      ],
    },
  ],
  // The Dividends filter counts interest too (DIVIDEND_TYPES in extension/src/lib/portfolio.ts).
  dividends: [
    {
      title: "September 2026",
      count: "3",
      rows: [
        dividend("MSFT", "Questrade · Margin", "+$21.60", "Sep 10"),
        dividend("ENB.TO", "Wealthsimple · RRSP", "+$118.30", "Sep 7"),
        dividend("SCHD", "Interactive Brokers · Individual", "+$74.10", "Sep 1"),
      ],
    },
    {
      title: "August 2026",
      count: "5",
      rows: [
        dividend("CNQ.TO", "Questrade · Margin", "+$46.20", "Aug 25"),
        interest("Wealthsimple · RRSP", "+$9.84", "Aug 17"),
        interest("Questrade · Margin", "+$12.40", "Aug 16"),
        interest("Interactive Brokers · Individual", "+$58.90", "Aug 14"),
        dividend("VFV.TO", "Wealthsimple · TFSA", "+$61.40", "Aug 6"),
      ],
    },
  ],
};

export const FILTERS = ["All", "Trades", "Dividends", "Deposits"] as const;

export const FOG = {
  headline: "4 days idle",
  primary: "$25,022.27 USD",
  secondary: "plus $17,537.05 CAD",
  note: "Counted from your most recent deposit on Sep 12, 2026. Cash can't have been idle longer than that, so this understates rather than guesses.",
  where: [
    ["Questrade · Margin", "$6,120.00 USD"],
    ["Interactive Brokers · Individual", "$18,902.27 USD"],
    ["Wealthsimple · TFSA", "$3,214.15 CAD"],
    ["Wealthsimple · RRSP", "$12,480.60 CAD"],
  ],
  meta: [
    ["Idle", "4 days"],
    ["Undeployed", "$25,022.27 USD"],
    ["Also in CAD", "$17,537.05 CAD"],
    ["Last buy", "12 days ago"],
    ["Last deposit", "4 days ago"],
    ["Quiet streak", "12 days"],
    ["Window", "365 days of activity"],
  ],
} as const;
