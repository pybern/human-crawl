import { Effect } from "postprocessing";
import { Uniform } from "three";

/**
 * Radial / zoom blur toward the screen centre — the "warp" smear for the
 * wormhole fly-through. Samples a handful of taps from each pixel toward the
 * centre; `strength` (0 = off) is ramped with scroll speed by the caller.
 */
const fragment = /* glsl */ `
  uniform float uStrength;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 dir = vec2(0.5) - uv;
    vec4 sum = inputColor;
    for (int i = 1; i <= 8; i++) {
      float t = float(i) / 8.0;
      sum += texture2D(inputBuffer, uv + dir * t * uStrength);
    }
    outputColor = sum / 9.0;
  }
`;

export class RadialBlurEffect extends Effect {
  constructor({ strength = 0 }: { strength?: number } = {}) {
    super("RadialBlurEffect", fragment, {
      uniforms: new Map<string, Uniform>([["uStrength", new Uniform(strength)]]),
    });
  }

  get strength(): number {
    return this.uniforms.get("uStrength")!.value as number;
  }
  set strength(v: number) {
    this.uniforms.get("uStrength")!.value = v;
  }
}
