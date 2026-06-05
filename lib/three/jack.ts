import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Builds the "jack" geometry the way the real lusion.co hero reads it (see
 * `docs/reference/desktop/hero_interact_*.jpg`): three perpendicular **thick,
 * hollow, open-ended tubes** crossing at the centre, so you can see straight
 * down each bore. Short chunky arms (tip-to-tip ≈ 2× the outer diameter), with
 * a small beveled rim for crisp speculars and a centre plug that fills the
 * junction (and stops you seeing through to the background).
 *
 * Returned as one merged BufferGeometry so each instance is a single draw call
 * through the hero's InstancedMesh.
 *
 * @param arm     tip-to-tip length of each tube (tip sits at ±arm/2 — keeps the
 *                sim's `radius = 0.5 * scale` collision approximation valid)
 * @param outerR  outer tube radius
 * @param innerR  bore (inner) radius — the visible hole
 */
export function createJackGeometry(
  arm = 1.0,
  outerR = 0.26,
  innerR = 0.13
): THREE.BufferGeometry {
  const h = arm / 2; // half length → tube end at ±h
  const c = Math.min(0.05, outerR * 0.22); // rim bevel
  const RADIAL = 32; // smooth tubes

  // One hollow tube along Y, made by revolving a closed wall cross-section.
  // Profile (radius, y): inner-top → outer-top (beveled) → down the outer wall
  // → outer-bottom (beveled) → inner-bottom → up the inner wall (closes loop).
  const tube = (): THREE.BufferGeometry => {
    const profile = [
      new THREE.Vector2(innerR, h),
      new THREE.Vector2(outerR - c, h),
      new THREE.Vector2(outerR, h - c),
      new THREE.Vector2(outerR, -h + c),
      new THREE.Vector2(outerR - c, -h),
      new THREE.Vector2(innerR, -h),
      new THREE.Vector2(innerR, h), // close the cross-section → inner wall
    ];
    return new THREE.LatheGeometry(profile, RADIAL);
  };

  const parts: THREE.BufferGeometry[] = [];

  // Y axis (native lathe orientation)
  parts.push(tube());
  // X axis
  const gx = tube();
  gx.rotateZ(Math.PI / 2);
  parts.push(gx);
  // Z axis
  const gz = tube();
  gz.rotateX(Math.PI / 2);
  parts.push(gz);

  // Centre plug: fills the cross junction so the three bores bottom out on a
  // solid core instead of showing the background through the middle.
  parts.push(new THREE.SphereGeometry(outerR * 1.12, 24, 18));

  const merged = mergeGeometries(parts, false);
  // Keep the lathe/sphere normals (radial outward on the walls → the crisp
  // vertical specular streaks seen on the reference); no recompute.
  return merged;
}

/**
 * Lusion-ish jack palette — deep cobalt, clean white, true black, cool grey.
 * Weighted toward cobalt/white with black & grey accents (matches the live
 * reference frames). Assigned at random per body.
 */
export const JACK_COLORS = [
  "#1226d2", // deep royal cobalt (less periwinkle under the glossy clearcoat)
  "#1226d2", // deep royal cobalt
  "#f4f4fb", // white
  "#f4f4fb", // white
  "#08080c", // near-black
  "#0a0a10", // near-black
  "#aeb4c7", // cool grey
];
