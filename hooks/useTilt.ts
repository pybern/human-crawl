"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

/**
 * Subtle 3D tilt-toward-cursor for an element (the Lusion project-card feel).
 * Eases rotateX/rotateY toward the pointer position via a rAF spring, resets on
 * leave. Disabled on touch and when the user prefers reduced motion.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>({
  max = 6,
  perspective = 1000,
}: { max?: number; perspective?: number } = {}) {
  const ref = useRef<T>(null);
  const reduced = useApp((s) => s.reducedMotion);
  const isMobile = useApp((s) => s.isMobile);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || isMobile) return;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      targetY = px * max * 2;
      targetX = -py * max * 2;
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };
    const loop = () => {
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      el.style.transform = `perspective(${perspective}px) rotateX(${curX.toFixed(
        3
      )}deg) rotateY(${curY.toFixed(3)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.style.transform = "";
    };
  }, [reduced, isMobile, max, perspective]);

  return ref;
}
