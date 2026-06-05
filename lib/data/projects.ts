export type Project = {
  title: string;
  tags: string[];
  /** looping hover video (CC0 placeholder, swap for real reels later) */
  video: string;
  href?: string;
};

export const PROJECTS: Project[] = [
  {
    title: "Enterprise AI Platform",
    tags: ["AI", "Platform", "MLOps"],
    video: "/videos/p1.mp4",
  },
  {
    title: "RAG Knowledge Engine",
    tags: ["AI", "RAG", "Search"],
    video: "/videos/p2.mp4",
  },
  {
    title: "Model-as-a-Service",
    tags: ["AI", "Infra", "MLOps"],
    video: "/videos/p3.mp4",
  },
  {
    title: "Realtime Web Worlds",
    tags: ["Web", "3D", "WebGL"],
    video: "/videos/p4.mp4",
  },
  {
    title: "Responsible AI Governance",
    tags: ["AI", "Governance", "Web"],
    video: "/videos/p5.mp4",
  },
  {
    title: "Vector Search Lab",
    tags: ["Research", "Vector DB", "AI"],
    video: "/videos/p6.mp4",
  },
];
