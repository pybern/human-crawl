"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import CornerMarks from "@/components/layout/CornerMarks";
import { useApp } from "@/lib/store";

// The hero runs its own client-only canvas (with an EffectComposer for the
// signature mouse-displacement ripple), so load it ssr-disabled.
const HeroCanvas = dynamic(
  () => import("@/components/sections/hero/HeroCanvas"),
  { ssr: false }
);

/**
 * Hero — the interactive "jack pit".
 * Heading + rounded dark "window" + scroll cue, with a dedicated WebGL canvas
 * holding the glossy hollow-tube jack pile (custom physics) and the cursor
 * mouse-displacement post pass.
 */
export default function Hero() {
  const setCursorVariant = useApp((s) => s.setCursorVariant);
  const webglOk = useApp((s) => s.webglOk);

  // Pause the hero canvas' render loop (physics + post pass) once the window
  // scrolls out of view, so it isn't burning frames while you're deep in the
  // page. Stays mounted (no re-seed / re-compile) — just stops ticking.
  const windowRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="top"
      className="relative w-full px-5 pt-24 md:px-10 md:pt-28"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="font-display text-[7vw] leading-[1.02] tracking-tight md:max-w-[60%] md:text-[2.6vw]">
          We build AI, web, and cutting-edge research projects — on top of many
          things, but most importantly to solve real problems
        </div>
      </div>

      {/* The WebGL window */}
      <div className="mx-auto mt-8 max-w-[1500px]">
        <div
          ref={windowRef}
          onMouseEnter={() => setCursorVariant("drag")}
          onMouseLeave={() => setCursorVariant("default")}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] md:aspect-[16/9]"
          style={{ background: "var(--window)" }}
        >
          {webglOk ? (
            <HeroCanvas active={inView} />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 60%, #2733ff 0%, #11131f 55%, #0b0b12 100%)",
              }}
            />
          )}
          <CornerMarks color="rgba(255,255,255,.5)" inset={14} />
        </div>
      </div>

      <div className="mx-auto mt-4 mb-16 flex max-w-[1500px] items-center justify-center md:mb-24">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink-soft">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
