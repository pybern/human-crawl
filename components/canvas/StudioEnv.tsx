"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Self-contained studio environment for glossy reflections — built from
 * Lightformers so it needs NO external HDR file (works offline / in CI and is
 * deterministic). Gives the jacks their bright window highlights.
 */
export default function StudioEnv({
  intensity = 0.6,
}: {
  intensity?: number;
}) {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#101018"]} />
      {/* key soft box */}
      <Lightformer
        intensity={2.2 * intensity * 2}
        position={[0, 3, 2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[8, 8, 1]}
        color="#ffffff"
      />
      {/* cool rim from the left */}
      <Lightformer
        intensity={1.6 * intensity * 2}
        position={[-4, 1, 1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[6, 6, 1]}
        color="#9aa6ff"
      />
      {/* warm-ish rim from the right */}
      <Lightformer
        intensity={1.2 * intensity * 2}
        position={[4, 1, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[6, 6, 1]}
        color="#dfe3ff"
      />
      {/* thin streak highlights for crisp speculars */}
      <Lightformer
        form="ring"
        intensity={2 * intensity * 2}
        position={[2, 3, 4]}
        scale={[3, 3, 1]}
        color="#ffffff"
      />
    </Environment>
  );
}
