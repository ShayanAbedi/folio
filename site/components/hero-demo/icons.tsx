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
