"use client";

import dynamic from "next/dynamic";
import { useApp } from "@/lib/store";

// WebGL must never render on the server — load the canvas client-only.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

export default function CanvasRoot() {
  const webglOk = useApp((s) => s.webglOk);
  // If the device can't do WebGL we render nothing; sections show static
  // fallbacks (posters/gradients) instead.
  if (!webglOk) return null;
  return <SceneCanvas />;
}
