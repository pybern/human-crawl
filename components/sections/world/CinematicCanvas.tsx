"use client";

import { useMemo } from "react";
import { Vector2 } from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import CinematicJourney from "@/components/sections/world/CinematicJourney";
import FirstFrameSignal from "@/components/canvas/FirstFrameSignal";
import { RadialBlurEffect } from "@/lib/three/RadialBlurEffect";
import { cinema } from "@/lib/cinema";
import { useApp } from "@/lib/store";
import { dprCap } from "@/lib/capabilities";

const smooth = (x: number) => {
  const c = Math.min(Math.max(x, 0), 1);
  return c * c * (3 - 2 * c);
};

/** Drives the radial "warp" blur from scroll speed (ramps in, eases out at CTA). */
function WarpPost() {
  const effect = useMemo(() => new RadialBlurEffect({ strength: 0 }), []);
  useFrame(() => {
    const p = cinema.progress;
    const ramp = smooth((p - 0.1) / 0.5);
    const cta = smooth((p - 0.82) / 0.13);
    effect.strength = 0.16 * ramp * (1 - cta);
  });
  return <primitive object={effect} />;
}

/**
 * Dedicated full-viewport canvas for the /new-world route. Hosts the cinematic
 * scene under a full post-processing stack — bloom (glowing crystals / LED /
 * sparkles), chromatic aberration (edge fringing), depth-of-field, and a
 * vignette — which the shared `<View>` canvas can't do. Post intensity scales
 * down on mobile and respects reduced-motion.
 */
export default function CinematicCanvas({
  paused = false,
  wormhole = false,
}: {
  paused?: boolean;
  wormhole?: boolean;
}) {
  const isMobile = useApp((s) => s.isMobile);
  const reducedMotion = useApp((s) => s.reducedMotion);

  const caOffset = useMemo(
    () => new Vector2(wormhole ? 0.004 : 0.0016, wormhole ? 0.004 : 0.0016),
    [wormhole]
  );

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
      <FirstFrameSignal />
      <CinematicJourney mobile={isMobile} wormhole={wormhole} />

      <EffectComposer multisampling={isMobile ? 0 : 4}>
        <Bloom
          intensity={(isMobile ? 0.7 : 1.1) * (wormhole ? 1.4 : 1)}
          luminanceThreshold={0.18}
          luminanceSmoothing={0.5}
          mipmapBlur
        />
        {wormhole && !reducedMotion ? <WarpPost /> : <></>}
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
