"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AstronautJourney from "@/components/sections/world/AstronautJourney";
import LazyView from "@/components/canvas/LazyView";
import { cinema } from "@/lib/cinema";
import { useApp } from "@/lib/store";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function NewWorld() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const t1 = useRef<HTMLDivElement>(null);
  const t2 = useRef<HTMLDivElement>(null);
  const isMobile = useApp((s) => s.isMobile);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        cinema.progress = self.progress;
      },
    });

    // text timeline scrubbed across the section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
    tl.fromTo(
      t1.current,
      { opacity: 0, filter: "blur(8px)", color: "#6b6f80" },
      { opacity: 1, filter: "blur(0px)", color: "#ffffff", duration: 0.12 },
      0.04
    )
      .to(t1.current, { opacity: 0, filter: "blur(8px)", duration: 0.1 }, 0.33)
      .fromTo(
        t2.current,
        { opacity: 0, filter: "blur(8px)" },
        { opacity: 1, filter: "blur(0px)", duration: 0.12 },
        0.55
      )
      .to(t2.current, { opacity: 0, filter: "blur(8px)", duration: 0.1 }, 0.82);

    return () => {
      st.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-theme="dark"
      className="relative w-full"
      style={{ height: "380vh", background: "var(--night)" }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        {/* WebGL journey */}
        <LazyView
          fallback={
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, #0a0c18 0%, #05060a 70%)",
              }}
            />
          }
        >
          <AstronautJourney mobile={isMobile} />
        </LazyView>

        {/* lens / chromatic vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.55) 100%), radial-gradient(circle at center, transparent 58%, rgba(120,140,255,0.10) 63%, rgba(255,90,120,0.08) 67%, transparent 72%)",
          }}
        />

        {/* overlay text */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <h2
            ref={t1}
            className="font-display text-[8vw] font-medium leading-[0.98] tracking-tight md:text-[5.2vw]"
            style={{ opacity: 0 }}
          >
            Step into a new world
            <br />
            and let your
            <br />
            imagination run wild
          </h2>
          <div
            ref={t2}
            className="absolute font-mono text-xs uppercase tracking-[0.35em] text-white"
            style={{ opacity: 0 }}
          >
            Real-time worlds · built for the browser
          </div>
        </div>
      </div>
    </section>
  );
}
