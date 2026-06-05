"use client";

import { useMemo, useRef } from "react";
import { Vector2 } from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import JackPit from "@/components/sections/hero/JackPit";
import { MouseDisplacementEffect } from "@/lib/three/MouseDisplacementEffect";
import { useApp } from "@/lib/store";
import { dprCap } from "@/lib/capabilities";

/**
 * The hero gets its **own** transparent canvas (instead of riding the shared
 * `<View>` port) so it can run an `EffectComposer` for the signature
 * mouse-displacement ripple — postprocessing doesn't compose cleanly inside a
 * drei `<View>`. Everything stays scoped to the hero section.
 */
function HeroDisplacement() {
  const size = useThree((s) => s.size);
  const effect = useMemo(() => new MouseDisplacementEffect({ radius: 0.26 }), []);

  const prev = useRef(new Vector2(0.5, 0.5));
  const vel = useRef(new Vector2(0, 0));
  const mouse = useRef(new Vector2(0.5, 0.5));

  useFrame((state) => {
    effect.aspect = size.width / Math.max(1, size.height);

    // pointer → uv (0..1), y up matches the input texture
    const ux = state.pointer.x * 0.5 + 0.5;
    const uy = state.pointer.y * 0.5 + 0.5;

    // this-frame motion → eased, decaying drag velocity
    const dx = ux - prev.current.x;
    const dy = uy - prev.current.y;
    prev.current.set(ux, uy);
    vel.current.x += (dx * 2.2 - vel.current.x) * 0.25;
    vel.current.y += (dy * 2.2 - vel.current.y) * 0.25;
    vel.current.multiplyScalar(0.9);
    const max = 0.09;
    const vl = vel.current.length();
    if (vl > max) vel.current.multiplyScalar(max / vl);
    effect.vel.copy(vel.current);

    // eased displacement centre + speed-scaled radial lens
    mouse.current.x += (ux - mouse.current.x) * 0.2;
    mouse.current.y += (uy - mouse.current.y) * 0.2;
    effect.mouse.copy(mouse.current);
    effect.strength = Math.min(vl * 1.5, 0.05);
  });

  return (
    <EffectComposer>
      <primitive object={effect} />
    </EffectComposer>
  );
}

export default function HeroCanvas() {
  const isMobile = useApp((s) => s.isMobile);
  const reducedMotion = useApp((s) => s.reducedMotion);
  // displacement is desktop-only and respects reduced-motion
  const post = !isMobile && !reducedMotion;

  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={dprCap(isMobile)}
      style={{ position: "absolute", inset: 0 }}
    >
      <JackPit mobile={isMobile} />
      {post && <HeroDisplacement />}
    </Canvas>
  );
}
