"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/lib/store";
import {
  detectMobile,
  detectReducedMotion,
  detectWebGL,
} from "@/lib/capabilities";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Single source of truth for client runtime: Lenis smooth scroll wired to one
 * rAF loop that also ticks GSAP ScrollTrigger, plus capability/preference
 * detection and global pointer tracking pushed into the store.
 */
export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const ready = useApp((s) => s.ready);
  const {
    setIsMobile,
    setReducedMotion,
    setWebglOk,
    setPointer,
    setPointerPx,
  } = useApp();

  // Capability + preference detection (runs once on mount).
  useEffect(() => {
    const mobile = detectMobile();
    const reduced = detectReducedMotion();
    const webgl = detectWebGL();
    setIsMobile(mobile);
    setReducedMotion(reduced);
    setWebglOk(webgl);

    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => setReducedMotion(mqMotion.matches);
    const onResize = () => setIsMobile(detectMobile());
    mqMotion.addEventListener?.("change", onMotion);
    window.addEventListener("resize", onResize);
    return () => {
      mqMotion.removeEventListener?.("change", onMotion);
      window.removeEventListener("resize", onResize);
    };
  }, [setIsMobile, setReducedMotion, setWebglOk]);

  // Lenis smooth scroll + unified rAF loop.
  useEffect(() => {
    const reduced = detectReducedMotion();
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: !reduced,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;
    // Start locked: keep the page pinned to the top while the preloader is up so
    // it can't scroll/overflow behind the loader. Released once `ready` flips.
    lenis.stop();
    // expose for debugging / e2e capture (harmless)
    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Keep GSAP's ticker in sync (lagSmoothing off for scroll-driven anims).
    gsap.ticker.lagSmoothing(0);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lock scrolling while the loader screen is showing (avoid overflow / a page
  // that's scrolled mid-way behind the preloader), then release once ready.
  useEffect(() => {
    const root = document.documentElement;
    const lenis = lenisRef.current;
    if (ready) {
      root.style.overflow = "";
      lenis?.start();
    } else {
      root.style.overflow = "hidden";
      window.scrollTo(0, 0);
      lenis?.stop();
    }
    return () => {
      root.style.overflow = "";
    };
  }, [ready]);

  // Global pointer tracking -> store (NDC + pixels).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      setPointer(x, y);
      setPointerPx(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [setPointer, setPointerPx]);

  return <>{children}</>;
}
