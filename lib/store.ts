"use client";

import { create } from "zustand";

export type AppState = {
  /** Asset/WebGL load progress 0..100 (drives the preloader). */
  progress: number;
  setProgress: (p: number) => void;

  /** True once the preloader reveal has finished. */
  ready: boolean;
  setReady: (v: boolean) => void;

  /** Normalised pointer in NDC-ish space (-1..1), y up. */
  pointer: { x: number; y: number };
  setPointer: (x: number, y: number) => void;

  /** Raw pointer in pixels (for the cursor / DOM effects). */
  pointerPx: { x: number; y: number };
  setPointerPx: (x: number, y: number) => void;

  /** Device / preference flags resolved on the client. */
  isMobile: boolean;
  setIsMobile: (v: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  webglOk: boolean;
  setWebglOk: (v: boolean) => void;

  /** Cursor hover hint (e.g. when over interactive elements). */
  cursorVariant: "default" | "hover" | "drag";
  setCursorVariant: (v: AppState["cursorVariant"]) => void;

  /** Fullscreen menu state. */
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
};

export const useApp = create<AppState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),

  ready: false,
  setReady: (ready) => set({ ready }),

  pointer: { x: 0, y: 0 },
  setPointer: (x, y) => set({ pointer: { x, y } }),

  pointerPx: { x: 0, y: 0 },
  setPointerPx: (x, y) => set({ pointerPx: { x, y } }),

  isMobile: false,
  setIsMobile: (isMobile) => set({ isMobile }),
  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  webglOk: true,
  setWebglOk: (webglOk) => set({ webglOk }),

  cursorVariant: "default",
  setCursorVariant: (cursorVariant) => set({ cursorVariant }),

  menuOpen: false,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
}));
