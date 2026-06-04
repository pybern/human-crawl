"use client";

import KineticHeading from "@/components/ui/KineticHeading";
import CornerMarks from "@/components/layout/CornerMarks";
import StickerField from "@/components/sections/work/StickerField";
import LazyView from "@/components/canvas/LazyView";
import { useApp } from "@/lib/store";

export default function LetsWork() {
  const isMobile = useApp((s) => s.isMobile);

  return (
    <section
      id="contact"
      data-theme="dark"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden"
      style={{ background: "var(--night)", color: "var(--bg-elevated)" }}
    >
      {/* sticker + astronaut field fills the section */}
      <div className="absolute inset-0">
        <LazyView>
          <StickerField mobile={isMobile} />
        </LazyView>
      </div>

      <CornerMarks color="rgba(255,255,255,.35)" inset={24} />

      {/* foreground copy */}
      <div className="pointer-events-none relative z-10 flex flex-col items-center px-6 text-center">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-white/70">
          Is your big idea ready to go wild?
        </span>
        <KineticHeading
          text="Let's work together!"
          as="h2"
          className="mt-6 font-display text-[13vw] font-semibold leading-[0.95] tracking-tight text-white md:text-[8vw]"
        />
        <a
          href="mailto:hello@lusion.co"
          className="pointer-events-auto mt-10 inline-flex"
        >
          <span
            className="pill"
            style={{ background: "var(--bg-elevated)", color: "var(--ink)" }}
          >
            <span style={{ opacity: 0.6 }}>●</span> Continue to scroll
          </span>
        </a>
      </div>
    </section>
  );
}
