"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Billboard } from "@react-three/drei";
import StudioEnv from "@/components/canvas/StudioEnv";
import { cinema } from "@/lib/cinema";
import AstronautModel, { ASTRONAUT_HEIGHT } from "@/components/sections/world/AstronautModel";

/**
 * Higher-detail standalone cinematic for the /new-world route. Same proven
 * scroll-depth shape as the home section (recede → pop) but with a real GLTF
 * astronaut, a dense glowing refractive crystal tunnel, a richer data-grid
 * tunnel, and a sticker + floating-diamond CTA — all under a full
 * post-processing stack (see CinematicCanvas).
 */
const SPACE_END = -34;
const GRID_END = -80;
const CRYSTAL_END = -128;

const START = 7;
const FAR = 18;
const NEAR = 6.5;
const POP_AT = 0.78;

const smoother = (x: number) => {
  const c = THREE.MathUtils.clamp(x, 0, 1);
  return c * c * c * (c * (c * 6 - 15) + 10);
};

function astronautDepth(p: number): number {
  if (p < POP_AT) return THREE.MathUtils.lerp(START, FAR, smoother(p / POP_AT));
  return THREE.MathUtils.lerp(FAR, NEAR, smoother((p - POP_AT) / (1 - POP_AT)));
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

const EMOJIS = [
  "💀", "🍌", "💎", "😀", "⚡", "❤️", "🍭", "🛸",
  "🔥", "🌈", "👾", "🍦", "✨", "🎲", "🦴", "🤖",
];

export default function CinematicJourney({ mobile = false }: { mobile?: boolean }) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const astro = useRef<THREE.Group>(null);
  const faceRef = useRef<THREE.Mesh>(null);
  const worldsRef = useRef<THREE.Group>(null);
  const stickersRef = useRef<THREE.Group>(null);
  const diamondsRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const fogRef = useRef<THREE.FogExp2>(null);

  const colSpace = useMemo(() => new THREE.Color("#05060a"), []);
  const colGrid = useMemo(() => new THREE.Color("#070a16"), []);
  const colCrystal = useMemo(() => new THREE.Color("#03130d"), []);
  const colNight = useMemo(() => new THREE.Color("#050507"), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const faceTex = useMemo(() => makeLEDFace(), []);

  useFrame((state, delta) => {
    const p = cinema.progress;
    const cam = camRef.current;
    if (!cam) return;

    const camZ = THREE.MathUtils.lerp(12, CRYSTAL_END + 8, p);
    const t = state.clock.elapsedTime;
    cam.position.set(Math.sin(t * 0.2) * 1.2, Math.cos(t * 0.16) * 0.8, camZ);
    cam.lookAt(Math.sin(t * 0.1) * 1.5, 0, camZ - 12);

    const cta = smoother((p - 0.8) / 0.2);
    const worldsOpacity = 1 - smoother((p - 0.72) / 0.18);

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
      const spin = 1 - cta;
      astro.current.rotation.y += delta * 0.25 * spin;
      astro.current.rotation.y = THREE.MathUtils.lerp(astro.current.rotation.y, 0, cta * 0.12);
      astro.current.rotation.z = Math.sin(t * 0.35) * 0.22 * spin;
      astro.current.rotation.x = Math.cos(t * 0.3) * 0.13 * spin;
    }

    if (faceRef.current) {
      const m = faceRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = cta;
      faceRef.current.visible = cta > 0.01;
    }

    if (worldsRef.current) {
      worldsRef.current.visible = worldsOpacity > 0.01;
      worldsRef.current.traverse((o) => {
        const mesh = o as THREE.Mesh;
        const mat = mesh.material as THREE.Material & { opacity?: number };
        if (mat && "opacity" in mat) {
          mat.transparent = true;
          mat.opacity = (mat.userData?.baseOpacity ?? 1) * worldsOpacity;
        }
      });
    }

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

    if (diamondsRef.current) {
      diamondsRef.current.visible = cta > 0.01;
      diamondsRef.current.rotation.y += delta * 0.2;
      diamondsRef.current.children.forEach((c, i) => {
        c.rotation.x += delta * (0.5 + (i % 3) * 0.2);
        c.rotation.y += delta * 0.4;
      });
    }

    if (lightRef.current && astro.current) {
      lightRef.current.position.set(
        astro.current.position.x + 2,
        astro.current.position.y + 2,
        astro.current.position.z + 3
      );
    }

    if (astro.current) {
      const a = astro.current.position;
      cam.updateMatrixWorld(true);
      _v1.set(a.x, a.y + ASTRONAUT_HEIGHT / 2, a.z).project(cam);
      _v2.set(a.x, a.y - ASTRONAUT_HEIGHT / 2, a.z).project(cam);
      const hPx = state.size?.height ?? 1;
      const sizePx = Math.abs(_v1.y - _v2.y) * 0.5 * hPx;
      const dist = cam.position.distanceTo(a);
      (window as unknown as { __astroDepth?: Record<string, number> }).__astroDepth = {
        p, offset, dist, sizePx, cta, worldsOpacity,
      };
    }

    if (fogRef.current) {
      if (camZ > SPACE_END) tmp.copy(colSpace);
      else if (camZ > GRID_END) {
        const k = (camZ - SPACE_END) / (GRID_END - SPACE_END);
        tmp.copy(colSpace).lerp(colGrid, k);
      } else {
        const k = THREE.MathUtils.clamp((camZ - GRID_END) / (CRYSTAL_END - GRID_END), 0, 1);
        tmp.copy(colGrid).lerp(colCrystal, k);
      }
      tmp.lerp(colNight, cta);
      fogRef.current.color.copy(tmp);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={camRef} makeDefault fov={55} position={[0, 0, 12]} />
      <fogExp2 ref={fogRef} attach="fog" args={["#05060a", 0.02]} />
      <StudioEnv intensity={0.5} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 6]} intensity={1.3} />
      <pointLight ref={lightRef} intensity={70} color="#cfd6ff" distance={34} />

      <group ref={astro}>
        <Suspense fallback={null}>
          <AstronautModel />
        </Suspense>
        {/* LED visor face for the CTA (billboarded so it reads facing camera) */}
        <Billboard position={[0, ASTRONAUT_HEIGHT * 0.33, 0.1]}>
          <mesh ref={faceRef} renderOrder={6} visible={false}>
            <planeGeometry args={[0.74, 0.5]} />
            <meshBasicMaterial map={faceTex} transparent opacity={0} toneMapped={false} depthWrite={false} />
          </mesh>
        </Billboard>
        <group ref={stickersRef} visible={false}>
          <StickerCloud mobile={mobile} />
        </group>
        <group ref={diamondsRef} visible={false}>
          <DiamondCloud mobile={mobile} />
        </group>
      </group>

      <group ref={worldsRef}>
        <Starfield />
        <GridTunnel mobile={mobile} />
        <CrystalTunnel mobile={mobile} />
        <SparkleField mobile={mobile} />
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ stickers */

function makeSticker(emoji: string): THREE.CanvasTexture {
  const size = 192;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  // white rounded sticker backing with a soft outline (the lusion sticker look)
  const r = size * 0.28;
  const pad = size * 0.12;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(pad, pad, size - pad * 2, size - pad * 2, r);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = `${size * 0.52}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function StickerCloud({ mobile }: { mobile: boolean }) {
  const count = mobile ? 10 : 16;
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const r = 3.8 + Math.random() * 2.4;
        return {
          tex: makeSticker(EMOJIS[i % EMOJIS.length]),
          pos: new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, (Math.random() - 0.5) * 2),
          scale: 0.6 + Math.random() * 0.5,
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

/* ------------------------------------------------------------- CTA diamonds */

function DiamondCloud({ mobile }: { mobile: boolean }) {
  const count = mobile ? 7 : 12;
  const geo = useMemo(() => {
    const g = new THREE.OctahedronGeometry(0.42, 0);
    g.scale(1, 1.5, 1); // gem proportions
    return g;
  }, []);
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2 + Math.random();
        const r = 3.2 + Math.random() * 3.2;
        return {
          pos: new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r * 0.8, (Math.random() - 0.5) * 3),
          scale: 0.7 + Math.random() * 0.8,
        };
      }),
    [count]
  );
  return (
    <>
      {items.map((d, i) => (
        <mesh key={i} geometry={geo} position={d.pos} scale={d.scale}>
          <meshPhysicalMaterial
            transparent
            opacity={0}
            transmission={1}
            thickness={0.6}
            ior={2.4}
            roughness={0.02}
            metalness={0}
            color="#dfe6ff"
            attach="material"
          />
        </mesh>
      ))}
    </>
  );
}

/* --------------------------------------------------------------- starfield */

function Starfield() {
  const geo = useMemo(() => {
    const N = 1800;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 64;
      pos[i * 3 + 2] = 16 - Math.random() * 160;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.14} color="#dfe6ff" sizeAttenuation transparent opacity={0.9} />
    </points>
  );
}

/* ------------------------------------------------------------- grid tunnel */

function GridTunnel({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const rings = mobile ? 18 : 30;
  const s = 9;
  const ringGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-s, -s, 0), new THREE.Vector3(s, -s, 0),
      new THREE.Vector3(s, s, 0), new THREE.Vector3(-s, s, 0),
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  // longitudinal lines along the four tunnel edges
  const longGeo = useMemo(() => {
    const corners = [
      [-s, -s], [s, -s], [s, s], [-s, s],
    ];
    const pts: THREE.Vector3[] = [];
    for (const [x, y] of corners) {
      pts.push(new THREE.Vector3(x, y, SPACE_END));
      pts.push(new THREE.Vector3(x, y, GRID_END));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.LineBasicMaterial({ color: "#3a4cff", transparent: true, opacity: 0.55 });
    m.userData.baseOpacity = 0.55;
    return m;
  }, []);
  const bits = mobile ? 40 : 90;
  const bitsRef = useRef<THREE.InstancedMesh>(null);
  const bitGeo = useMemo(() => new THREE.BoxGeometry(0.18, 0.18, 0.18), []);
  const bitMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ color: "#7ea0ff", transparent: true, opacity: 0.9 });
    m.userData.baseOpacity = 0.9;
    return m;
  }, []);
  const bitItems = useMemo(
    () =>
      Array.from({ length: bits }, () => ({
        x: (Math.random() - 0.5) * 2 * s,
        y: (Math.random() - 0.5) * 2 * s,
        z: SPACE_END + Math.random() * (GRID_END - SPACE_END),
        spd: 4 + Math.random() * 8,
      })),
    [bits]
  );
  useFrame((state, delta) => {
    if (group.current)
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    const mesh = bitsRef.current;
    if (mesh) {
      const m = new THREE.Matrix4();
      bitItems.forEach((b, i) => {
        b.z += b.spd * delta; // drift toward the camera
        if (b.z > SPACE_END) b.z = GRID_END;
        m.makeTranslation(b.x, b.y, b.z);
        mesh.setMatrixAt(i, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
    }
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
      <lineSegments>
        <primitive object={longGeo} attach="geometry" />
        <primitive object={mat} attach="material" />
      </lineSegments>
      <instancedMesh ref={bitsRef} args={[bitGeo, bitMat, bits]} frustumCulled={false} />
    </group>
  );
}

/* ----------------------------------------------------------- crystal tunnel */

function CrystalTunnel({ mobile }: { mobile: boolean }) {
  const count = mobile ? 80 : 220;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const g = new THREE.OctahedronGeometry(1, 0);
    g.scale(0.34, 0.34, 1); // elongated shard / spike
    return g;
  }, []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#0a2a20",
      emissive: "#27ff9d",
      emissiveIntensity: 1.15,
      roughness: 0.18,
      metalness: 0.25,
      transparent: true,
      opacity: 0.95,
      flatShading: true,
    });
    m.userData.baseOpacity = 0.95;
    return m;
  }, []);
  const items = useMemo(() => {
    const up = new THREE.Vector3(0, 0, 1);
    const dir = new THREE.Vector3();
    const q = new THREE.Quaternion();
    return Array.from({ length: count }, () => {
      const ang = Math.random() * Math.PI * 2;
      const r = 4 + Math.random() * 11; // tunnel wall radius
      const z = GRID_END + Math.random() * (CRYSTAL_END - GRID_END);
      const pos = new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, z);
      // point the shard roughly inward (toward the tunnel axis) with jitter
      dir.set(-pos.x, -pos.y, (Math.random() - 0.5) * 6).normalize();
      q.setFromUnitVectors(up, dir);
      // colour pops: mostly teal, some cyan, a few yellow (bloom makes them spark)
      const roll = Math.random();
      const color = roll > 0.86 ? "#ffe45e" : roll > 0.6 ? "#46f6ff" : "#27ff9d";
      return { pos, quat: q.clone(), scale: 1.2 + Math.random() * 4.2, color };
    });
  }, [count]);
  useFrame((state, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.03;
    const mesh = meshRef.current;
    if (!mesh) return;
    if (!mesh.userData.init) {
      const m = new THREE.Matrix4();
      const s = new THREE.Vector3();
      const c = new THREE.Color();
      items.forEach((it, i) => {
        s.set(it.scale, it.scale, it.scale);
        m.compose(it.pos, it.quat, s);
        mesh.setMatrixAt(i, m);
        c.set(it.color);
        mesh.setColorAt(i, c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      mesh.userData.init = true;
    }
  });
  return (
    <group ref={group}>
      <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />
    </group>
  );
}

/* ---------------------------------------------------------------- sparkles */

function SparkleField({ mobile }: { mobile: boolean }) {
  const count = mobile ? 120 : 320;
  const geo = useMemo(() => {
    const N = count;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * 12;
      pos[i * 3] = Math.cos(ang) * r;
      pos[i * 3 + 1] = Math.sin(ang) * r;
      pos[i * 3 + 2] = GRID_END + Math.random() * (CRYSTAL_END - GRID_END);
      const roll = Math.random();
      c.set(roll > 0.5 ? "#fff36b" : "#79ffe1");
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [count]);
  const mat = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.22,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    m.userData.baseOpacity = 1;
    return m;
  }, []);
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/* ------------------------------------------------------------- LED visor */

function makeLEDFace(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#04040a";
  ctx.fillRect(0, 0, 256, 256);
  // colourful LED grid forming eyes + smile (like the reference visor)
  const cols = 16, rows = 16, cell = 256 / cols;
  const on = (cx: number, cy: number) => {
    // two eyes + a smile arc
    const eye =
      (Math.hypot(cx - 5, cy - 6) < 1.6) || (Math.hypot(cx - 10, cy - 6) < 1.6);
    const a = Math.atan2(cy - 7, cx - 7.5);
    const rr = Math.hypot(cx - 7.5, cy - 7.5);
    const smile = cy > 8 && rr > 4.2 && rr < 6 && a > 0.2 && a < Math.PI - 0.2;
    return eye || smile;
  };
  const palette = ["#ff5bd0", "#5b8cff", "#7CFFB2", "#ffe45e", "#46f6ff"];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!on(x, y)) continue;
      ctx.fillStyle = palette[(x + y) % palette.length];
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}
