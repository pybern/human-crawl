"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AstronautJourney from "@/components/sections/world/AstronautJourney";
import LazyView from "@/components/canvas/LazyView";
import CornerMarks from "@/components/layout/CornerMarks";
import { cinema } from "@/lib/cinema";
import { useApp } from "@/lib/store";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * The continuous back half of the site: the "Step into a new world" cinematic
 * AND the "Let's work together" CTA share ONE pinned scene and ONE astronaut
 * instance (see AstronautJourney). A single scroll progress flies it through
 * the worlds, then pops it forward as the CTA copy fades in.
 */
export default function NewWorld() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const t1 = useRef<HTMLDivElement>(null);
  const t2 = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const isMobile = useApp((s) => s.isMobile);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    (window as unknown as { cinema?: typeof cinema }).cinema = cinema;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        cinema.progress = self.progress;
      },
    });

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
      { opacity: 1, filter: "blur(0px)", color: "#ffffff", duration: 0.1 },
      0.04
    )
      .to(t1.current, { opacity: 0, filter: "blur(8px)", duration: 0.08 }, 0.28)
      .fromTo(
        t2.current,
        { opacity: 0, filter: "blur(8px)" },
        { opacity: 1, filter: "blur(0px)", duration: 0.08 },
        0.42
      )
      .to(t2.current, { opacity: 0, filter: "blur(8px)", duration: 0.08 }, 0.6)
      // CTA copy fades in as the astronaut pops to the front
      .fromTo(
        ctaRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.12 },
        0.85
      );

    return () => {
      st.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="contact"
      data-theme="dark"
      className="relative w-full"
      style={{ height: "520vh", background: "var(--night)" }}
    >
      {/* z-20 lifts the DOM overlays above the global WebGL canvas (z-5) so the
          journey/CTA copy reads clearly in front of the astronaut. The 3D still
          shows through the transparent parts of this layer. */}
      <div className="sticky top-0 z-20 h-screen w-full overflow-hidden">
        {/* shared WebGL scene (single astronaut: cinematic + CTA) */}
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

        {/* journey text */}
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

        {/* CTA copy (same scene, astronaut popped forward) */}
        <div
          ref={ctaRef}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white"
          style={{ opacity: 0 }}
        >
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-white/70">
            Is your big idea ready to go wild?
          </span>
          <h2 className="mt-6 font-display text-[13vw] font-semibold leading-[0.95] tracking-tight md:text-[8vw]">
            Let&apos;s work together!
          </h2>
          <a href="mailto:hello@lusion.co" className="pointer-events-auto mt-10 inline-flex">
            <span
              className="pill"
              style={{ background: "var(--bg-elevated)", color: "var(--ink)" }}
            >
              <span style={{ opacity: 0.6 }}>●</span> Continue to scroll
            </span>
          </a>
          <CornerMarks color="rgba(255,255,255,.35)" inset={24} />
        </div>
      </div>
    </section>
  );
}
