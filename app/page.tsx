import Hero from "@/components/sections/Hero";
import BroughtToLife from "@/components/sections/BroughtToLife";
import PlayReel from "@/components/sections/PlayReel";
import FeaturedWork from "@/components/sections/FeaturedWork";

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <BroughtToLife />
      <PlayReel />
      <FeaturedWork />

      {/* Placeholder sections (built out in later phases) */}
      <section
        data-theme="dark"
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--night)", color: "var(--bg-elevated)" }}
      >
        <h2 className="font-display text-[8vw]">Step into a new world</h2>
      </section>

      <section
        id="contact"
        data-theme="dark"
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--night)", color: "var(--bg-elevated)" }}
      >
        <h2 className="font-display text-[8vw]">Let&apos;s work together!</h2>
      </section>
    </main>
  );
}
