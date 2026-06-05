"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";

// (state import kept minimal; only `dark` is needed)

export default function Header() {
  const { menuOpen, setMenuOpen, setCursorVariant } = useApp();
  const [dark, setDark] = useState(false);

  // Detect when over a dark section to flip header color.
  useEffect(() => {
    const onScroll = () => {
      const els = document.querySelectorAll<HTMLElement>("[data-theme='dark']");
      let over = false;
      const probe = 40; // header line
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom >= probe) over = true;
      });
      setDark(over);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const fg = dark ? "#f3f1fb" : "#0a0a0c";
  const hover = () => setCursorVariant("hover");
  const leave = () => setCursorVariant("default");

  return (
    <header
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-5 py-4 md:px-10 md:py-6"
      style={{ color: fg, transition: "color 0.5s var(--easing)" }}
    >
      <a
        href="/"
        onMouseEnter={hover}
        onMouseLeave={leave}
        className="font-display text-lg font-bold tracking-tight md:text-xl"
        style={{ letterSpacing: "-0.01em" }}
      >
        LUSION
      </a>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onMouseEnter={hover}
          onMouseLeave={leave}
          aria-label="Toggle sound"
          className="hidden h-9 w-9 items-center justify-center rounded-full md:flex"
          style={{
            background: dark ? "rgba(255,255,255,.1)" : "rgba(10,10,12,.07)",
          }}
        >
          <span style={{ width: 12, height: 1, background: fg }} />
        </button>

        <a
          href="/demo#contact"
          onMouseEnter={hover}
          onMouseLeave={leave}
          className="pill hidden md:inline-flex"
          style={{ background: fg, color: dark ? "#0a0a0c" : "#f3f1fb" }}
        >
          Let&apos;s talk <span style={{ opacity: 0.6 }}>•</span>
        </a>

        <button
          onMouseEnter={hover}
          onMouseLeave={leave}
          onClick={() => setMenuOpen(!menuOpen)}
          className="pill"
          aria-expanded={menuOpen}
          aria-label="Menu"
          style={{
            background: dark ? "rgba(255,255,255,.12)" : "rgba(10,10,12,.07)",
            color: fg,
          }}
        >
          {menuOpen ? "Close" : "Menu"}
          <span style={{ opacity: 0.6 }}>{menuOpen ? "×" : "••"}</span>
        </button>
      </div>
    </header>
  );
}
