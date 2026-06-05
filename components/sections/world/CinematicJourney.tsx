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

/** Fade a whole subtree by multiplying each material's stored base opacity. */
function applyFade(group: THREE.Object3D | null, o: number) {
  if (!group) return;
  group.visible = o > 0.01;
  if (o <= 0.01) return;
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    const mat = mesh.material as
      | (THREE.Material & { opacity?: number; userData?: { baseOpacity?: number } })
      | undefined;
    if (mat && "opacity" in mat) {
      mat.transparent = true;
      mat.opacity = (mat.userData?.baseOpacity ?? 1) * o;
    }
  });
}

const EMOJIS = [
  "💀", "🍌", "💎", "😀", "⚡", "❤️", "🍭", "🛸",
  "🔥", "🌈", "👾", "🍦", "✨", "🎲", "🦴", "🤖",
];

export default function CinematicJourney({
  mobile = false,
  wormhole = false,
}: {
  mobile?: boolean;
  wormhole?: boolean;
}) {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const astro = useRef<THREE.Group>(null);
  const faceRef = useRef<THREE.Mesh>(null);
  const starRef = useRef<THREE.Group>(null);
  const gridRef = useRef<THREE.Group>(null);
  const crystalRef = useRef<THREE.Group>(null);
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

    const cta = smoother((p - 0.82) / 0.18);
    // worlds clear out as the CTA takes over
    const ctaFade = 1 - smoother((p - 0.82) / 0.13);

    // wormhole "warp punch": widen FOV + add a roll as speed builds (the
    // intense fly-through). Only on the /fast experiment (wormhole flag).
    if (wormhole) {
      const warp = smoother(THREE.MathUtils.clamp((p - 0.05) / 0.6, 0, 1));
      const fov = THREE.MathUtils.lerp(55, 96, warp) * (1 - cta * 0.25);
      if (Math.abs(cam.fov - fov) > 0.05) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
      cam.rotation.z = Math.sin(t * 0.7) * 0.06 * warp * (1 - cta);
    }
    // Progress-driven engagement: nothing but stars + astronaut at the start;
    // the grid fades in as you approach it, then hands off to the crystal cave.
    const gridFade = Math.min(smoother((p - 0.08) / 0.18), 1 - smoother((p - 0.6) / 0.16));
    // clear the crystal cave a bit BEFORE the CTA icons ramp in, so dark shards
    // don't drift across the sticker ring during the hand-off
    const crystalFade = smoother((p - 0.36) / 0.2) * (1 - smoother((p - 0.79) / 0.07));
    const starFade = (0.4 + 0.6 * smoother(p / 0.16)) * ctaFade;

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

    applyFade(starRef.current, starFade);
    applyFade(gridRef.current, gridFade);
    applyFade(crystalRef.current, crystalFade);

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
        // fade the gems in with the CTA (otherwise opacity stayed 0)
        const mat = (c as THREE.Mesh).material as THREE.Material & { opacity?: number };
        if (mat && "opacity" in mat) mat.opacity = cta * 0.85;
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
        p, offset, dist, sizePx, cta, gridFade, crystalFade,
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

      <group ref={starRef}>
        <Starfield mobile={mobile} />
      </group>
      <group ref={gridRef} visible={false}>
        <GridTunnel mobile={mobile} />
      </group>
      <group ref={crystalRef} visible={false}>
        <CrystalTunnel mobile={mobile} />
        <SparkleField mobile={mobile} />
      </group>

      {wormhole && (
        <>
          <WarpStreaks mobile={mobile} />
          <WormholeRings mobile={mobile} />
        </>
      )}
    </>
  );
}

/* --------------------------------------------------------- wormhole (/fast) */

/** Hyperspace warp streaks: instanced Z-stretched bars rushing past the camera. */
function WarpStreaks({ mobile }: { mobile: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = mobile ? 180 : 380;
  const geo = useMemo(() => new THREE.BoxGeometry(0.035, 0.035, 1), []);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#bcd2ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );
  const items = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const ang = Math.random() * Math.PI * 2;
        const r = 1.4 + Math.random() * 10;
        return {
          x: Math.cos(ang) * r,
          y: Math.sin(ang) * r,
          z: -Math.random() * 220,
          spd: 70 + Math.random() * 140,
          len: 6 + Math.random() * 18,
        };
      }),
    [count]
  );
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const p = cinema.progress;
    const camZ = THREE.MathUtils.lerp(12, CRYSTAL_END + 8, p);
    const speedK = smoother(THREE.MathUtils.clamp((p - 0.05) / 0.5, 0, 1));
    items.forEach((it, i) => {
      it.z += it.spd * delta * (0.35 + speedK);
      if (it.z > camZ + 8) it.z = camZ - 220 - Math.random() * 40;
      pos.set(it.x, it.y, it.z);
      scl.set(1, 1, it.len * (0.4 + speedK * 1.4));
      m4.compose(pos, q, scl);
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    const cta = smoother((p - 0.82) / 0.13);
    mat.opacity = 0.9 * speedK * (1 - cta);
  });
  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />;
}

/** Swirling helix of glowing rings the astronaut flies through (the wormhole). */
function WormholeRings({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const N = mobile ? 30 : 52;
  const SPAN = 260;
  const geo = useMemo(() => new THREE.TorusGeometry(5.5, 0.07, 8, 72), []);
  const mats = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const c = new THREE.Color().setHSL(0.52 + 0.22 * (i / N), 0.95, 0.6);
        return new THREE.MeshBasicMaterial({
          color: c,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
      }),
    [N]
  );
  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const p = cinema.progress;
    const t = state.clock.elapsedTime;
    const camZ = THREE.MathUtils.lerp(12, CRYSTAL_END + 8, p);
    const speedK = smoother(THREE.MathUtils.clamp((p - 0.05) / 0.5, 0, 1));
    const cta = smoother((p - 0.82) / 0.13);
    g.children.forEach((child, i) => {
      child.position.z += (45 + 90 * speedK) * delta;
      if (child.position.z > camZ + 6) child.position.z -= SPAN;
      // helical swirl of the ring centres → a twisting wormhole tube
      const a = i * 0.5 + t * 0.6;
      const swirl = 1.3 + 0.5 * Math.sin(t * 0.4 + i * 0.2);
      child.position.x = Math.cos(a) * swirl;
      child.position.y = Math.sin(a) * swirl;
      const s = 0.8 + 0.35 * Math.sin(i * 0.6 + t);
      child.scale.setScalar(s);
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = 0.85 * speedK * (1 - cta);
      child.visible = speedK > 0.01;
    });
  });
  return (
    <group ref={group}>
      {mats.map((m, i) => (
        <mesh
          key={i}
          geometry={geo}
          material={m}
          position={[0, 0, CRYSTAL_END + 8 - (i / N) * SPAN]}
        />
      ))}
    </group>
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
          {/* reflective glass gem (no transmission — transmission refracted the
              dark background to near-black faceted shards that drifted over the
              icons). Catches the studio env + bloom so it reads as bright crystal. */}
          <meshPhysicalMaterial
            transparent
            opacity={0}
            metalness={0}
            roughness={0.06}
            clearcoat={1}
            clearcoatRoughness={0.04}
            envMapIntensity={1.8}
            ior={1.5}
            color="#cfe0ff"
            attach="material"
          />
        </mesh>
      ))}
    </>
  );
}

/* --------------------------------------------------------------- starfield */

function Starfield({ mobile = false }: { mobile?: boolean }) {
  const geo = useMemo(() => {
    const N = mobile ? 1600 : 2800; // more of them
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 64;
      pos[i * 3 + 2] = 16 - Math.random() * 160;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [mobile]);
  const mat = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.1, // smaller, round particles
      map: makeDot(),
      color: "#dfe6ff",
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
    });
    m.userData.baseOpacity = 0.9;
    return m;
  }, []);
  return <points geometry={geo} material={mat} frustumCulled={false} />;
}

/* ------------------------------------------------------------- grid tunnel */

// Depth-gradient colours for the data-tunnel lines (near → far), assigned as
// vertex colours so the grid reads as a glowing gradient, not flat squares.
const GRID_NEAR = new THREE.Color("#5cf0ff");
const GRID_FAR = new THREE.Color("#2e3cff");
const GRID_NEAR2 = new THREE.Color("#8affd6");
const GRID_FAR2 = new THREE.Color("#7a4cff");

/** Line geometry with a per-vertex colour gradient + brightness falloff along z. */
function gradLineGeo(
  pts: THREE.Vector3[],
  cNear: THREE.Color,
  cFar: THREE.Color
): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const col = new Float32Array(pts.length * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < pts.length; i++) {
    const k = THREE.MathUtils.clamp(
      (pts[i].z - SPACE_END) / (GRID_END - SPACE_END),
      0,
      1
    );
    tmp.copy(cNear).lerp(cFar, k);
    const bri = 1 - 0.5 * k; // dim into the distance
    col[i * 3] = tmp.r * bri;
    col[i * 3 + 1] = tmp.g * bri;
    col[i * 3 + 2] = tmp.b * bri;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

function GridTunnel({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null);
  const rings = mobile ? 36 : 64;
  const s = 9;
  const spacing = (GRID_END - SPACE_END) / rings;

  // Subdivided perimeter of the square cross-section. Each node anchors a
  // longitudinal line, so the four tube walls read as a fine, regular grid
  // (the dense lusion "data tunnel" wireframe) rather than a bare box.
  const perSide = mobile ? 4 : 7;
  const perim = useMemo(() => {
    const corners: [number, number][] = [[-s, -s], [s, -s], [s, s], [-s, s]];
    const pts: [number, number][] = [];
    for (let c = 0; c < 4; c++) {
      const [x0, y0] = corners[c];
      const [x1, y1] = corners[(c + 1) % 4];
      for (let i = 0; i < perSide; i++) {
        const f = i / perSide;
        pts.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]);
      }
    }
    return pts;
  }, []);

  // All transverse rings merged into ONE lineSegments geometry (cheap → lets us
  // pack many more rings than per-ring <lineLoop> draw calls would allow).
  const ringsGeo = useMemo(() => {
    const corners: [number, number][] = [[-s, -s], [s, -s], [s, s], [-s, s]];
    const pts: THREE.Vector3[] = [];
    for (let r = 0; r < rings; r++) {
      const z = SPACE_END + r * spacing;
      for (let c = 0; c < 4; c++) {
        const [x0, y0] = corners[c];
        const [x1, y1] = corners[(c + 1) % 4];
        pts.push(new THREE.Vector3(x0, y0, z), new THREE.Vector3(x1, y1, z));
      }
    }
    return gradLineGeo(pts, GRID_NEAR, GRID_FAR);
  }, [rings, spacing]);

  // Inner concentric diamond rings (rotated 45°) for layered depth, also merged.
  const innerRingsGeo = useMemo(() => {
    const si = s * 0.56;
    const diamond: [number, number][] = [[0, -si], [si, 0], [0, si], [-si, 0]];
    const pts: THREE.Vector3[] = [];
    for (let r = 0; r < rings; r += 1) {
      const z = SPACE_END + r * spacing;
      for (let c = 0; c < 4; c++) {
        const [x0, y0] = diamond[c];
        const [x1, y1] = diamond[(c + 1) % 4];
        pts.push(new THREE.Vector3(x0, y0, z), new THREE.Vector3(x1, y1, z));
      }
    }
    return gradLineGeo(pts, GRID_NEAR2, GRID_FAR2);
  }, [rings, spacing]);

  // Longitudinal lines through every perimeter node → the wall grid.
  const longGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (const [x, y] of perim) {
      pts.push(new THREE.Vector3(x, y, SPACE_END), new THREE.Vector3(x, y, GRID_END));
    }
    return gradLineGeo(pts, GRID_NEAR, GRID_FAR);
  }, [perim]);

  // Additive + vertex-colour so the lines GLOW (picked up by bloom) and shift
  // hue down the tunnel, instead of flat single-colour squares.
  const mat = useMemo(() => {
    const m = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    m.userData.baseOpacity = 0.95;
    return m;
  }, []);
  const mat2 = useMemo(() => {
    const m = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    m.userData.baseOpacity = 0.75;
    return m;
  }, []);
  // Drifting "data bits": small round particles. A single THREE.Points cloud
  // (one draw call, soft circular sprite) so we can have lots of them cheaply.
  const bits = mobile ? 220 : 520;
  const bitsRef = useRef<THREE.Points>(null);
  const dotTex = useMemo(() => makeDot(), []);
  const bitGeo = useMemo(() => {
    const pos = new Float32Array(bits * 3);
    for (let i = 0; i < bits; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2 * s;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2 * s;
      pos[i * 3 + 2] = SPACE_END + Math.random() * (GRID_END - SPACE_END);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [bits]);
  const speeds = useMemo(
    () => Float32Array.from({ length: bits }, () => 4 + Math.random() * 8),
    [bits]
  );
  const bitMat = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.12,
      map: dotTex,
      color: "#9ab4ff",
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    m.userData.baseOpacity = 0.95;
    return m;
  }, [dotTex]);
  useFrame((state, delta) => {
    if (group.current)
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    const pts = bitsRef.current;
    if (pts) {
      const arr = pts.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < bits; i++) {
        let z = arr[i * 3 + 2] + speeds[i] * delta; // drift toward the camera
        if (z > SPACE_END) z = GRID_END;
        arr[i * 3 + 2] = z;
      }
      pts.geometry.attributes.position.needsUpdate = true;
      pts.frustumCulled = false;
    }
  });
  return (
    <group ref={group}>
      <lineSegments>
        <primitive object={ringsGeo} attach="geometry" />
        <primitive object={mat} attach="material" />
      </lineSegments>
      <lineSegments>
        <primitive object={innerRingsGeo} attach="geometry" />
        <primitive object={mat2} attach="material" />
      </lineSegments>
      <lineSegments>
        <primitive object={longGeo} attach="geometry" />
        <primitive object={mat} attach="material" />
      </lineSegments>
      <points ref={bitsRef} geometry={bitGeo} material={bitMat} frustumCulled={false} />
    </group>
  );
}

/* ----------------------------------------------------------- crystal tunnel */

/** One instanced layer of crystal shards radiating along the tunnel. */
function CrystalLayer({
  count, rMin, rMax, geoScale, scaleMin, scaleAdd, colors, emissive, rotSpeed,
  orient = "out",
}: {
  count: number;
  rMin: number;
  rMax: number;
  geoScale: [number, number, number];
  scaleMin: number;
  scaleAdd: number;
  colors: string[];
  emissive: string;
  rotSpeed: number;
  /** "out" → shards splay against the cave walls; "along" → streak down the tunnel. */
  orient?: "out" | "along";
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const g = new THREE.OctahedronGeometry(1, 0);
    g.scale(geoScale[0], geoScale[1], geoScale[2]);
    return g;
  }, [geoScale]);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#0a2a20",
      emissive,
      emissiveIntensity: 1.2,
      roughness: 0.16,
      metalness: 0.25,
      transparent: true,
      opacity: 0.95,
      flatShading: true,
    });
    m.userData.baseOpacity = 0.95;
    return m;
  }, [emissive]);
  const items = useMemo(() => {
    const up = new THREE.Vector3(0, 0, 1);
    const dir = new THREE.Vector3();
    const q = new THREE.Quaternion();
    return Array.from({ length: count }, () => {
      const ang = Math.random() * Math.PI * 2;
      const r = rMin + Math.random() * (rMax - rMin);
      const z = GRID_END + Math.random() * (CRYSTAL_END - GRID_END);
      const pos = new THREE.Vector3(Math.cos(ang) * r, Math.sin(ang) * r, z);
      if (orient === "along") {
        // thin needles streaking down the tunnel near the walls (never cross the bore)
        dir.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 1).normalize();
      } else {
        // splay OUTWARD against the cave wall (+ a little z drift) so the
        // centre bore stays clear instead of spiking toward the camera/astronaut
        dir.set(pos.x, pos.y, (Math.random() - 0.5) * 5).normalize();
      }
      q.setFromUnitVectors(up, dir);
      const color = colors[Math.floor(Math.random() * colors.length)];
      return { pos, quat: q.clone(), scale: scaleMin + Math.random() * scaleAdd, color };
    });
  }, [count, rMin, rMax, scaleMin, scaleAdd, colors, orient]);
  useFrame((state, delta) => {
    if (group.current) group.current.rotation.z += delta * rotSpeed;
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

function CrystalTunnel({ mobile }: { mobile: boolean }) {
  return (
    <>
      {/* big outer shards forming the cave walls — splayed outward so the centre
          bore (where the astronaut flies) stays clear */}
      <CrystalLayer
        count={mobile ? 90 : 230}
        rMin={8}
        rMax={18}
        geoScale={[0.34, 0.34, 1]}
        scaleMin={1.2}
        scaleAdd={3.2}
        colors={["#27ff9d", "#27ff9d", "#46f6ff", "#ffe45e"]}
        emissive="#27ff9d"
        rotSpeed={0.03}
        orient="out"
      />
      {/* thin inner needles streaking down the tunnel (parallax) — kept off the
          axis and aligned with the flight path so they never block the view */}
      <CrystalLayer
        count={mobile ? 70 : 130}
        rMin={5}
        rMax={12}
        geoScale={[0.14, 0.14, 2.4]}
        scaleMin={1.4}
        scaleAdd={3.6}
        colors={["#79ffe1", "#46f6ff", "#b6ff5e"]}
        emissive="#46f6ff"
        rotSpeed={-0.05}
        orient="along"
      />
    </>
  );
}

/* ---------------------------------------------------------------- sparkles */

function SparkleField({ mobile }: { mobile: boolean }) {
  const count = mobile ? 280 : 780;
  const geo = useMemo(() => {
    const N = count;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 2.5 + Math.random() * 11;
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
      size: 0.16, // smaller, round
      map: makeDot(),
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

/* ----------------------------------------------------------- particle dot */

/** Soft round sprite so Points read as little spheres instead of squares. */
function makeDot(): THREE.CanvasTexture {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
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
