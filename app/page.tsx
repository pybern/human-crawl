import Hero from "@/components/sections/Hero";
import BroughtToLife from "@/components/sections/BroughtToLife";
import PlayReel from "@/components/sections/PlayReel";
import FeaturedWork from "@/components/sections/FeaturedWork";
import NewWorld from "@/components/sections/NewWorld";
import LetsWork from "@/components/sections/LetsWork";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <BroughtToLife />
      <PlayReel />
      <FeaturedWork />
      <NewWorld />
      <LetsWork />
      <Footer />
    </main>
  );
}
