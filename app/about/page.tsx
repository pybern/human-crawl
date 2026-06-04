import Link from "next/link";

export const metadata = {
  title: "About — LUSION (reproduction)",
};

export default function AboutPage() {
  return (
    <main
      className="relative z-10 min-h-screen w-full px-5 py-32 md:px-10 md:py-40"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-soft">
          About the studio
        </p>
        <h1 className="mt-6 font-display text-[12vw] font-medium leading-[0.95] tracking-tight md:text-[6vw]">
          Where creative ideas become immersive experiences
        </h1>
        <p className="mt-10 max-w-2xl text-xl leading-relaxed text-ink-soft md:text-2xl">
          We combine design, motion, 3D and development to create digital
          experiences that feel visually striking and technically seamless. This
          page is a reproduction of the lusion.co experience, built with Next.js,
          React Three Fiber and GSAP.
        </p>
        <Link
          href="/"
          className="pill mt-12 inline-flex"
          style={{ background: "var(--ink)", color: "var(--bg-elevated)" }}
        >
          ← Back home
        </Link>
      </div>
    </main>
  );
}
