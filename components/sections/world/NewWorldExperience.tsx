"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CornerMarks from "@/components/layout/CornerMarks";
import { cinema } from "@/lib/cinema";
import { useApp } from "@/lib/store";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

// dedicated client-only canvas (post-processing stack)
const CinematicCanvas = dynamic(
  () => import("@/components/sections/world/CinematicCanvas"),
  { ssr: false }
);

/**
 * Standalone, higher-detail "Step into a new world" + "Let's work together"
 * cinematic for the `/new-world` route. A tall scroll spacer drives
 * `cinema.progress` (read by the scene each frame); the canvas + DOM overlays
 * are viewport-fixed. Mirrors the home section's scrub-timeline copy, but the
 * scene + post stack are the high-detail variant.
 */
export default function NewWorldExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const t1 = useRef<HTMLHeadingElement>(null);
  const t2 = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const webglOk = useApp((s) => s.webglOk);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    (window as unknown as { cinema?: typeof cinema }).cinema = cinema;

    const st = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        cinema.progress = self.progress;
      },
    });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: true },
    });
    tl.fromTo(
      t1.current,
      { opacity: 0, filter: "blur(8px)", color: "#6b6f80" },
      { opacity: 1, filter: "blur(0px)", color: "#ffffff", duration: 0.1 },
      0.04
    )
      .to(t1.current, { opacity: 0, filter: "blur(8px)", duration: 0.08 }, 0.3)
      .fromTo(
        t2.current,
        { opacity: 0, filter: "blur(8px)" },
        { opacity: 1, filter: "blur(0px)", duration: 0.08 },
        0.44
      )
      .to(t2.current, { opacity: 0, filter: "blur(8px)", duration: 0.08 }, 0.62)
      .fromTo(ctaRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12 }, 0.85);

    return () => {
      st.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      data-theme="dark"
      className="relative w-full"
      style={{ height: "620vh", background: "var(--night)" }}
    >
      {/* dedicated WebGL canvas (fixed, pointer-events none) */}
      {webglOk ? (
        <CinematicCanvas />
      ) : (
        <div
          className="fixed inset-0"
          style={{ background: "radial-gradient(ellipse at center, #0a0c18 0%, #05060a 70%)" }}
        />
      )}

      {/* journey text */}
      <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center px-6 text-center">
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

      {/* CTA copy */}
      <div
        ref={ctaRef}
        className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center px-6 text-center text-white"
        style={{ opacity: 0 }}
      >
        <span
          className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-white/70"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,.7)" }}
        >
          Is your big idea ready to go wild?
        </span>
        <h2
          className="mt-6 font-display text-[13vw] font-semibold leading-[0.95] tracking-tight md:text-[8vw]"
          style={{ textShadow: "0 6px 50px rgba(0,0,0,.65), 0 2px 10px rgba(0,0,0,.6)" }}
        >
          Let&apos;s work together!
        </h2>
        <a href="mailto:hello@lusion.co" className="pointer-events-auto mt-10 inline-flex">
          <span className="pill" style={{ background: "var(--bg-elevated)", color: "var(--ink)" }}>
            <span style={{ opacity: 0.6 }}>●</span> Continue to scroll
          </span>
        </a>
        <CornerMarks color="rgba(255,255,255,.35)" inset={24} />
      </div>

      {/* persistent chrome: back link + asset attribution */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="pointer-events-auto font-mono text-[0.65rem] uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white"
        >
          ← Back home
        </Link>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-white/40">
          Astronaut by Poly · CC-BY
        </span>
      </div>
    </div>
  );
}
