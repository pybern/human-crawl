"use client";

import { useMemo } from "react";
import { Vector2 } from "three";
import { Canvas } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import CinematicJourney from "@/components/sections/world/CinematicJourney";
import { useApp } from "@/lib/store";
import { dprCap } from "@/lib/capabilities";

/**
 * Dedicated full-viewport canvas for the /new-world route. Hosts the cinematic
 * scene under a full post-processing stack — bloom (glowing crystals / LED /
 * sparkles), chromatic aberration (edge fringing), depth-of-field, and a
 * vignette — which the shared `<View>` canvas can't do. Post intensity scales
 * down on mobile and respects reduced-motion.
 */
export default function CinematicCanvas({ paused = false }: { paused?: boolean }) {
  const isMobile = useApp((s) => s.isMobile);
  const reducedMotion = useApp((s) => s.reducedMotion);

  const caOffset = useMemo(() => new Vector2(0.0016, 0.0016), []);

  return (
    <Canvas
      // Stop rendering the heavy scene + post stack while it's hidden behind an
      // overlay (e.g. the founders letter) — saves a lot of GPU/battery.
      frameloop={paused ? "never" : "always"}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={dprCap(isMobile)}
      style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
    >
      <color attach="background" args={["#05060a"]} />
      <CinematicJourney mobile={isMobile} />

      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom
          intensity={isMobile ? 0.7 : 1.1}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.5}
          mipmapBlur
        />
        {/* DOF is the heaviest pass — desktop + full-motion only */}
        {!isMobile && !reducedMotion ? (
          <DepthOfField focusDistance={0.012} focalLength={0.05} bokehScale={3.2} />
        ) : (
          <></>
        )}
        <ChromaticAberration offset={caOffset} radialModulation modulationOffset={0.35} />
        <Vignette eskil={false} offset={0.28} darkness={0.92} />
      </EffectComposer>
    </Canvas>
  );
}
