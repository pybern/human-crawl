"use client";

import { useState } from "react";
import Link from "next/link";
import CornerMarks from "@/components/layout/CornerMarks";
import { useApp } from "@/lib/store";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const setCursorVariant = useApp((s) => s.setCursorVariant);

  const toTop = () => {
    const lenis = (window as unknown as { lenis?: { scrollTo: (t: number) => void } })
      .lenis;
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative w-full" id="footer">
      {/* light contact block */}
      <div
        className="w-full px-5 py-16 md:px-10 md:py-20"
        style={{ background: "var(--bg-elevated)", color: "var(--ink)" }}
      >
        <div className="mb-12 font-display text-xl font-bold tracking-tight md:mb-16 md:text-2xl">
          Overnight Success
        </div>

        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <address className="not-italic text-sm leading-relaxed text-ink-soft">
            Suite 2<br />9 Marsh Street<br />Bristol, BS1 4AA<br />United Kingdom
          </address>

          <ul className="flex flex-col gap-1 text-sm text-ink-soft">
            {["Twitter / X", "Instagram", "LinkedIn"].map((s) => (
              <li key={s}>
                <a
                  href="#"
                  onMouseEnter={() => setCursorVariant("hover")}
                  onMouseLeave={() => setCursorVariant("default")}
                  className="transition-colors hover:text-ink"
                >
                  {s}
                </a>
              </li>
            ))}
            <li className="mt-6">Say hello</li>
            <li>
              <a href="mailto:hello@onstud.io" className="text-ink">
                hello@onstud.io
              </a>
            </li>
            <li className="mt-4">New business</li>
            <li>
              <a href="mailto:business@onstud.io" className="text-ink">
                business@onstud.io
              </a>
            </li>
          </ul>

          <div className="col-span-2">
            <h3 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
              Subscribe to
              <br />
              our newsletter
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes("@")) setSent(true);
              }}
              className="mt-6 flex items-center gap-2 rounded-full px-5 py-3"
              style={{ background: "var(--bg)" }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={sent ? "Thanks! ✓" : "Your email"}
                className="w-full bg-transparent text-ink outline-none placeholder:text-ink-soft"
                aria-label="Email address"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                onMouseEnter={() => setCursorVariant("hover")}
                onMouseLeave={() => setCursorVariant("default")}
                className="flex-none text-xl"
              >
                →
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 text-xs text-ink-soft md:flex-row md:items-center">
          <span>© 2026 Overnight Success</span>
          <span>R&amp;D: labs.onstud.io</span>
          <span>Built with ❤ using Next.js + R3F</span>
          <button
            onClick={toTop}
            onMouseEnter={() => setCursorVariant("hover")}
            onMouseLeave={() => setCursorVariant("default")}
            aria-label="Back to top"
            className="flex h-11 w-11 items-center justify-center rounded-full text-base"
            style={{ background: "var(--ink)", color: "var(--bg-elevated)" }}
          >
            ↑
          </button>
        </div>
      </div>

      {/* dark "About Us" next-page teaser */}
      <Link
        href="/about"
        data-theme="dark"
        onMouseEnter={() => setCursorVariant("hover")}
        onMouseLeave={() => setCursorVariant("default")}
        className="group relative block w-full px-5 py-12 md:px-10 md:py-16"
        style={{ background: "var(--night)", color: "var(--bg-elevated)" }}
      >
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.3em] text-white/60">
          Keep scrolling
          <br />
          to learn more
        </span>
        <div className="mt-6 flex items-center justify-between">
          <span className="font-display text-[14vw] font-medium leading-none tracking-tight transition-transform duration-500 group-hover:translate-x-2 md:text-[8vw]">
            About Us
          </span>
          {/* NEXT PAGE progress bar (fills on hover) — matches the reference */}
          <span className="hidden items-center gap-3 font-mono text-xs uppercase tracking-widest text-white/70 md:flex">
            Next page
            <span className="relative block h-[2px] w-28 overflow-hidden rounded-full bg-white/20">
              <span
                className="absolute inset-y-0 left-0 w-2/5 rounded-full transition-[width] duration-700 ease-out group-hover:w-full"
                style={{ background: "#b6ff3a" }}
              />
            </span>
            →
          </span>
        </div>
        <CornerMarks color="rgba(255,255,255,.3)" inset={20} />
      </Link>
    </footer>
  );
}
