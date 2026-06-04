export type Project = {
  title: string;
  tags: string[];
  /** looping hover video (CC0 placeholder, swap for real reels later) */
  video: string;
  href?: string;
};

export const PROJECTS: Project[] = [
  {
    title: "Devin AI",
    tags: ["Web", "Design", "Development", "3D"],
    video: "/videos/p1.mp4",
  },
  {
    title: "Porsche: Dream Machine",
    tags: ["Concept", "3D Illustration", "Mograph"],
    video: "/videos/p2.mp4",
  },
  {
    title: "Synthetic Human",
    tags: ["Web", "Design", "3D"],
    video: "/videos/p3.mp4",
  },
  {
    title: "Meta: Spatial Fusion",
    tags: ["Web", "Development", "3D"],
    video: "/videos/p4.mp4",
  },
  {
    title: "Choo Choo World",
    tags: ["Concept", "Game Design", "3D"],
    video: "/videos/p5.mp4",
  },
  {
    title: "Soda Experience",
    tags: ["AR", "Development", "3D"],
    video: "/videos/p6.mp4",
  },
];
