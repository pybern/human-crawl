"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useApp } from "@/lib/store";

/**
 * Black entry screen with a modern circular loader (a spinning accent ring + a
 * determinate progress ring with a live 0 -> 100 counter in the middle).
 *
 * It reveals the page only once it's genuinely ready: a minimum on-screen time,
 * all assets loaded (drei useProgress), web fonts ready, AND the main WebGL
 * scene has painted its first frame (`sceneReady`) — with a grace fallback for
 * routes that have no heavy canvas, plus a hard cap so it always reveals.
 * One-shot: once revealed it never returns.
 */
const MIN_MS = 1200; // minimum time the loader stays up
const SCENE_GRACE_MS = 2600; // if no canvas has painted by now, assume there isn't one
const MAX_MS = 14000; // hard safety cap so we never hang

// determinate progress ring + outer spinner geometry
const PROG_R = 58;
const PROG_C = 2 * Math.PI * PROG_R;
const SPIN_R = 70;
const SPIN_C = 2 * Math.PI * SPIN_R;

export default function Preloader() {
  const { active, progress: loaded } = useProgress();
  const setReady = useApp((s) => s.setReady);
  const sceneReady = useApp((s) => s.sceneReady);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  // keep latest signals in refs so the rAF loop reads them without restarting
  const activeRef = useRef(active);
  const loadedRef = useRef(loaded);
  const sceneReadyRef = useRef(sceneReady);
  const fontsReadyRef = useRef(false);
  useEffect(() => {
    activeRef.current = active;
    loadedRef.current = loaded;
  }, [active, loaded]);
  useEffect(() => {
    sceneReadyRef.current = sceneReady;
  }, [sceneReady]);

  // web fonts ready (so text isn't mid-swap when we reveal)
  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(() => (fontsReadyRef.current = true));
    else fontsReadyRef.current = true;
  }, []);

  const finished = useRef(false);

  useEffect(() => {
    if (finished.current) return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const timeP = Math.min(1, elapsed / MIN_MS) * 100;
      const real = activeRef.current ? loadedRef.current : 100;
      const target = Math.min(real, timeP);
      setCount((c) => {
        const next = c + (target - c) * 0.14;
        return next > 99.4 ? 100 : next;
      });

      const assetsDone = !activeRef.current;
      const scenePainted =
        sceneReadyRef.current || elapsed > SCENE_GRACE_MS; // grace = no canvas
      const canReveal =
        elapsed > MIN_MS && assetsDone && fontsReadyRef.current && scenePainted;

      if (canReveal || elapsed > MAX_MS) {
        finished.current = true;
        setCount(100);
        // one more frame so the (now-ready) page is painted before we lift
        requestAnimationFrame(() => setDone(true));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(t);
  }, [done, setReady]);

  const pct = Math.round(count);

  return (
    <div
      aria-hidden={done}
      className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{
        background: "var(--night)",
        clipPath: done ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: "clip-path 0.9s var(--easing)",
        pointerEvents: done ? "none" : "auto",
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 160,
          height: 160,
          opacity: done ? 0 : 1,
          transform: done ? "scale(0.94)" : "scale(1)",
          transition: "opacity 0.5s var(--easing), transform 0.6s var(--easing)",
        }}
      >
        {/* outer indeterminate spinner */}
        <svg
          className="absolute inset-0 animate-spin"
          style={{ animationDuration: "1.1s" }}
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle
            cx="80"
            cy="80"
            r={SPIN_R}
            stroke="var(--cobalt)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${SPIN_C * 0.12} ${SPIN_C}`}
            opacity="0.9"
          />
        </svg>

        {/* determinate progress ring */}
        <svg
          className="absolute inset-0 -rotate-90"
          width="160"
          height="160"
          viewBox="0 0 160 160"
          fill="none"
        >
          <circle
            cx="80"
            cy="80"
            r={PROG_R}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="3"
          />
          <circle
            cx="80"
            cy="80"
            r={PROG_R}
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={PROG_C}
            strokeDashoffset={PROG_C * (1 - count / 100)}
            style={{ transition: "stroke-dashoffset 0.2s linear" }}
          />
        </svg>

        {/* center counter */}
        <div className="flex flex-col items-center justify-center">
          <span
            className="font-display text-4xl font-medium tabular-nums"
            style={{ color: "var(--bg-elevated)", letterSpacing: "-0.02em" }}
          >
            {pct}
          </span>
          <span
            className="font-mono mt-1 text-[0.6rem] uppercase tracking-[0.3em]"
            style={{ color: "var(--ink-soft)" }}
          >
            Loading
          </span>
        </div>
      </div>
    </div>
  );
}
