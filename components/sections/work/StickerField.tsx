"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Billboard } from "@react-three/drei";
import StudioEnv from "@/components/canvas/StudioEnv";
import Astronaut from "@/components/sections/world/Astronaut";

const EMOJIS = [
  "💀", "🍌", "💎", "😀", "⚡", "❤️", "🍭", "🛸",
  "🔥", "🌈", "👾", "🍦", "✨", "🎲", "🦴", "🤖",
];

function emojiTexture(emoji: string): THREE.CanvasTexture {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.font = `${size * 0.78}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.06);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export default function StickerField({ mobile = false }: { mobile?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const astro = useRef<THREE.Group>(null);
  const count = mobile ? 10 : 16;

  const stickers = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        tex: emojiTexture(EMOJIS[i % EMOJIS.length]),
        base: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 7,
          -2 - Math.random() * 5
        ),
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6,
        scale: 0.7 + Math.random() * 0.7,
      })),
    [count]
  );

  const stickerRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // mouse parallax on the whole field
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        state.pointer.x * 0.25,
        0.05
      );
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        -state.pointer.y * 0.2,
        0.05
      );
    }
    stickers.forEach((s, i) => {
      const g = stickerRefs.current[i];
      if (!g) return;
      g.position.set(
        s.base.x + Math.sin(t * s.speed + s.phase) * 0.5,
        s.base.y + Math.cos(t * s.speed * 0.8 + s.phase) * 0.5,
        s.base.z
      );
    });
    if (astro.current) {
      astro.current.position.y = Math.sin(t * 0.6) * 0.3;
      astro.current.rotation.y = Math.sin(t * 0.3) * 0.3;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault fov={48} position={[0, 0, 10]} />
      <StudioEnv intensity={0.5} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 6]} intensity={1.6} />
      <pointLight position={[0, 0, 6]} intensity={40} color="#cfd6ff" distance={25} />

      <group ref={astro} scale={1.5} position={[0, 0, 0]}>
        <Astronaut smiley />
      </group>

      <group ref={group}>
        {stickers.map((s, i) => (
          <Billboard
            key={i}
            ref={(el) => {
              stickerRefs.current[i] = el;
            }}
          >
            <mesh scale={s.scale}>
              <planeGeometry args={[1, 1]} />
              <meshBasicMaterial map={s.tex} transparent toneMapped={false} />
            </mesh>
          </Billboard>
        ))}
      </group>
    </>
  );
}
