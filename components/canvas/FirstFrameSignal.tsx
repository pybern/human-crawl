"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useApp } from "@/lib/store";

/**
 * Flags the store the first time the canvas actually renders a frame, so the
 * preloader can wait until the scene is genuinely on screen before revealing
 * the page (instead of revealing on a timer while WebGL is still compiling).
 */
export default function FirstFrameSignal() {
  const setSceneReady = useApp((s) => s.setSceneReady);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    setSceneReady(true);
  });
  return null;
}
