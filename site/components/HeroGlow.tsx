"use client";

import { useEffect, useRef } from "react";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * The blue bloom behind the hero, following the pointer.
 *
 * Two radial layers ease toward the cursor at different rates, which reads as depth
 * rather than as a blob stuck to the mouse, and each only travels a fraction of the
 * pointer's own distance so the light never wanders off the top of the page.
 *
 * Position is carried in custom properties, so with JavaScript off — or reduced motion
 * on, or a coarse pointer — the layer keeps its centred defaults and the hero looks
 * exactly as it does in the static HTML.
 */
export function HeroGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    // Near layer is small, bright and quick; far layer is the wide halo, and lags.
    const layers = [
      { x: 50, y: 50, ease: 0.12, travelX: 0.62, travelY: 0.4 },
      { x: 50, y: 50, ease: 0.045, travelX: 0.4, travelY: 0.26 },
    ];
    let pointerX = 50;
    let pointerY = 50;
    let frame = 0;

    const tick = () => {
      let moving = false;
      for (const [i, l] of layers.entries()) {
        const tx = clamp(50 + (pointerX - 50) * l.travelX, 8, 92);
        const ty = clamp(50 + (pointerY - 50) * l.travelY, 14, 72);
        l.x += (tx - l.x) * l.ease;
        l.y += (ty - l.y) * l.ease;
        el.style.setProperty(`--gx${i}`, `${l.x.toFixed(2)}%`);
        el.style.setProperty(`--gy${i}`, `${l.y.toFixed(2)}%`);
        if (Math.abs(tx - l.x) > 0.04 || Math.abs(ty - l.y) > 0.04) moving = true;
      }
      frame = moving ? requestAnimationFrame(tick) : 0;
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointerX = ((event.clientX - rect.left) / rect.width) * 100;
      pointerY = ((event.clientY - rect.top) / rect.height) * 100;
      start();
    };

    const recenter = () => {
      pointerX = 50;
      pointerY = 50;
      start();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseleave", recenter);
    window.addEventListener("blur", recenter);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseleave", recenter);
      window.removeEventListener("blur", recenter);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="hero__glow" aria-hidden="true" />;
}
