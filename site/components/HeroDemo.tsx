"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import * as Icon from "./hero-demo/icons";
import { RaycastWindow } from "./hero-demo/RaycastWindow";
import { CHAPTER_MS, CHAPTERS, frameAt, LOOP_MS, POSTER, type Frame } from "./hero-demo/timeline";

/** The stage is drawn at this width and scaled to fit, so it keeps its proportions at any size. */
const STAGE_WIDTH = 1068;
/** Long enough for the hero's own entrance to finish before anything else moves. */
const START_DELAY_MS = 1500;
/** The first loop opens on an empty desktop for a beat, so Raycast visibly goes away and is summoned. */
const LEAD_IN_MS = 300;
const TICK_MS = 50;

/**
 * The hero shot, in motion: Folio in Raycast, command by command.
 *
 * `children` is the static screenshot. It is what the server renders, what the page
 * paints first, and all that anyone with reduced motion or without JavaScript sees;
 * the demo only mounts over it once the browser says motion is welcome. The demo's
 * resting frame is that same screenshot redrawn, so the fade from one to the other
 * is close to invisible.
 *
 * The clock only runs while the demo is on screen and the tab is visible, and the
 * visitor can pause it or jump to a chapter.
 */
export function HeroDemo({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  /** Milliseconds into the loop, or null before the demo has started. */
  const [clock, setClock] = useState<number | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const update = () => setMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !motion) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(el);
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [motion]);

  const running = motion && inView && tabVisible && !paused;
  const started = clock !== null;

  useEffect(() => {
    if (!running || started) return;
    const id = setTimeout(() => setClock(-LEAD_IN_MS), START_DELAY_MS);
    return () => clearTimeout(id);
  }, [running, started]);

  useEffect(() => {
    if (!running || !started) return;
    // Advance by real elapsed time, so a throttled timer slows nothing down.
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min(now - last, 250);
      last = now;
      setClock((t) => ((t ?? 0) + elapsed) % LOOP_MS);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running, started]);

  const frame = clock === null ? POSTER : frameAt(clock);

  return (
    <div ref={rootRef} className="demo" data-live={motion}>
      <div className="demo__frame">
        {children}
        {motion && <Stage frame={frame} />}
      </div>

      <div className="demo__controls">
        <div className="demo__chapters" role="group" aria-label="Demo chapters">
          {CHAPTERS.map((name, i) => (
            <button
              key={name}
              type="button"
              className="demo__chapter"
              aria-current={frame.chapter === i ? "true" : undefined}
              onClick={() => {
                setClock(i * CHAPTER_MS);
                setPaused(false);
              }}
            >
              {name}
            </button>
          ))}
        </div>
        <button type="button" className="demo__toggle" onClick={() => setPaused((p) => !p)}>
          {paused ? <Icon.Play /> : <Icon.Pause />}
          <span className="demo__toggle-label">{paused ? "Play" : "Pause"}</span>
        </button>
      </div>
    </div>
  );
}

function Stage({ frame }: { frame: Frame }) {
  const ref = useRef<HTMLDivElement>(null);

  // Scale the fixed-size canvas to the stage before the first paint, then on every resize.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = (width: number) => el.style.setProperty("--k", String(width / STAGE_WIDTH));
    fit(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => fit(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { camera, key } = frame;
  const cameraStyle = {
    "--cam": camera?.scale ?? 1,
    "--cam-x": `${camera?.x ?? 50}%`,
    "--cam-y": `${camera?.y ?? 50}%`,
  } as CSSProperties;

  return (
    // The screenshot underneath keeps its alt text; this is decoration on top of it.
    <div ref={ref} className="demo__stage" aria-hidden="true">
      <div className="demo__canvas">
        <div className="demo__camera" style={cameraStyle}>
          <div className="demo__wallpaper" />
          <RaycastWindow frame={frame} />
        </div>
      </div>

      <div className="demo__scrim" />

      <div className="demo__keys" data-visible={frame.keyVisible} data-fresh={frame.keyFresh}>
        {key?.keys.map((k, i) => (
          <span key={i} className="demo__cap">
            {k}
          </span>
        ))}
        {key?.label && <span className="demo__key-label">{key.label}</span>}
      </div>

      <div className="demo__progress">
        {CHAPTERS.map((name, i) => (
          <span key={name} className="demo__segment">
            <span
              style={
                {
                  "--p": i < frame.chapter ? 1 : i > frame.chapter ? 0 : frame.progress,
                } as CSSProperties
              }
            />
          </span>
        ))}
      </div>
    </div>
  );
}
