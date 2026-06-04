"use client";

import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useApp } from "@/lib/store";
import { dprCap } from "@/lib/capabilities";

/**
 * The single, persistent WebGL surface for the whole site.
 *
 * Sections render their 3D inside a drei `<View track={ref}>`; this canvas
 * draws every registered View, scissored to its tracked DOM element — i.e.
 * "3D mapped to the positions of HTML elements" (the Lusion approach), done
 * the idiomatic R3F way. The canvas itself is transparent and ignores pointer
 * events; each View receives events through its tracked element.
 */
export default function SceneCanvas() {
  const isMobile = useApp((s) => s.isMobile);

  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        stencil: true,
        powerPreference: "high-performance",
      }}
      dpr={dprCap(isMobile)}
      eventSource={
        typeof document !== "undefined" ? document.body : undefined
      }
      eventPrefix="client"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        // Transparent canvas layered ABOVE the DOM: drei <View> draws 3D only
        // where sections track an element; everywhere else it's see-through so
        // the HTML shows. Pointer events pass through to the DOM below (Views
        // still get events via eventSource + tracked element bounds).
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <View.Port />
    </Canvas>
  );
}
