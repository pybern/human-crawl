import type { Metadata } from "next";
import NewWorldExperience from "@/components/sections/world/NewWorldExperience";

export const metadata: Metadata = {
  title: "Step into a new world — LUSION (reproduction)",
  description:
    "A standalone, higher-detail cinematic: an astronaut flies through a glowing refractive crystal world toward a sticker-filled call to action. Built with React Three Fiber + post-processing.",
};

export default function NewWorldPage() {
  return <NewWorldExperience />;
}
