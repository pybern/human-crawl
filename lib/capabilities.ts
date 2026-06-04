/** Client-only capability + preference detection helpers. */

export function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export function detectMobile(): boolean {
  if (typeof window === "undefined") return false;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  return Boolean(coarse || narrow);
}

export function detectReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Device-pixel-ratio cap that keeps heavy WebGL affordable. */
export function dprCap(isMobile: boolean): [number, number] {
  return isMobile ? [1, 1.5] : [1, 2];
}
