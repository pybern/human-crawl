"use client";

import { useRef } from "react";
import { View, Float } from "@react-three/drei";
import CornerMarks from "@/components/layout/CornerMarks";
import { useApp } from "@/lib/store";

/**
 * Hero — Phase 1 scaffold.
 * Establishes the layout (heading + rounded dark "window" + scroll cue) and a
 * working drei <View> anchored to the window. Phase 2 swaps the placeholder
 * geometry for the Rapier "jack pit" + stencil mask + mouse displacement.
 */
export default function Hero() {
  const viewRef = useRef<HTMLDivElement>(null);
  const setCursorVariant = useApp((s) => s.setCursorVariant);

  return (
    <section
      id="top"
      className="relative w-full px-5 pt-24 md:px-10 md:pt-28"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="font-display text-[7vw] leading-[1.02] tracking-tight md:max-w-[60%] md:text-[2.6vw]">
          We create 3D visual storytelling and interactive web experiences that
          help brands stand out
        </div>
      </div>

      {/* The WebGL window */}
      <div className="mx-auto mt-8 max-w-[1500px]">
        <div
          ref={viewRef}
          onMouseEnter={() => setCursorVariant("drag")}
          onMouseLeave={() => setCursorVariant("default")}
          className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] md:aspect-[16/9]"
          style={{ background: "var(--window)" }}
        >
          {/* drei <View> renders its own tracked element + tunnels 3D into the
              shared canvas. Fill the window exactly. */}
          <View className="absolute inset-0 h-full w-full">
            <PlaceholderScene />
          </View>
          <CornerMarks color="rgba(255,255,255,.5)" inset={14} />
        </div>
      </div>

      <div className="mx-auto mt-4 mb-16 flex max-w-[1500px] items-center justify-center md:mb-24">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink-soft">
          Scroll to explore
        </span>
      </div>
    </section>
  );
}

function PlaceholderScene() {
  const mesh = useRef<import("three").Mesh>(null);
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={2.5} />
      <pointLight position={[-5, -2, 3]} intensity={30} color="#6a78ff" />
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
        <mesh ref={mesh}>
          <torusKnotGeometry args={[0.8, 0.28, 160, 32]} />
          <meshStandardMaterial
            color="#1a25ff"
            metalness={0.6}
            roughness={0.25}
          />
        </mesh>
      </Float>
    </>
  );
}
