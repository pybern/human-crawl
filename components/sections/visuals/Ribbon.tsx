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
    const pts: THREE.Vector3[] = [];
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.sin(t * 1.0) * 2.2,
          Math.cos(t * 1.5) * 1.4,
          Math.sin(t * 2.0) * 1.2
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.6);
    return new THREE.TubeGeometry(curve, 240, 0.34, 18, true);
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
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} />
      <directionalLight position={[-5, -2, 2]} intensity={0.7} color="#9aa6ff" />
      <group ref={group}>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            color="#1a25ff"
            metalness={0.2}
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1.2}
          />
        </mesh>
      </group>
    </>
  );
}
