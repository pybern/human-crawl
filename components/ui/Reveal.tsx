"use client";

import { createElement, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/lib/store";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  className?: string;
  /** translate distance in px */
  y?: number;
  delay?: number;
  /** stagger direct children instead of the wrapper */
  stagger?: boolean;
  as?: "div" | "section" | "span" | "p" | "ul" | "li";
};

/**
 * Reveals content on scroll: fade + rise, honoring reduced-motion.
 * When `stagger` is set, the element's direct children animate in sequence.
 */
export default function Reveal({
  children,
  className,
  y = 40,
  delay = 0,
  stagger = false,
  as = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useApp((s) => s.reducedMotion);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = stagger ? Array.from(el.children) : [el];

    if (reduced) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
          stagger: stagger ? 0.08 : 0,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [y, delay, stagger, reduced]);

  return createElement(as, { ref, className }, children);
}
