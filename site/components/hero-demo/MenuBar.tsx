import type { CSSProperties, ReactElement } from "react";

import { MASK, MENU, MENU_BAR_CLOCK, MENU_BAR_TITLE, type MenuIcon } from "./data";
import * as Icon from "./icons";
import type { CursorFrame, MenuBarFrame } from "./timeline";

const MENU_ICON: Record<MenuIcon, ReactElement> = {
  up: <Icon.ArrowUpCircleFilled />,
  cloud: <Icon.Cloud />,
  pie: <Icon.PieChart />,
  list: <Icon.List />,
  receipt: <Icon.Receipt />,
  "eye-off": <Icon.EyeOff />,
  refresh: <Icon.Refresh />,
  gear: <Icon.Gear />,
};

/** Menu Bar Portfolio in the macOS menu bar, in stage px along the top of the desktop. */
export function MenuBar({ state }: { state: MenuBarFrame }) {
  return (
    <div className="mb" data-shown={state.shown}>
      <div className="mb__extras">
        <span className="mb__item" data-open={state.open}>
          <Icon.CoinsSmall />
          {state.masked ? MASK : MENU_BAR_TITLE}
          {state.open && <Menu hovered={state.hovered} />}
        </span>
        <span className="mb__glyph">
          <Icon.Battery />
        </span>
        <span className="mb__glyph">
          <Icon.Wifi />
        </span>
        <span className="mb__glyph">
          <Icon.Toggles />
        </span>
        <span className="mb__clock">{MENU_BAR_CLOCK}</span>
      </div>
    </div>
  );
}

function Menu({ hovered }: { hovered: string | null }) {
  let n = 0;
  return (
    <div className="mb__menu">
      {MENU.map((entry, i) => {
        if (entry.kind === "separator") return <div key={i} className="mb__separator" />;
        if (entry.kind === "header")
          return (
            <div key={i} className="mb__header">
              {entry.text}
            </div>
          );
        const style = { "--i": n++ } as CSSProperties;
        return (
          <div key={entry.id} className="mb__entry" data-hovered={entry.id === hovered} style={style}>
            {entry.icon && (
              <span className="mb__icon" data-icon={entry.icon}>
                {MENU_ICON[entry.icon]}
              </span>
            )}
            <span>{entry.title}</span>
            {entry.subtitle && <span className="mb__subtitle">{entry.subtitle}</span>}
            {entry.shortcut && <span className="mb__shortcut">{entry.shortcut}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function Cursor({ state }: { state: CursorFrame }) {
  const style = { "--x": `${state.x}px`, "--y": `${state.y}px` } as CSSProperties;
  return (
    <span className="demo__pointer" data-visible={state.visible} data-pressed={state.pressed} style={style}>
      <Icon.Pointer />
    </span>
  );
}
