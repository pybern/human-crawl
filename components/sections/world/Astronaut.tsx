"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * A stylised low-poly astronaut built entirely from primitives — no external
 * model, so it loads instantly, renders reliably inside a <View>, and carries
 * no licensing concerns (swap for a GLTF later if desired).
 *
 * `smiley` turns the visor into the glowing LED face used in the CTA section.
 */
export default function Astronaut({
  smiley = false,
}: {
  smiley?: boolean;
}) {
  const suit = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#eef0f6",
        roughness: 0.55,
        metalness: 0.05,
        clearcoat: 0.4,
        clearcoatRoughness: 0.4,
      }),
    []
  );
  const dark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#15161c",
        roughness: 0.4,
        metalness: 0.6,
      }),
    []
  );
  const visor = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: smiley ? "#02040a" : "#0a0c14",
        roughness: 0.08,
        metalness: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.4,
      }),
    [smiley]
  );
  const smileyTex = useMemo(() => (smiley ? makeSmiley() : null), [smiley]);

  return (
    <group>
      {/* Helmet */}
      <mesh material={suit} position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.52, 32, 32]} />
      </mesh>
      {/* Visor */}
      <mesh material={visor} position={[0, 1.12, 0.12]} scale={[0.92, 0.78, 0.9]}>
        <sphereGeometry args={[0.46, 32, 32]} />
      </mesh>
      {smiley && smileyTex && (
        <mesh position={[0, 1.14, 0.46]}>
          <planeGeometry args={[0.5, 0.34]} />
          <meshBasicMaterial
            map={smileyTex}
            transparent
            toneMapped={false}
          />
        </mesh>
      )}

      {/* Torso */}
      <mesh material={suit} position={[0, 0.25, 0]}>
        <capsuleGeometry args={[0.42, 0.6, 8, 16]} />
      </mesh>
      {/* Backpack */}
      <mesh material={dark} position={[0, 0.35, -0.36]}>
        <boxGeometry args={[0.6, 0.7, 0.3]} />
      </mesh>

      {/* Arms */}
      <group position={[0.46, 0.45, 0]} rotation={[0, 0, 0.5]}>
        <mesh material={suit}>
          <capsuleGeometry args={[0.15, 0.55, 6, 12]} />
        </mesh>
      </group>
      <group position={[-0.46, 0.45, 0]} rotation={[0, 0, -0.5]}>
        <mesh material={suit}>
          <capsuleGeometry args={[0.15, 0.55, 6, 12]} />
        </mesh>
      </group>

      {/* Legs */}
      <group position={[0.2, -0.55, 0]} rotation={[0, 0, 0.12]}>
        <mesh material={suit}>
          <capsuleGeometry args={[0.17, 0.6, 6, 12]} />
        </mesh>
      </group>
      <group position={[-0.2, -0.55, 0]} rotation={[0, 0, -0.12]}>
        <mesh material={suit}>
          <capsuleGeometry args={[0.17, 0.6, 6, 12]} />
        </mesh>
      </group>

      {/* Chest control panel */}
      <mesh material={dark} position={[0, 0.3, 0.4]}>
        <boxGeometry args={[0.3, 0.2, 0.06]} />
      </mesh>
    </group>
  );
}

/** Procedurally draw a glowing LED "smiley" face to a canvas texture. */
export function makeSmiley(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#02040a";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#7CFFB2";
  ctx.shadowColor = "#7CFFB2";
  ctx.shadowBlur = 18;
  // eyes
  for (const ex of [88, 168]) {
    ctx.fillRect(ex - 12, 96, 24, 40);
  }
  // smile (row of dots)
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (0.15 + (i / 6) * 0.7);
    const x = 128 + Math.cos(a) * 70;
    const y = 150 + Math.sin(a) * 36;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
