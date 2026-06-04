"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/lib/store";

/**
 * Fluid custom cursor (desktop / fine-pointer only).
 *
 * A full-screen transparent canvas paints a soft white "dye" blob that eases
 * toward the pointer and leaves a fading smear (destination-out fade), with the
 * blob radius reacting to pointer speed — so quick moves stretch into a fluid
 * streak. The canvas is blended with `mix-blend-mode: difference`, so the trail
 * inverts whatever is beneath it (light over dark sections, dark over light) —
 * the signature Lusion cursor feel. A crisp dot marks the exact pointer.
 */
export default function Cursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const variantRef = useRef<"default" | "hover" | "drag">("default");
  const variant = useApp((s) => s.cursorVariant);
  useEffect(() => {
    variantRef.current = variant;
  }, [variant]);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const canvas = canvasRef.current;
    const dot = dotRef.current;
    if (!canvas || !dot) return;
    document.documentElement.classList.add("has-custom-cursor");

    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    let mx = w / 2;
    let my = h / 2;
    let fx = mx;
    let fy = my;
    let pfx = mx;
    let pfy = my;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
    };

    const blob = (x: number, y: number, r: number, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = () => {
      // ease the follower toward the pointer
      fx += (mx - fx) * 0.22;
      fy += (my - fy) * 0.22;
      const vx = fx - pfx;
      const vy = fy - pfy;
      const speed = Math.hypot(vx, vy);

      // fade the existing trail (transparent canvas -> only the trail blends)
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, w, h);

      // draw a continuous smear from the previous to the current position
      ctx.globalCompositeOperation = "lighter";
      const hover = variantRef.current === "hover";
      const drag = variantRef.current === "drag";
      const baseR = (hover ? 28 : drag ? 10 : 16) + Math.min(speed * 0.65, 24);
      const steps = Math.max(1, Math.ceil(speed / 4));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        blob(pfx + vx * t, pfy + vy * t, baseR, 0.2);
      }

      pfx = fx;
      pfy = fy;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100] hidden md:block">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ mixBlendMode: "difference" }}
      />
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full mix-blend-difference"
        style={{ background: "#fff" }}
      />
    </div>
  );
}
