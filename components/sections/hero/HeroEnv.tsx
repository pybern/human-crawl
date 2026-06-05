"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Hero-only studio environment for the jack pit. Kept separate from the shared
 * `StudioEnv` (used by the ribbon + astronaut) so we can keep the hero palette
 * true — neutral white key + rims — without recolouring the other sections.
 * Self-contained Lightformers → no external HDR (works offline / in CI).
 */
export default function HeroEnv({ intensity = 0.85 }: { intensity?: number }) {
  const k = intensity * 2;
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#0a0a0e"]} />
      {/* big neutral key soft box → bright window highlight + crisp streaks */}
      <Lightformer
        intensity={2.6 * k}
        position={[0, 3, 3]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
        color="#ffffff"
      />
      {/* neutral rims (white, so cobalt stays cobalt and whites stay white) */}
      <Lightformer
        intensity={1.4 * k}
        position={[-4, 1, 1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[6, 6, 1]}
        color="#f3f4f8"
      />
      <Lightformer
        intensity={1.2 * k}
        position={[4, 1, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[6, 6, 1]}
        color="#ffffff"
      />
      {/* thin bright streak for the signature crisp speculars */}
      <Lightformer
        form="ring"
        intensity={2.2 * k}
        position={[2, 3, 4]}
        scale={[3, 3, 1]}
        color="#ffffff"
      />
    </Environment>
  );
}
