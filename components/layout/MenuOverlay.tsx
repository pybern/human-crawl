"use client";

import { useEffect } from "react";
import { useApp } from "@/lib/store";

const LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Projects", href: "/demo#work" },
  { label: "Contact", href: "/demo#contact" },
  { label: "Labs", href: "#" },
];

export default function MenuOverlay() {
  const { menuOpen, setMenuOpen, setCursorVariant } = useApp();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "overflow",
      menuOpen ? "hidden" : ""
    );
  }, [menuOpen]);

  return (
    <div
      data-theme="dark"
      aria-hidden={!menuOpen}
      className="fixed inset-0 z-[55] flex flex-col justify-center px-6 md:px-16"
      style={{
        background: "var(--night)",
        color: "var(--bg-elevated)",
        clipPath: menuOpen
          ? "inset(0% 0% 0% 0%)"
          : "inset(0% 0% 100% 0%)",
        transition: "clip-path 0.8s var(--easing)",
        pointerEvents: menuOpen ? "auto" : "none",
      }}
    >
      <nav className="flex flex-col gap-1">
        {LINKS.map((l, i) => (
          <a
            key={l.label}
            href={l.href}
            onClick={() => setMenuOpen(false)}
            onMouseEnter={() => setCursorVariant("hover")}
            onMouseLeave={() => setCursorVariant("default")}
            className="font-display font-medium leading-[0.95] tracking-tight"
            style={{
              fontSize: "clamp(2.5rem, 9vw, 7rem)",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(40px)",
              transition: `opacity 0.6s ${0.2 + i * 0.06}s var(--easing), transform 0.6s ${
                0.2 + i * 0.06
              }s var(--easing)`,
            }}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div
        className="mt-12 flex flex-col gap-1 text-sm opacity-70 md:mt-16"
        style={{
          opacity: menuOpen ? 0.7 : 0,
          transition: "opacity 0.6s 0.5s var(--easing)",
        }}
      >
        <span className="font-mono uppercase tracking-widest text-xs">
          Subscribe to our newsletter
        </span>
        <span>hello@lusion.co</span>
      </div>
    </div>
  );
}
