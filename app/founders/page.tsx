import type { Metadata } from "next";
import Link from "next/link";
import CornerMarks from "@/components/layout/CornerMarks";

export const metadata: Metadata = {
  title: "About us — Overnight Success",
  description:
    "Letters from the founders — Bernard Lee and Ludovic Grandclement: pragmatic engineering and practical, governed AI, built to solve real problems.",
};

function Letter({ children }: { children: React.ReactNode }) {
  return (
    <article
      className="relative flex flex-col rounded-[20px] p-8 md:p-10"
      style={{
        background: "var(--bg-elevated)",
        color: "var(--ink)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
      }}
    >
      {children}
      <CornerMarks color="rgba(10,10,12,.25)" inset={16} />
    </article>
  );
}

export default function FoundersPage() {
  return (
    <main
      data-theme="dark"
      className="relative z-10 min-h-screen w-full px-5 py-24 md:px-10 md:py-32"
      style={{ background: "var(--night)", color: "var(--bg-elevated)" }}
    >
      <div className="mx-auto max-w-6xl">
        <Link
          href="/#letter"
          className="inline-flex font-mono text-xs uppercase tracking-[0.3em] text-white/60 transition-colors hover:text-white"
        >
          ← Back
        </Link>

        <p className="mt-10 font-mono text-xs uppercase tracking-[0.3em] text-white/50">
          Letters from the founders
        </p>
        <h1 className="mt-6 font-display text-[12vw] font-medium leading-[0.95] tracking-tight md:text-[4.5vw]">
          About us
        </h1>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
          <Letter>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-soft">
              Engineering &amp; technical delivery
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight md:text-4xl">
              Bernard Lee
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed md:text-lg">
              <p>
                Bernard Lee is an engineer with many years building and leading
                technical projects across a wide range of technologies. He has
                shipped products end to end — from low-level systems and data
                infrastructure to web platforms and real-time, interactive 3D
                experiences.
              </p>
              <p>
                He enjoys turning ambiguous problems into reliable, well-crafted
                software, and cares about pragmatic engineering, strong
                fundamentals, and building the teams and tools that let good ideas
                ship. Whatever the stack, the goal is the same: solve the real
                problem, and solve it well.
              </p>
            </div>
          </Letter>

          <Letter>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink-soft">
              AI strategy &amp; transformation
            </p>
            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight md:text-4xl">
              Ludovic Grandclement
            </h2>
            <div className="mt-6 space-y-5 text-base leading-relaxed md:text-lg">
              <p>
                Ludovic works at the intersection of AI, finance, and
                institutional transformation. Over the past decade, he has helped
                banks, insurers, airlines, and central banking teams move from
                ideas and experiments to real technology capabilities — spanning
                data platforms, supervisory technology, automation, and AI.
              </p>
              <p>
                Today, his focus is on making AI useful, safe, and scalable in
                highly regulated environments. His work sits in the messy middle
                between strategy and execution: where ambitious ideas meet legacy
                systems, risk controls, stakeholder politics, and delivery
                reality. He helps turn that complexity into practical AI
                capabilities — shaping the platforms, governance, teams, and
                adoption paths that allow people to trust, use, and build on them.
              </p>
            </div>
          </Letter>
        </div>
      </div>
    </main>
  );
}
