"use client";

import KineticHeading from "@/components/ui/KineticHeading";
import Reveal from "@/components/ui/Reveal";
import Ribbon from "@/components/sections/visuals/Ribbon";
import LazyView from "@/components/canvas/LazyView";
import { useApp } from "@/lib/store";

export default function BroughtToLife() {
  const setCursorVariant = useApp((s) => s.setCursorVariant);

  return (
    <section
      className="relative w-full overflow-hidden px-5 py-24 md:px-10 md:py-36"
      style={{ background: "var(--bg)" }}
    >
      <KineticHeading
        text="Bold Ideas, Brought to Life"
        as="h2"
        className="font-display text-[12vw] font-medium leading-[0.95] tracking-tight md:text-[8vw]"
      />

      <div className="mt-10 flex flex-col gap-10 md:mt-16 md:flex-row md:items-end md:justify-between">
        {/* Ribbon window */}
        <div
          onMouseEnter={() => setCursorVariant("hover")}
          onMouseLeave={() => setCursorVariant("default")}
          className="relative aspect-square w-full overflow-hidden rounded-[28px] md:w-[46%]"
          style={{ background: "var(--window)" }}
        >
          <LazyView
            fallback={
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 40% 40%, #2733ff 0%, #11131f 60%, #0b0b12 100%)",
                }}
              />
            }
          >
            <Ribbon />
          </LazyView>
        </div>

        {/* Copy */}
        <Reveal
          className="flex max-w-xl flex-col gap-7 md:w-[46%]"
          stagger
        >
          <p className="text-xl leading-relaxed text-ink md:text-2xl">
            We combine design, motion, 3D, and development to create digital
            experiences that feel visually striking and technically seamless.
            From campaign launches to immersive brand worlds, we build work that
            captures attention and invites interaction.
          </p>
          <div>
            <a
              href="#work"
              onMouseEnter={() => setCursorVariant("hover")}
              onMouseLeave={() => setCursorVariant("default")}
              className="pill"
              style={{ background: "var(--ink)", color: "var(--bg-elevated)" }}
            >
              <span style={{ opacity: 0.6 }}>●</span> Our approach
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
