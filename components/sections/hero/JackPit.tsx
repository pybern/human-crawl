"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import StudioEnv from "@/components/canvas/StudioEnv";
import { createJackGeometry, JACK_COLORS } from "@/lib/three/jack";

/**
 * The hero "jack pit".
 *
 * We run a small, self-contained rigid-ish body simulation (gravity, box
 * bounds, sphere-approx inter-body repulsion, and an amplified pointer shove)
 * and render every jack through a single InstancedMesh — one draw call, fully
 * deterministic, and reliable inside a drei <View> portal (where third-party
 * physics renderers proved fragile). Looks like a glossy pile you can smash
 * around with the cursor / finger.
 */
export default function JackPit({ mobile = false }: { mobile?: boolean }) {
  const count = mobile ? 30 : 52;
  return (
    <>
      <PerspectiveCamera makeDefault fov={35} position={[0, 0, 8]} />
      <StudioEnv intensity={0.75} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 6]} intensity={2.0} />
      <directionalLight position={[-6, -2, 2]} intensity={0.6} color="#8a96ff" />
      <Pile count={count} mobile={mobile} />
    </>
  );
}

const _m = new THREE.Matrix4();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _d = new THREE.Vector3();
const _spin = new THREE.Quaternion();

type Body = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  quat: THREE.Quaternion;
  ang: THREE.Vector3; // angular velocity (axis * speed)
  radius: number;
  scale: number;
  colorIdx: number;
};

type Bounds = { halfW: number; halfH: number; halfD: number };

function buildBodies(count: number, bounds: Bounds): Body[] {
  return Array.from({ length: count }, (_, i) => {
    const scale = 1.0 + Math.random() * 0.35;
    return {
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * bounds.halfW * 1.9,
        (Math.random() - 0.5) * bounds.halfH * 1.9,
        (Math.random() - 0.5) * bounds.halfD
      ),
      vel: new THREE.Vector3(0, 0, 0),
      quat: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )
      ),
      ang: new THREE.Vector3(
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.7
      ),
      radius: 0.5 * scale,
      scale,
      colorIdx: i % JACK_COLORS.length,
    };
  });
}

function Pile({ count, mobile }: { count: number; mobile: boolean }) {
  const { viewport } = useThree();
  const geometry = useMemo(() => createJackGeometry(1.0, 0.2), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // material: glossy plastic with clearcoat + env reflections
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        metalness: 0.15,
        roughness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.15,
        vertexColors: false,
      }),
    []
  );

  // simulation bounds derived from the visible frame
  const bounds = useMemo(() => {
    const halfW = viewport.width / 2;
    const halfH = viewport.height / 2;
    // shallow slab so the chunky jacks pack into a single dense layer that
    // fills the window (like the reference), instead of scattering in depth.
    return { halfW, halfH, halfD: 1.1 };
  }, [viewport.width, viewport.height]);

  // Simulation state: seeded purely in useMemo, then held in a ref that we
  // mutate every frame. Re-seeds when the body count / frame size changes.
  const initialBodies = useMemo(
    () => buildBodies(count, bounds),
    [count, bounds]
  );
  const bodiesRef = useRef<Body[]>(initialBodies);

  // adopt new seed + set instance colors when (re)seeded
  useEffect(() => {
    bodiesRef.current = initialBodies;
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color();
    initialBodies.forEach((b, i) => {
      c.set(JACK_COLORS[b.colorIdx]);
      mesh.setColorAt(i, c);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [initialBodies]);

  // pointer tracking in view space (world units on the z=0 plane)
  const mouse = useRef(new THREE.Vector3(0, -999, 0));
  const mousePrev = useRef(new THREE.Vector3(0, -999, 0));
  const mouseVel = useRef(new THREE.Vector3());
  const mouseActive = useRef(false);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const bodies = bodiesRef.current;

    const dt = Math.min(delta, 1 / 30);
    const { halfW, halfH, halfD } = bounds;

    // update pointer world position
    const active =
      Math.abs(state.pointer.x) > 0.0001 || Math.abs(state.pointer.y) > 0.0001;
    mouseActive.current = active;
    if (active) {
      mousePrev.current.copy(mouse.current);
      mouse.current.set(
        (state.pointer.x * viewport.width) / 2,
        (state.pointer.y * viewport.height) / 2,
        0
      );
      mouseVel.current.subVectors(mouse.current, mousePrev.current);
    }

    const substeps = 2;
    const sdt = dt / substeps;
    // Lusion-style: a gentle pull toward the window centre (not downward
    // gravity) so the pile always fills the frame and refills after the cursor
    // carves through it. Inter-body repulsion spreads them out to the walls.
    const attract = 4.0;

    for (let s = 0; s < substeps; s++) {
      // integrate + bounds
      for (const b of bodies) {
        b.vel.x -= b.pos.x * attract * sdt;
        b.vel.y -= b.pos.y * attract * sdt;
        b.vel.z -= b.pos.z * attract * sdt * 1.6;
        b.pos.addScaledVector(b.vel, sdt);

        const r = b.radius;
        // floor / bottom
        if (b.pos.y < -halfH + r) {
          b.pos.y = -halfH + r;
          b.vel.y = Math.abs(b.vel.y) * 0.3;
        } else if (b.pos.y > halfH - r) {
          b.pos.y = halfH - r;
          b.vel.y = -Math.abs(b.vel.y) * 0.3;
        }
        // side walls
        if (b.pos.x < -halfW + r) {
          b.pos.x = -halfW + r;
          b.vel.x = Math.abs(b.vel.x) * 0.3;
        } else if (b.pos.x > halfW - r) {
          b.pos.x = halfW - r;
          b.vel.x = -Math.abs(b.vel.x) * 0.3;
        }
        // depth walls
        if (b.pos.z < -halfD + r) {
          b.pos.z = -halfD + r;
          b.vel.z = Math.abs(b.vel.z) * 0.3;
        } else if (b.pos.z > halfD - r) {
          b.pos.z = halfD - r;
          b.vel.z = -Math.abs(b.vel.z) * 0.3;
        }
      }

      // pairwise repulsion (sphere approximation)
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          _d.subVectors(a.pos, b.pos);
          const min = a.radius + b.radius;
          const distSq = _d.lengthSq();
          if (distSq > 0 && distSq < min * min) {
            const dist = Math.sqrt(distSq);
            const overlap = (min - dist) * 0.5;
            _d.multiplyScalar(1 / dist);
            a.pos.addScaledVector(_d, overlap);
            b.pos.addScaledVector(_d, -overlap);
            // simple impulse along normal
            const rel =
              (a.vel.x - b.vel.x) * _d.x +
              (a.vel.y - b.vel.y) * _d.y +
              (a.vel.z - b.vel.z) * _d.z;
            if (rel < 0) {
              const imp = -rel * 0.5;
              a.vel.addScaledVector(_d, imp);
              b.vel.addScaledVector(_d, -imp);
              // a little tumble on contact (kept gentle)
              a.ang.addScaledVector(_d, imp * 0.2);
              b.ang.addScaledVector(_d, -imp * 0.2);
            }
          }
        }
      }

      // pointer shove — local, springy, amplified a little by cursor speed
      if (mouseActive.current) {
        const mr = mobile ? 1.4 : 1.7;
        const speed = Math.min(mouseVel.current.length(), 1.5);
        for (const b of bodies) {
          _d.subVectors(b.pos, mouse.current);
          _d.z = 0; // keep the shove in-plane
          const min = mr + b.radius;
          const distSq = _d.lengthSq();
          if (distSq < min * min && distSq > 1e-4) {
            const dist = Math.sqrt(distSq);
            _d.multiplyScalar(1 / dist);
            const push = (min - dist) * 3.2;
            b.vel.addScaledVector(_d, push);
            // amplify with cursor speed (bounded)
            b.vel.addScaledVector(mouseVel.current, 2.2 * (0.4 + speed));
            b.ang.x += (Math.random() - 0.5) * 1.1;
            b.ang.y += (Math.random() - 0.5) * 1.1;
          }
        }
      }

      // damping + velocity cap (prevents explosions)
      const MAX_V = 22;
      const MAX_A = 2.2; // cap angular speed so jacks never spin too fast
      for (const b of bodies) {
        b.vel.multiplyScalar(0.985);
        b.ang.multiplyScalar(0.82); // stronger angular damping -> calmer spin
        const vl = b.vel.lengthSq();
        if (vl > MAX_V * MAX_V) b.vel.multiplyScalar(MAX_V / Math.sqrt(vl));
        const al = b.ang.lengthSq();
        if (al > MAX_A * MAX_A) b.ang.multiplyScalar(MAX_A / Math.sqrt(al));
      }
    }

    // integrate rotation + write instance matrices
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const angLen = b.ang.length();
      if (angLen > 1e-4) {
        _e.set(b.ang.x * dt, b.ang.y * dt, b.ang.z * dt);
        _spin.setFromEuler(_e);
        b.quat.multiply(_spin).normalize();
      }
      _s.setScalar(b.scale);
      _m.compose(b.pos, b.quat, _s);
      mesh.setMatrixAt(i, _m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
