import type { Metadata } from "next";
import NewWorldExperience from "@/components/sections/world/NewWorldExperience";

export const metadata: Metadata = {
  title: "Overnight Success — Let's build what's next",
  description:
    "Pushing frontiers responsibly — practical, governed and secured AI journeys. A cinematic landing built with React Three Fiber + post-processing.",
};

export default function Home() {
  return <NewWorldExperience />;
}
