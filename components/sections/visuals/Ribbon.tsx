"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import StudioEnv from "@/components/canvas/StudioEnv";

/**
 * A glossy cobalt ribbon/tube flowing along a 3D curve, slowly rotating — the
 * fluid accent from Lusion's "Brought to Life" section.
 */
export default function Ribbon() {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    // A calm, flowing loop (gentle figure-8 with a little depth) rather than a
    // tangled knot — closer to the elegant cobalt ribbon on the reference.
    const pts: THREE.Vector3[] = [];
    const N = 16;
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.sin(t) * 2.2,
          Math.sin(t * 2) * 1.35,
          Math.cos(t) * 1.0
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.5);
    // thicker, glossy tube
    return new THREE.TubeGeometry(curve, 320, 0.42, 24, true);
  }, []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
      group.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.25;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault fov={42} position={[0, 0, 7]} />
      <StudioEnv intensity={0.7} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} />
      {/* neutral fill (was a heavy blue tint that pushed the ribbon periwinkle) */}
      <directionalLight position={[-5, -2, 2]} intensity={0.6} color="#dfe2ee" />
      <group ref={group}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            color="#1226d2"
            metalness={0.0}
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.08}
            envMapIntensity={1.15}
          />
        </mesh>
      </group>
    </>
  );
}
