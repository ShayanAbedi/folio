import { MENU_ITEM_BOUNDS } from "./data";

/**
 * The hero demo's script: a chapter per command. Each Raycast chapter summons
 * Raycast, types the command into the root search, opens it, and then lets the
 * camera push in on the part worth reading; the last one clicks through the menu
 * bar item instead.
 *
 * A frame is a pure function of the loop clock, so any moment can be drawn on its
 * own and seeking to a chapter is only a matter of setting the clock.
 */

export const CHAPTERS = ["Portfolio", "Positions", "Activities", "Fog", "Menu bar"] as const;
export const CHAPTER_MS = 6500;
export const LOOP_MS = CHAPTER_MS * CHAPTERS.length;

export type View = "root" | "portfolio" | "positions" | "activities" | "fog";
export type Filter = "all" | "dividends";
export type Keystroke = { keys: readonly string[]; label?: string };

/** A push-in: transform origin as a percentage of the stage, and how far in. */
export type Camera = { x: number; y: number; scale: number };

export type MenuBarFrame = {
  /** Whether the menu bar has slid in. */
  shown: boolean;
  open: boolean;
  /** The menu item under the cursor, by id. */
  hovered: string | null;
  masked: boolean;
};

/** The pointer, in stage px. */
export type CursorFrame = { x: number; y: number; visible: boolean; pressed: boolean };

export type Frame = {
  chapter: number;
  /** 0 to 1 through the current chapter, for the progress bar. */
  progress: number;
  /** Whether the Raycast window is on screen. */
  open: boolean;
  view: View;
  query: string;
  /** Text in the Ticker argument field Raycast shows beside the query for Show Positions. */
  arg: string;
  argFocused: boolean;
  selected: number;
  privacy: boolean;
  filter: Filter;
  /** Highlighted option of the filter dropdown, or null while it is closed. */
  dropdown: number | null;
  camera: Camera | null;
  /** The latest keystroke. It stays set while the overlay fades out, so the caps don't blank mid-fade. */
  key: Keystroke | null;
  keyVisible: boolean;
  /** The first beat after a press, when the overlay dips like a key going down. */
  keyFresh: boolean;
  menuBar: MenuBarFrame | null;
  cursor: CursorFrame | null;
};

type Timed = Keystroke & { at: number };

type Scene = Partial<Omit<Frame, "chapter" | "progress" | "open" | "key" | "keyVisible" | "keyFresh">> & {
  view: View;
  keys: Timed[];
  /** False for a chapter that never opens the Raycast window. */
  window?: boolean;
};

/** Every chapter opens the same way. */
const SUMMON: Timed = { at: 250, keys: ["⌥", "Space"], label: "Open Raycast" };
const WINDOW_IN = 380;
const WINDOW_OUT = 6050;
const KEY_HOLD = 1150;
const KEY_PRESS = 110;

const typed = (lt: number, text: string, from: number, perChar: number) =>
  lt < from ? "" : text.slice(0, Math.floor((lt - from) / perChar) + 1);

const during = (lt: number, from: number, to: number) => lt >= from && lt < to;

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

type Point = { x: number; y: number };
type Move = Point & { from: number; to: number };

/** Where the pointer is at `lt`, gliding from `start` through each move in turn. */
function pointer(lt: number, start: Point, moves: Move[]): Point {
  let at = start;
  for (const m of moves) {
    if (lt >= m.to) {
      at = m;
      continue;
    }
    if (lt <= m.from) break;
    const k = ease((lt - m.from) / (m.to - m.from));
    return { x: at.x + (m.x - at.x) * k, y: at.y + (m.y - at.y) * k };
  }
  return { x: at.x, y: at.y };
}

const middleOf = (id: string) => {
  const b = MENU_ITEM_BOUNDS.find((x) => x.id === id);
  return b ? (b.top + b.bottom) / 2 : 0;
};

function scene(chapter: number, lt: number): Scene {
  switch (chapter) {
    case 0: {
      const opened = lt >= 2000;
      return {
        view: opened ? "portfolio" : "root",
        query: opened ? "" : typed(lt, "portfolio", 800, 95),
        keys: [
          SUMMON,
          { at: 1850, keys: ["↵"], label: "Show Portfolio" },
          { at: 2950, keys: ["↓"] },
          { at: 3350, keys: ["↓"] },
          { at: 3950, keys: ["⌘", "⇧", "P"], label: "Hide balances" },
          { at: 4950, keys: ["⌘", "⇧", "P"], label: "Show balances" },
        ],
        selected: lt < 3000 ? 0 : lt < 3400 ? 1 : 2,
        privacy: during(lt, 4000, 5000),
        camera: during(lt, 2350, 5300) ? { x: 50, y: 30, scale: 1.3 } : null,
      };
    }

    // The ticker argument: "Show Positions nvda" from the root search opens the detail panel.
    case 1: {
      const opened = lt >= 2200;
      return {
        view: opened ? "positions" : "root",
        query: opened ? "nvda" : typed(lt, "pos", 800, 110),
        arg: typed(lt, "nvda", 1500, 110),
        argFocused: !opened && lt >= 1300,
        keys: [
          SUMMON,
          { at: 1300, keys: ["⇥"], label: "Ticker argument" },
          { at: 2050, keys: ["↵"], label: "Show Positions NVDA" },
        ],
        // Any further in and the crop cuts the ticker in the list pane.
        camera: during(lt, 2600, 5300) ? { x: 54, y: 56, scale: 1.34 } : null,
      };
    }

    // ⌘P opens a search bar dropdown in Raycast; two ↓ land on Dividends.
    case 2: {
      const opened = lt >= 1400;
      return {
        view: opened ? "activities" : "root",
        query: opened ? "" : typed(lt, "act", 800, 110),
        keys: [
          SUMMON,
          { at: 1250, keys: ["↵"], label: "Show Activities" },
          { at: 2300, keys: ["⌘", "P"], label: "Filter" },
          { at: 2750, keys: ["↓"] },
          { at: 3100, keys: ["↓"] },
          { at: 3500, keys: ["↵"], label: "Dividends" },
        ],
        dropdown: opened && during(lt, 2350, 3550) ? (lt < 2800 ? 0 : lt < 3150 ? 1 : 2) : null,
        filter: lt >= 3550 ? "dividends" : "all",
        camera: during(lt, 1750, 3700)
          ? { x: 88, y: 12, scale: 1.45 }
          : during(lt, 3700, 5300)
            ? { x: 50, y: 36, scale: 1.22 }
            : null,
      };
    }

    case 3: {
      const opened = lt >= 1400;
      return {
        view: opened ? "fog" : "root",
        query: opened ? "" : typed(lt, "fog", 800, 110),
        keys: [SUMMON, { at: 1250, keys: ["↵"], label: "Show Fog" }],
        camera: during(lt, 1750, 5300) ? { x: 30, y: 34, scale: 1.38 } : null,
      };
    }

    // No Raycast window: click the menu bar item, sweep down to Fog, then Hide Balances.
    default: {
      const cursor = pointer(lt, { x: 560, y: 380 }, [
        { from: 450, to: 1150, x: 700, y: 13 },
        { from: 2100, to: 2800, x: 712, y: middleOf("fog") },
        { from: 3050, to: 3550, x: 712, y: middleOf("hide") },
        { from: 3850, to: 4450, x: 520, y: 470 },
      ]);
      const open = during(lt, 1300, 3760);
      return {
        view: "root",
        window: false,
        keys: [
          { at: 1250, keys: ["Click"], label: "Folio in the menu bar" },
          { at: 3700, keys: ["Click"], label: "Hide Balances" },
        ],
        menuBar: {
          shown: during(lt, 100, 6150),
          open,
          hovered: open ? (MENU_ITEM_BOUNDS.find((b) => cursor.y >= b.top && cursor.y < b.bottom)?.id ?? null) : null,
          masked: lt >= 3760,
        },
        cursor: {
          ...cursor,
          visible: during(lt, 300, 6000),
          pressed: during(lt, 1250, 1370) || during(lt, 3700, 3820),
        },
        // Pinned to the top edge throughout, so a phone's tighter crop never loses the menu bar,
        // and to the right edge while in close, where the extras and the menu live.
        camera: during(lt, 500, 3950)
          ? { x: 100, y: 0, scale: 1.26 }
          : during(lt, 4000, 5800)
            ? { x: 100, y: 0, scale: 2 }
            : { x: 50, y: 0, scale: 1 },
      };
    }
  }
}

/** The frame at `t` ms into the loop. Negative `t` is a lead-in on an empty desktop. */
export function frameAt(t: number): Frame {
  const chapter = t < 0 ? 0 : Math.min(CHAPTERS.length - 1, Math.floor(t / CHAPTER_MS));
  const lt = t - chapter * CHAPTER_MS;
  const s = scene(chapter, lt);

  let key: Timed | null = null;
  for (const k of s.keys) if (lt >= k.at) key = k;
  const age = key ? lt - key.at : Infinity;

  return {
    chapter,
    progress: Math.min(1, Math.max(0, lt / CHAPTER_MS)),
    open: (s.window ?? true) && during(lt, WINDOW_IN, WINDOW_OUT),
    view: s.view,
    query: s.query ?? "",
    arg: s.arg ?? "",
    argFocused: s.argFocused ?? false,
    selected: s.selected ?? 0,
    privacy: s.privacy ?? false,
    filter: s.filter ?? "all",
    dropdown: s.dropdown ?? null,
    camera: s.camera ?? null,
    key: key && { keys: key.keys, label: key.label },
    keyVisible: age < KEY_HOLD,
    keyFresh: age < KEY_PRESS,
    menuBar: s.menuBar ?? null,
    cursor: s.cursor ?? null,
  };
}

/**
 * The resting frame, shown before the demo starts: Show Portfolio, open and still.
 * It is the same picture as the static screenshot underneath, so fading the demo in
 * over that screenshot changes almost nothing.
 */
export const POSTER: Frame = {
  chapter: 0,
  progress: 0,
  open: true,
  view: "portfolio",
  query: "",
  arg: "",
  argFocused: false,
  selected: 0,
  privacy: false,
  filter: "all",
  dropdown: null,
  camera: null,
  key: null,
  keyVisible: false,
  keyFresh: false,
  menuBar: null,
  cursor: null,
};
