"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useApp } from "@/lib/store";

/**
 * Black entry screen with a glossy "L" mark and a 0 -> 100 counter that tracks
 * real asset/WebGL load progress (drei useProgress), with a minimum on-screen
 * time so the reveal feels intentional and a hard cap so it always reveals.
 * One-shot: once revealed it never returns (even as later sections stream in).
 */
const MIN_MS = 1400;
const MAX_MS = 3600;

export default function Preloader() {
  const { active, progress: loaded } = useProgress();
  const setReady = useApp((s) => s.setReady);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  // keep latest progress in refs so the loop reads them without restarting
  const activeRef = useRef(active);
  const loadedRef = useRef(loaded);
  useEffect(() => {
    activeRef.current = active;
    loadedRef.current = loaded;
  }, [active, loaded]);

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
      const settled = elapsed > MIN_MS && !activeRef.current;
      const capped = elapsed > MAX_MS;
      if (settled || capped) {
        finished.current = true;
        setCount(100);
        setDone(true);
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
        className="relative"
        style={{
          width: "min(34vw, 220px)",
          height: "min(34vw, 220px)",
          opacity: done ? 0 : 1,
          transition: "opacity 0.5s var(--easing)",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: "30%",
            top: 0,
            width: "22%",
            height: "78%",
            borderRadius: 12,
            background: "linear-gradient(150deg,#ffffff,#cfd2ff 55%,#9aa0ff)",
            boxShadow: "inset 0 6px 18px rgba(255,255,255,.6)",
            transform: done ? "translateY(40px)" : "translateY(0)",
            transition: "transform 0.6s var(--easing)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "30%",
            bottom: 0,
            width: "55%",
            height: "22%",
            borderRadius: 12,
            background: "linear-gradient(60deg,#ffffff,#cfd2ff 55%,#9aa0ff)",
            boxShadow: "inset 0 6px 18px rgba(255,255,255,.6)",
            transform: done ? "translateX(40px)" : "translateX(0)",
            transition: "transform 0.6s var(--easing)",
          }}
        />
      </div>

      <span
        className="font-mono absolute bottom-6 left-6 text-5xl font-medium md:bottom-10 md:left-10 md:text-7xl"
        style={{ color: "var(--bg-elevated)" }}
      >
        {Math.round(count)}
      </span>
      <span
        className="font-mono absolute bottom-8 right-6 text-xs uppercase tracking-widest md:bottom-12 md:right-10"
        style={{ color: "var(--ink-soft)" }}
      >
        Loading experience
      </span>
    </div>
  );
}
