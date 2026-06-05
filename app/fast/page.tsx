import type { Metadata } from "next";
import NewWorldExperience from "@/components/sections/world/NewWorldExperience";

export const metadata: Metadata = {
  title: "Fast — wormhole experiment",
  description: "Experimental high-intensity wormhole fly-through of the cinematic.",
};

// Same cinematic as the root page, with the intense wormhole fly-through enabled.
// Experimental sandbox — intentionally not linked from anywhere.
export default function FastPage() {
  return <NewWorldExperience wormhole />;
}
