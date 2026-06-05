import type { Metadata } from "next";
import Hero from "@/components/sections/Hero";
import BroughtToLife from "@/components/sections/BroughtToLife";
import PlayReel from "@/components/sections/PlayReel";
import FeaturedWork from "@/components/sections/FeaturedWork";
import NewWorld from "@/components/sections/NewWorld";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "LUSION — 3D & Interactive Web Studio (reproduction)",
  description:
    "The full multi-section reproduction of the lusion.co site — physics hero, kinetic type, play reel, featured work, the cinematic journey and footer.",
};

export default function DemoHome() {
  return (
    <main className="relative">
      <Hero />
      <BroughtToLife />
      <PlayReel />
      <FeaturedWork />
      <NewWorld />
      <Footer />
    </main>
  );
}
