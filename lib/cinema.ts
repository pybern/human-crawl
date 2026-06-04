/**
 * Shared scroll progress for the pinned cinematic section.
 * Updated by a GSAP ScrollTrigger (onUpdate) and read inside useFrame — kept
 * outside React state so per-frame scroll updates don't trigger re-renders.
 */
export const cinema = { progress: 0 };
