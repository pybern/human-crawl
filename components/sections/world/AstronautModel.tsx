"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

const MODEL = "/models/astronaut.glb";

/**
 * High-fidelity astronaut — the CC-BY "Astronaut" GLB (Poly by Google, via
 * model-viewer shared assets; see public/models/CREDITS.md). Self-contained
 * binary glTF (embedded texture, no Draco) so it loads offline/in CI.
 *
 * The raw model is normalised to a target height and recentred so the parent
 * `<group>` can position it like the old procedural astronaut. `headAnchor`
 * (local space, near the visor) is exposed so the CTA LED face can sit on it.
 */
export const ASTRONAUT_HEIGHT = 3.0;

export function useAstronautHeadAnchor(): THREE.Vector3 {
  // recomputed lazily; defaults are filled after the model loads
  return useMemo(() => new THREE.Vector3(0, ASTRONAUT_HEIGHT * 0.34, 0.32), []);
}

export default function AstronautModel() {
  const { scene } = useGLTF(MODEL);

  const model = useMemo(() => {
    const root = scene.clone(true);
    // normalise: scale to ASTRONAUT_HEIGHT, recentre on the bbox centre
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = ASTRONAUT_HEIGHT / Math.max(size.y, 1e-3);
    root.scale.setScalar(s);
    // after scaling, recentre using the scaled centre
    root.position.set(-center.x * s, -center.y * s, -center.z * s);

    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = false;
        m.receiveShadow = false;
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 1.1;
      }
    });
    return root;
  }, [scene]);

  // wrap so the normalised model can be parented/positioned by the journey
  return <primitive object={model} />;
}

useGLTF.preload(MODEL);

export function disposeAstronaut() {
  useGLTF.clear(MODEL);
}

// keep the dispose helper referenced for tree-shakers / future cleanup
void disposeAstronaut;
