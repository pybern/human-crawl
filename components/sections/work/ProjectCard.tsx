"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Project } from "@/lib/data/projects";
import { useApp } from "@/lib/store";
import { useTilt } from "@/hooks/useTilt";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function ProjectCard({
  project,
  index = 0,
}: {
  project: Project;
  index?: number;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tiltRef = useTilt<HTMLDivElement>({ max: 6 });
  const setCursorVariant = useApp((s) => s.setCursorVariant);
  const isMobile = useApp((s) => s.isMobile);
  const reduced = useApp((s) => s.reducedMotion);

  // refined entrance: media wipes up, text rises (staggered per column)
  useEffect(() => {
    const card = cardRef.current;
    const media = mediaRef.current;
    if (!card || !media) return;
    const text = card.querySelectorAll<HTMLElement>("[data-rise]");
    if (reduced) {
      gsap.set(media, { clipPath: "inset(0% 0 0 0)" });
      gsap.set(text, { y: 0, opacity: 1 });
      return;
    }
    const delay = (index % 2) * 0.08;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        media,
        { clipPath: "inset(100% 0 0 0)" },
        {
          clipPath: "inset(0% 0 0 0)",
          duration: 1.05,
          ease: "power3.out",
          delay,
          scrollTrigger: { trigger: card, start: "top 85%" },
        }
      );
      gsap.fromTo(
        text,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.06,
          delay: delay + 0.1,
          scrollTrigger: { trigger: card, start: "top 85%" },
        }
      );
    }, card);
    return () => ctx.revert();
  }, [index, reduced]);

  const onEnter = () => {
    setCursorVariant("hover");
    if (!isMobile) videoRef.current?.play().catch(() => {});
  };
  const onLeave = () => {
    setCursorVariant("default");
    const v = videoRef.current;
    if (v && !isMobile) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <a
      ref={cardRef}
      href={project.href ?? "#work"}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group flex flex-col gap-4"
    >
      {/* tilt layer (perspective) */}
      <div ref={tiltRef} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
        <div
          ref={mediaRef}
          className="relative w-full overflow-hidden rounded-[20px]"
          style={{ background: "var(--window)" }}
        >
          <video
            ref={videoRef}
            className="aspect-[16/10] w-full scale-[1.02] object-cover brightness-[0.92] transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.07] group-hover:brightness-100"
            src={project.video}
            muted
            loop
            playsInline
            preload="metadata"
            autoPlay={isMobile}
          />

          {/* hover overlay: subtle darken + parallax "View project" chip */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-end justify-start p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "linear-gradient(to top, rgba(8,8,14,.45), transparent 55%)",
              transform: "translateZ(40px)",
            }}
          >
            <span
              className="pill"
              style={{ background: "var(--bg-elevated)", color: "var(--ink)" }}
            >
              View project →
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span
            data-rise
            className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-soft"
          >
            {project.tags.join(" • ")}
          </span>
          <h3
            data-rise
            className="font-display text-2xl font-medium tracking-tight md:text-3xl"
          >
            {project.title}
          </h3>
        </div>
        <span
          aria-hidden
          className="hidden h-9 w-9 flex-none items-center justify-center rounded-full border border-ink/20 transition-all duration-500 group-hover:bg-ink group-hover:text-bg md:flex"
        >
          →
        </span>
      </div>
    </a>
  );
}
