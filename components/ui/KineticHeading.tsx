"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/lib/store";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Big display heading whose words rise from a clipped mask as it scrolls into
 * view (the kinetic type Lusion uses for section titles).
 */
export default function KineticHeading({
  text,
  className,
  as = "h2",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useApp((s) => s.reducedMotion);
  const words = text.split(" ");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inner = el.querySelectorAll<HTMLElement>("[data-word]");
    if (reduced) {
      gsap.set(inner, { yPercent: 0 });
      return;
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: 1,
          ease: "power4.out",
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: "top 88%" },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [reduced, text]);

  const inner = words.map((w, i) => (
    <span
      key={i}
      style={{
        display: "inline-block",
        overflow: "hidden",
        verticalAlign: "top",
      }}
    >
      <span
        data-word
        style={{ display: "inline-block", willChange: "transform" }}
      >
        {w}
      </span>
      {i < words.length - 1 ? "\u00A0" : ""}
    </span>
  ));

  if (as === "h1")
    return (
      <h1 ref={ref} className={className}>
        {inner}
      </h1>
    );
  if (as === "h3")
    return (
      <h3 ref={ref} className={className}>
        {inner}
      </h3>
    );
  return (
    <h2 ref={ref} className={className}>
      {inner}
    </h2>
  );
}
