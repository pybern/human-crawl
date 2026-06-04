"use client";

import CornerMarks from "@/components/layout/CornerMarks";
import LazyView from "@/components/canvas/LazyView";
import { useApp } from "@/lib/store";
import JackPit from "@/components/sections/hero/JackPit";

/**
 * Hero — Phase 1 scaffold.
 * Establishes the layout (heading + rounded dark "window" + scroll cue) and a
 * working drei <View> anchored to the window. Phase 2 swaps the placeholder
 * geometry for the Rapier "jack pit" + stencil mask + mouse displacement.
 */
export default function Hero() {
  const setCursorVariant = useApp((s) => s.setCursorVariant);
  const isMobile = useApp((s) => s.isMobile);

  return (
    <section
      id="top"
      className="relative w-full px-5 pt-24 md:px-10 md:pt-28"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="font-display text-[7vw] leading-[1.02] tracking-tight md:max-w-[60%] md:text-[2.6vw]">
          We create 3D visual storytelling and interactive web experiences that
          help brands stand out
        </div>
      </div>

      {/* The WebGL window */}
      <div className="mx-auto mt-8 max-w-[1500px]">
        <div
          onMouseEnter={() => setCursorVariant("drag")}
          onMouseLeave={() => setCursorVariant("default")}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] md:aspect-[16/9]"
          style={{ background: "var(--window)" }}
        >
          <LazyView
            fallback={
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 60%, #2733ff 0%, #11131f 55%, #0b0b12 100%)",
                }}
              />
            }
          >
            <JackPit mobile={isMobile} />
          </LazyView>
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
