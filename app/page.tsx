import type { Metadata } from "next";
import NewWorldExperience from "@/components/sections/world/NewWorldExperience";

export const metadata: Metadata = {
  title: "Overnight Success — Let's build what's next",
  description:
    "Push the frontier, ship it responsibly. AI & tech — practical, governed, real. A cinematic landing built with React Three Fiber + post-processing.",
};

export default function Home() {
  return <NewWorldExperience />;
}
