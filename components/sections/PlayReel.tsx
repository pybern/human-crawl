"use client";

import { useEffect, useRef, useState } from "react";
import CornerMarks from "@/components/layout/CornerMarks";
import { useApp } from "@/lib/store";

export default function PlayReel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const setCursorVariant = useApp((s) => s.setCursorVariant);

  // Play only while in view (perf + battery).
  useEffect(() => {
    const v = videoRef.current;
    const sec = sectionRef.current;
    if (!v || !sec) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 }
    );
    io.observe(sec);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full px-5 py-10 md:px-10 md:py-16"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="relative w-full overflow-hidden rounded-[28px]"
        style={{ background: "var(--reel)" }}
      >
        <video
          ref={videoRef}
          className="aspect-[16/10] w-full object-cover opacity-90 md:aspect-[21/9]"
          src="/videos/reel.mp4"
          muted={muted}
          loop
          playsInline
          preload="metadata"
        />

        {/* Overlay: kinetic PLAY REEL + play button */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-5 mix-blend-difference md:gap-10">
            <span className="font-display text-[14vw] font-semibold leading-none tracking-tight text-white md:text-[8vw]">
              Play
            </span>
            <button
              onClick={() => {
                setMuted((m) => !m);
                videoRef.current?.play().catch(() => {});
              }}
              onMouseEnter={() => setCursorVariant("hover")}
              onMouseLeave={() => setCursorVariant("default")}
              aria-label={muted ? "Unmute reel" : "Mute reel"}
              className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-black md:h-24 md:w-24"
            >
              <span className="ml-1 inline-block border-y-[10px] border-l-[16px] border-y-transparent border-l-black md:border-y-[14px] md:border-l-[22px]" />
            </button>
            <span className="font-display text-[14vw] font-semibold leading-none tracking-tight text-white md:text-[8vw]">
              Reel
            </span>
          </div>
        </div>

        <CornerMarks color="rgba(255,255,255,.7)" inset={16} />
      </div>
    </section>
  );
}
