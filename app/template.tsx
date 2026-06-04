"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useApp } from "@/lib/store";

/**
 * Lightweight route-transition wrapper. On each navigation the new page wipes
 * up from a clip + fade. Templates re-mount on navigation (unlike layouts), so
 * this runs per route. Respects reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useApp((s) => s.reducedMotion);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { clipPath: "inset(100% 0 0 0)", opacity: 0.6 },
        {
          clipPath: "inset(0% 0 0 0)",
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return <div ref={ref}>{children}</div>;
}
