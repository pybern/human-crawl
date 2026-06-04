import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Builds the "jack" geometry — three perpendicular capped cylinders meeting at
 * a central sphere, forming the 6-armed plus/cross silhouette of the Lusion
 * logo motif. Returned as a single merged BufferGeometry so each physics body
 * is one draw call.
 */
export function createJackGeometry(arm = 1.0, radius = 0.2): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const cyl = () => new THREE.CylinderGeometry(radius, radius, arm, 20, 1, false);

  // Y axis (default orientation)
  parts.push(cyl());
  // X axis
  const gx = cyl();
  gx.rotateZ(Math.PI / 2);
  parts.push(gx);
  // Z axis
  const gz = cyl();
  gz.rotateX(Math.PI / 2);
  parts.push(gz);

  // Center joint
  parts.push(new THREE.SphereGeometry(radius * 1.35, 20, 16));

  // Decorative rims at each of the 6 arm tips for the "tube end" read.
  const half = arm / 2;
  const tips: Array<[number, number, number, "x" | "y" | "z"]> = [
    [0, half, 0, "y"],
    [0, -half, 0, "y"],
    [half, 0, 0, "x"],
    [-half, 0, 0, "x"],
    [0, 0, half, "z"],
    [0, 0, -half, "z"],
  ];
  for (const [x, y, z, axis] of tips) {
    const rim = new THREE.TorusGeometry(radius * 0.92, radius * 0.22, 8, 18);
    if (axis === "x") rim.rotateY(Math.PI / 2);
    if (axis === "y") rim.rotateX(Math.PI / 2);
    rim.translate(x, y, z);
    parts.push(rim);
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

/** Lusion-ish jack palette. */
export const JACK_COLORS = [
  "#1a25ff", // cobalt
  "#1a25ff",
  "#f3f3ff", // white
  "#f3f3ff",
  "#0b0b12", // near black
  "#aab0c6", // cool grey
];
