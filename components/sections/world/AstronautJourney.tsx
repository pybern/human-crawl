"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Billboard } from "@react-three/drei";
import StudioEnv from "@/components/canvas/StudioEnv";
import Astronaut, { makeSmiley } from "@/components/sections/world/Astronaut";
import { cinema } from "@/lib/cinema";

/**
 * One continuous scene for the whole back half of the site. A SINGLE astronaut
 * instance flies down the -Z axis through three worlds (space → wireframe grid
 * tunnel → crystal cave), recedes into depth, then POPS forward to the front —
 * where the worlds fade out, its visor lights up with an LED smiley and a cloud
 * of stickers fades in. Because it's the same object the whole time, visual
 * engagement carries seamlessly from the cinematic into the "Let's work
 * together" call-to-action. Driven entirely by `cinema.progress` (0..1).
 */
const SPACE_END = -34;
const GRID_END = -80;
const CRYSTAL_END = -122;

// Astronaut distance ahead of the camera vs. scroll progress: start close-ish,
// recede (smaller) through the journey, then pop forward to the front for CTA.
const START = 7;
const FAR = 18;
const NEAR = 6.5; // CTA framing: close enough to "pop forward", but the whole
//                    astronaut + LED face stay in frame and centered
const POP_AT = 0.78;

const smoother = (x: number) => {
  const c = THREE.MathUtils.clamp(x, 0, 1);
  return c * c * c * (c * (c * 6 - 15) + 10);
};

function astronautDepth(p: number): number {
  if (p < POP_AT)
    return THREE.MathUtils.lerp(START, FAR, smoother(p / POP_AT));
  return THREE.MathUtils.lerp(FAR, NEAR, smoother((p - POP_AT) / (1 - POP_AT)));
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

const EMOJIS = [
  "💀", "🍌", "💎", "😀", "⚡", "❤️", "🍭", "🛸",
  "🔥", "🌈", "👾", "🍦", "✨", "🎲", "🦴", "🤖",
];

export default function AstronautJourney({ mobile = false }: { mobile?: boolean }) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const astro = useRef<THREE.Group>(null);
  const faceRef = useRef<THREE.Mesh>(null);
  const worldsRef = useRef<THREE.Group>(null);
  const stickersRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const fogRef = useRef<THREE.FogExp2>(null);

  const colSpace = useMemo(() => new THREE.Color("#05060a"), []);
  const colGrid = useMemo(() => new THREE.Color("#0a0a12"), []);
  const colCrystal = useMemo(() => new THREE.Color("#04140d"), []);
  const colNight = useMemo(() => new THREE.Color("#050507"), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const faceTex = useMemo(() => makeSmiley(), []);

  useFrame((state, delta) => {
    const p = cinema.progress;
    const cam = camRef.current;
    if (!cam) return;

    const camZ = THREE.MathUtils.lerp(12, CRYSTAL_END + 8, p);
    const t = state.clock.elapsedTime;
    cam.position.set(Math.sin(t * 0.2) * 1.2, Math.cos(t * 0.16) * 0.8, camZ);
    cam.lookAt(Math.sin(t * 0.1) * 1.5, 0, camZ - 12);

    // CTA take-over (0 during journey -> 1 at the very end)
    const cta = smoother((p - 0.8) / 0.2);
    const worldsOpacity = 1 - smoother((p - 0.72) / 0.18);

    // ---- astronaut depth driven by scroll ----
    const offset = astronautDepth(p);
    const closeness = THREE.MathUtils.clamp((FAR - offset) / (FAR - NEAR), 0, 1);
    const recede = THREE.MathUtils.clamp((offset - START) / (FAR - START), 0, 1);
    if (astro.current) {
      const ampXY = (0.6 + closeness * 1.8) * (1 - cta * 0.85);
      astro.current.position.set(
        Math.sin(t * 0.5) * ampXY,
        Math.cos(t * 0.4) * ampXY * 0.7 - recede * 3.2 * (1 - cta),
        camZ - offset
      );
      // spin during the journey, settle facing the camera for the CTA
      const spin = 1 - cta;
      astro.current.rotation.y += delta * 0.25 * spin;
      astro.current.rotation.y = THREE.MathUtils.lerp(
        astro.current.rotation.y,
        0,
        cta * 0.12
      );
      astro.current.rotation.z = Math.sin(t * 0.35) * 0.25 * spin;
      astro.current.rotation.x = Math.cos(t * 0.3) * 0.15 * spin;
    }

    // LED face fades in for the CTA
    if (faceRef.current) {
      const m = faceRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = cta;
      faceRef.current.visible = cta > 0.01;
    }

    // worlds fade out
    if (worldsRef.current) {
      worldsRef.current.visible = worldsOpacity > 0.01;
      worldsRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        const mat = mesh.material as THREE.Material & { opacity?: number };
        if (mat && "opacity" in mat) {
          mat.transparent = true;
          mat.opacity = worldsOpacity;
        }
      });
    }

    // sticker cloud is parented to the astronaut (inherits its transform), so
    // it travels to the front with it; just fade/scale it in for the CTA.
    if (stickersRef.current) {
      const s = 0.6 + cta * 0.6;
      stickersRef.current.scale.setScalar(s);
      stickersRef.current.visible = cta > 0.01;
      stickersRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        const mat = mesh.material as THREE.Material & { opacity?: number };
        if (mat && "opacity" in mat) mat.opacity = cta;
      });
    }

    if (lightRef.current && astro.current) {
      lightRef.current.position.set(
        astro.current.position.x + 2,
        astro.current.position.y + 2,
        astro.current.position.z + 3
      );
    }

    // ---- depth instrumentation (apparent on-screen size) for validation ----
    if (astro.current) {
      const a = astro.current.position;
      cam.updateMatrixWorld(true);
      _v1.set(a.x, a.y + 1.6, a.z).project(cam);
      _v2.set(a.x, a.y - 1.15, a.z).project(cam);
      const hPx = state.size?.height ?? 1;
      const sizePx = Math.abs(_v1.y - _v2.y) * 0.5 * hPx;
      const dist = cam.position.distanceTo(a);
      (
        window as unknown as { __astroDepth?: Record<string, number> }
      ).__astroDepth = { p, offset, dist, sizePx };
    }

    // fog colour by zone, then toward night during the CTA
    if (fogRef.current) {
      if (camZ > SPACE_END) tmp.copy(colSpace);
      else if (camZ > GRID_END) {
        const k = (camZ - SPACE_END) / (GRID_END - SPACE_END);
        tmp.copy(colSpace).lerp(colGrid, k);
      } else {
        const k = THREE.MathUtils.clamp(
          (camZ - GRID_END) / (CRYSTAL_END - GRID_END),
          0,
          1
        );
        tmp.copy(colGrid).lerp(colCrystal, k);
      }
      tmp.lerp(colNight, cta);
      fogRef.current.color.copy(tmp);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={55} position={[0, 0, 12]} />
      <fogExp2 ref={fogRef} attach="fog" args={["#05060a", 0.022]} />
      <StudioEnv intensity={0.45} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} />
      <pointLight ref={lightRef} intensity={60} color="#cfd6ff" distance={30} />

      {/* the single, persistent astronaut */}
      <group ref={astro}>
        <Astronaut />
        {/* LED smiley face that lights up for the CTA (in front of the visor) */}
        <mesh ref={faceRef} position={[0, 1.16, 0.62]} renderOrder={5} visible={false}>
          <planeGeometry args={[0.52, 0.36]} />
          <meshBasicMaterial
            map={faceTex}
            transparent
            opacity={0}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
        {/* sticker cloud, parented so it travels to the front with the astronaut */}
        <group ref={stickersRef} visible={false}>
          <StickerCloud mobile={mobile} />
        </group>
      </group>

      <group ref={worldsRef}>
        <Starfield />
        <GridTunnel mobile={mobile} />
        <Crystals mobile={mobile} />
      </group>
    </>
  );
}

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

function StickerCloud({ mobile }: { mobile: boolean }) {
  const count = mobile ? 10 : 16;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // wide ring placement keeps the centre + heading band clear so both the
        // astronaut and the CTA text stay readable
        const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const r = 3.8 + Math.random() * 2.2;
        return {
          tex: emojiTexture(EMOJIS[i % EMOJIS.length]),
          pos: new THREE.Vector3(
            Math.cos(ang) * r,
            Math.sin(ang) * r, // taller spread -> fewer at heading height
            (Math.random() - 0.5) * 2
          ),
          scale: 0.55 + Math.random() * 0.55,
        };
      }),
    [count]
  );
  return (
    <>
      {items.map((s, i) => (
        <Billboard key={i} position={s.pos}>
          <mesh scale={s.scale}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial map={s.tex} transparent opacity={0} toneMapped={false} />
          </mesh>
        </Billboard>
      ))}
    </>
  );
}

function Starfield() {
  const geo = useMemo(() => {
    const N = 1600;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = 16 - Math.random() * 150;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.12} color="#cdd6ff" sizeAttenuation transparent opacity={0.9} />
    </points>
  );
}

function GridTunnel({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const rings = mobile ? 16 : 26;
  const ringGeo = useMemo(() => {
    const s = 9;
    const pts = [
      new THREE.Vector3(-s, -s, 0),
      new THREE.Vector3(s, -s, 0),
      new THREE.Vector3(s, s, 0),
      new THREE.Vector3(-s, s, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#3a4cff",
        transparent: true,
        opacity: 0.5,
      }),
    []
  );
  useFrame((state) => {
    if (group.current)
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
  });
  const spacing = (GRID_END - SPACE_END) / rings;
  return (
    <group ref={group}>
      {Array.from({ length: rings }).map((_, i) => (
        <lineLoop key={i} position={[0, 0, SPACE_END + i * spacing]}>
          <primitive object={ringGeo} attach="geometry" />
          <primitive object={mat} attach="material" />
        </lineLoop>
      ))}
    </group>
  );
}

function Crystals({ mobile }: { mobile: boolean }) {
  const count = mobile ? 28 : 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0d3b2a",
        emissive: "#23ff9b",
        emissiveIntensity: 0.7,
        roughness: 0.3,
        metalness: 0.2,
        flatShading: true,
      }),
    []
  );
  const items = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 22,
          (Math.random() - 0.5) * 18,
          GRID_END + Math.random() * (CRYSTAL_END - GRID_END)
        ),
        rot: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
        scale: 0.5 + Math.random() * 2.2,
      })),
    [count]
  );
  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    items.forEach((it, i) => {
      q.setFromEuler(it.rot);
      s.setScalar(it.scale);
      m.compose(it.pos, q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
  });
  return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}
