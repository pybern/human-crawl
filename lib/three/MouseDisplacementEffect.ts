import { Effect } from "postprocessing";
import { Uniform, Vector2 } from "three";

/**
 * Signature lusion "mouse displacement": a 2D post pass that ripples / drags
 * the rendered hero pixels around the cursor. Implemented as a `mainUv` effect
 * (it offsets the UV used to sample the scene), so it composes cheaply with the
 * EffectComposer.
 *
 * - `uVel`  drags pixels in the direction the cursor is moving (the smear that
 *   reads as fluid displacement) — fed from the eased pointer velocity.
 * - `uStrength` adds a small radial lens bulge centred on the cursor.
 * - falloff is a gaussian of radius `uRadius`, aspect-corrected so it stays
 *   circular on a wide window.
 */
const fragment = /* glsl */ `
  uniform vec2  uMouse;
  uniform vec2  uVel;
  uniform float uRadius;
  uniform float uAspect;
  uniform float uStrength;

  void mainUv(inout vec2 uv) {
    vec2 d = uv - uMouse;
    d.x *= uAspect;
    float infl = exp(-dot(d, d) / (uRadius * uRadius));

    // drag the pixels along the cursor's motion (the fluid smear)
    uv -= uVel * infl;

    // a subtle radial lens for body
    float dist = length(d);
    if (dist > 1e-4) {
      vec2 dir = normalize(uv - uMouse);
      uv -= dir * infl * uStrength;
    }
  }
`;

export type MouseDisplacementOptions = {
  radius?: number;
  aspect?: number;
};

export class MouseDisplacementEffect extends Effect {
  constructor({ radius = 0.26, aspect = 1 }: MouseDisplacementOptions = {}) {
    super("MouseDisplacementEffect", fragment, {
      uniforms: new Map<string, Uniform>([
        ["uMouse", new Uniform(new Vector2(0.5, 0.5))],
        ["uVel", new Uniform(new Vector2(0, 0))],
        ["uRadius", new Uniform(radius)],
        ["uAspect", new Uniform(aspect)],
        ["uStrength", new Uniform(0)],
      ]),
    });
  }

  get mouse(): Vector2 {
    return this.uniforms.get("uMouse")!.value as Vector2;
  }
  get vel(): Vector2 {
    return this.uniforms.get("uVel")!.value as Vector2;
  }
  set aspect(v: number) {
    this.uniforms.get("uAspect")!.value = v;
  }
  set strength(v: number) {
    this.uniforms.get("uStrength")!.value = v;
  }
}
