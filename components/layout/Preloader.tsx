"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useApp } from "@/lib/store";

/**
 * Black entry screen with a glossy "L" mark and a 0 -> 100 counter that tracks
 * real asset/WebGL load progress (drei useProgress), with a minimum on-screen
 * time so the reveal always feels intentional. Fades up to reveal the hero.
 */
export default function Preloader() {
  const { active, progress: loaded } = useProgress();
  const setReady = useApp((s) => s.setReady);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const start = useRef<number>(0);

  useEffect(() => {
    start.current = performance.now();
    let raf = 0;
    const MIN_MS = 1600;
    const tick = () => {
      const elapsed = performance.now() - start.current;
      const timeP = Math.min(1, elapsed / MIN_MS) * 100;
      // Take the lower of (real load) and (min-time) so we never finish early.
      const real = active ? loaded : 100;
      const target = Math.min(real, timeP);
      setCount((c) => {
        const next = c + (target - c) * 0.12;
        return next > 99.4 ? 100 : next;
      });
      if (elapsed > MIN_MS && !active) {
        setCount(100);
        setDone(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, loaded]);

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
      {/* Glossy "L" built from two rounded panels (the jack material motif). */}
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
            background:
              "linear-gradient(150deg,#ffffff,#cfd2ff 55%,#9aa0ff)",
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
            background:
              "linear-gradient(60deg,#ffffff,#cfd2ff 55%,#9aa0ff)",
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
