"use client";

import { useRef } from "react";
import type { Project } from "@/lib/data/projects";
import { useApp } from "@/lib/store";

export default function ProjectCard({ project }: { project: Project }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setCursorVariant = useApp((s) => s.setCursorVariant);
  const isMobile = useApp((s) => s.isMobile);

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
      href={project.href ?? "#work"}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group flex flex-col gap-4"
    >
      <div
        className="relative w-full overflow-hidden rounded-[20px]"
        style={{ background: "var(--window)" }}
      >
        <video
          ref={videoRef}
          className="aspect-[4/3] w-full scale-[1.01] object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          src={project.video}
          muted
          loop
          playsInline
          preload="metadata"
          autoPlay={isMobile}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-ink-soft">
            {project.tags.join(" • ")}
          </span>
          <h3 className="font-display text-2xl font-medium tracking-tight md:text-3xl">
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
