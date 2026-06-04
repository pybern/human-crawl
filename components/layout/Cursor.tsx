"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

/**
 * Custom cursor: a small dot + a trailing ring that eases toward the pointer
 * and grows on hover. Desktop / fine-pointer only; on touch devices we leave
 * the native behavior alone.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const variant = useApp((s) => s.cursorVariant);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("has-custom-cursor");

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      if (dotRef.current)
        dotRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      if (ringRef.current)
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  const scale = variant === "hover" ? 2.4 : variant === "drag" ? 0.6 : 1;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100] hidden md:block">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-ink mix-blend-difference"
        style={{ background: "#fff" }}
      />
      <div
        ref={ringRef}
        className="fixed left-0 top-0 rounded-full border border-white mix-blend-difference transition-[width,height,opacity] duration-300"
        style={{
          width: `${28 * scale}px`,
          height: `${28 * scale}px`,
          opacity: variant === "hover" ? 0.9 : 0.5,
        }}
      />
    </div>
  );
}
