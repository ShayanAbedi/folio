import type { ReactNode } from "react";

/** Stroke icons drawn to stand in for Raycast's own at 21px. */
function Svg({ children, size = 21, width = 1.9 }: { children: ReactNode; size?: number; width?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const Coins = () => (
  <Svg>
    <ellipse cx="9" cy="15" rx="6" ry="2.8" />
    <path d="M3 15v2.6c0 1.6 2.7 2.9 6 2.9s6-1.3 6-2.9V15" />
    <ellipse cx="15" cy="7.5" rx="6" ry="2.8" />
    <path d="M21 7.5v2.8c0 1.3-1.8 2.4-4.3 2.8" />
  </Svg>
);

export const Wallet = () => (
  <Svg>
    <path d="M16.5 7V5.8A1.8 1.8 0 0 0 14.3 4L5.2 6.1A2.6 2.6 0 0 0 3 8.6" />
    <rect x="3" y="7" width="18" height="13" rx="3" />
    <circle cx="16.5" cy="13.5" r="1.2" fill="currentColor" />
  </Svg>
);

export const Chart = () => (
  <Svg>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
    <path d="M7.5 15.5l3.2-3.6 2.6 2.2 3.7-4.6" />
  </Svg>
);

export const Plus = () => (
  <Svg width={2.1}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const ArrowDownCircle = () => (
  <Svg>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8v8M8.5 12.5L12 16l3.5-3.5" />
  </Svg>
);

export const Back = () => (
  <Svg size={20} width={2}>
    <path d="M14.5 5.5L8 12l6.5 6.5" />
  </Svg>
);

export const ChevronDown = () => (
  <Svg size={14} width={2.2}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);

export const Check = () => (
  <Svg size={14} width={2.4}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);

export const Pause = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

export const Play = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13l10.5-6.5z" />
  </svg>
);

/* Menu bar and menu glyphs, at 16px. */

export const CoinsSmall = () => (
  <Svg size={16} width={2}>
    <ellipse cx="9" cy="15" rx="6" ry="2.8" />
    <path d="M3 15v2.6c0 1.6 2.7 2.9 6 2.9s6-1.3 6-2.9V15" />
    <ellipse cx="15" cy="7.5" rx="6" ry="2.8" />
    <path d="M21 7.5v2.8c0 1.3-1.8 2.4-4.3 2.8" />
  </Svg>
);

export const ArrowUpCircleFilled = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path d="M12 17V8M8 11.5l4-4 4 4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Cloud = () => (
  <Svg size={16} width={2}>
    <path d="M7 18.5h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 11.1 3.7 3.7 0 0 0 7 18.5z" />
  </Svg>
);

export const PieChart = () => (
  <Svg size={16} width={2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v9h9" />
  </Svg>
);

export const List = () => (
  <Svg size={16} width={2}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M8 9h8M8 12h8M8 15h8" />
  </Svg>
);

export const Receipt = () => (
  <Svg size={16} width={2}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6M9 12h6" />
  </Svg>
);

export const EyeOff = () => (
  <Svg size={16} width={2}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 9 5 9 7 0 .9-.8 2.4-2.2 3.8M6.3 6.3C4.1 7.8 3 10.3 3 12c0 2 4 7 9 7 1.6 0 3.1-.5 4.4-1.2" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const Refresh = () => (
  <Svg size={16} width={2}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v5h-5" />
  </Svg>
);

export const Gear = () => (
  <Svg size={16} width={2}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
  </Svg>
);

export const Battery = () => (
  <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
    <rect x="0.75" y="0.75" width="21.5" height="12.5" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
    <rect x="3" y="3" width="15" height="8" rx="1.8" fill="currentColor" />
    <path d="M24.2 5v4" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const Wifi = () => (
  <Svg size={17} width={2.2}>
    <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.6a9.5 9.5 0 0 1 13 0M8.6 16.1a5 5 0 0 1 6.8 0" />
    <circle cx="12" cy="19.2" r="1.1" fill="currentColor" />
  </Svg>
);

export const Toggles = () => (
  <Svg size={16} width={2}>
    <rect x="3" y="4.5" width="18" height="6.5" rx="3.25" />
    <circle cx="16.5" cy="7.75" r="1.6" fill="currentColor" />
    <rect x="3" y="13" width="18" height="6.5" rx="3.25" />
    <circle cx="7.5" cy="16.25" r="1.6" fill="currentColor" />
  </Svg>
);

/** The macOS arrow pointer. Its hotspot is the tip, at (2, 1.5). */
export const Pointer = () => (
  <svg width="20" height="24" viewBox="0 0 20 24" aria-hidden="true">
    <path
      d="M2 1.5v18.2l4.6-4.4 3 6.9 3.1-1.3-3-6.8h6.4z"
      fill="#000"
      stroke="#fff"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);
