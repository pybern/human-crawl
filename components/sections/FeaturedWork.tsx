"use client";

import KineticHeading from "@/components/ui/KineticHeading";
import Reveal from "@/components/ui/Reveal";
import ProjectCard from "@/components/sections/work/ProjectCard";
import { PROJECTS } from "@/lib/data/projects";
import { useApp } from "@/lib/store";

export default function FeaturedWork() {
  const setCursorVariant = useApp((s) => s.setCursorVariant);

  return (
    <section
      id="work"
      className="relative w-full px-5 py-24 md:px-10 md:py-36"
      style={{ background: "var(--bg)" }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <KineticHeading
          text="Featured Work"
          as="h2"
          className="font-display text-[13vw] font-medium leading-[0.95] tracking-tight md:text-[7vw]"
        />
        <Reveal className="max-w-sm" y={20}>
          <p className="font-mono text-xs uppercase leading-relaxed tracking-[0.12em] text-ink-soft">
            A selection of immersive digital experiences created for ambitious
            brands and forward-thinking teams.
          </p>
        </Reveal>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 md:mt-20 md:grid-cols-2">
        {PROJECTS.map((p, i) => (
          <Reveal key={p.title} y={50} delay={(i % 2) * 0.08}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </div>

      <div className="mt-16 flex justify-center md:mt-24">
        <a
          href="#work"
          onMouseEnter={() => setCursorVariant("hover")}
          onMouseLeave={() => setCursorVariant("default")}
          className="pill"
          style={{ background: "var(--ink)", color: "var(--bg-elevated)" }}
        >
          <span style={{ opacity: 0.6 }}>●</span> See all projects
        </a>
      </div>
    </section>
  );
}
