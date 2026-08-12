import * as THREE from "three";
import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  MeshTransmissionMaterial,
  Sparkles,
} from "@react-three/drei";
import {
  BallCollider,
  CylinderCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { createBeanGeometry } from "./beanGeometry";

const BEAN_COUNT = 40;

const ROASTS = [
  { color: "#4a2a16", roughness: 0.5 },
  { color: "#351e12", roughness: 0.42 },
  { color: "#5d371c", roughness: 0.55 },
  { color: "#2a180f", roughness: 0.35 },
  { color: "#7a4622", roughness: 0.6 },
];

const rand = THREE.MathUtils.randFloatSpread;

/* ------------------------------------------------------------------ beans */

type BeanProps = {
  geometry: THREE.BufferGeometry;
  color: string;
  roughness: number;
  seed: number;
};

function Bean({ geometry, color, roughness, seed }: BeanProps) {
  const api = useRef<RapierRigidBody>(null);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const swirl = useMemo(() => new THREE.Vector3(), []);

  const position = useMemo<[number, number, number]>(() => {
    const a = seed * 2.399963; // golden angle, keeps the initial ring even
    const r = 3.7 + (seed % 6) * 0.66;
    return [Math.cos(a) * r, Math.sin(a) * r * 0.86, rand(5)];
  }, [seed]);

  const spin = useMemo(
    () => ({ x: rand(4), y: rand(4), z: rand(4) }),
    [],
  );

  useFrame((_state, delta) => {
    const body = api.current;
    if (!body) return;
    const d = Math.min(0.08, delta);
    const t = body.translation();

    // gravity of our own: a pull toward the vessel plus a tangential nudge,
    // so the beans orbit it instead of collapsing onto it
    vec.set(t.x, t.y, t.z * 1.6).negate().multiplyScalar(0.85 * d);
    const r = Math.hypot(t.x, t.y);
    if (r > 0.001) {
      swirl.set(-t.y / r, t.x / r, 0).multiplyScalar(0.11 * d);
      vec.add(swirl);
    }
    body.applyImpulse(vec, true);
  });

  return (
    <RigidBody
      ref={api}
      position={position}
      colliders={false}
      linearDamping={1.9}
      angularDamping={0.3}
      friction={0.2}
      restitution={0.35}
      angularVelocity={[spin.x, spin.y, spin.z]}
    >
      <BallCollider args={[0.46]} />
      <mesh geometry={geometry} scale={0.52}>
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={0.08}
          envMapIntensity={0.9}
        />
      </mesh>
    </RigidBody>
  );
}

/* ---------------------------------------------------------------- pointer */

function Pointer() {
  const ref = useRef<RapierRigidBody>(null);
  const vec = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ pointer, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0,
      ),
    );
  });
  return (
    <RigidBody
      ref={ref}
      type="kinematicPosition"
      colliders={false}
      position={[0, 0, 0]}
    >
      <BallCollider args={[1.7]} />
    </RigidBody>
  );
}

/* ----------------------------------------------------------------- vessel */

function carafeProfile() {
  const pts: THREE.Vector2[] = [];
  const shape: [number, number][] = [
    [0.02, -3.1],
    [1.5, -3.05],
    [2.05, -2.5],
    [2.15, -1.5],
    [1.7, -0.5],
    [0.95, 0.1],
    [1.35, 0.85],
    [2.1, 2.2],
    [2.3, 2.95],
  ];
  for (const [x, y] of shape) pts.push(new THREE.Vector2(x, y));
  return pts;
}

function brewProfile() {
  const pts: THREE.Vector2[] = [];
  const shape: [number, number][] = [
    [0.02, -2.95],
    [1.42, -2.9],
    [1.94, -2.45],
    [2.02, -1.6],
    [1.72, -0.95],
    [0.02, -0.9],
  ];
  for (const [x, y] of shape) pts.push(new THREE.Vector2(x, y));
  return pts;
}

function Vessel() {
  const group = useRef<THREE.Group>(null);
  const glass = useMemo(
    () => new THREE.LatheGeometry(carafeProfile(), 64),
    [],
  );
  const brew = useMemo(() => new THREE.LatheGeometry(brewProfile(), 48), []);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
    group.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.6) * 0.12 - 0.2;
  });

  return (
    <RigidBody type="fixed" colliders={false} position={[0, -0.2, 0]}>
      <CylinderCollider args={[3.1, 2.25]} />
      <group ref={group}>
        {/* glass body */}
        <mesh geometry={glass}>
          <MeshTransmissionMaterial
            samples={4}
            resolution={256}
            thickness={0.28}
            roughness={0.04}
            anisotropicBlur={0.15}
            chromaticAberration={0.07}
            distortion={0.08}
            distortionScale={0.2}
            temporalDistortion={0.0}
            ior={1.42}
            color="#fff3e5"
            attenuationColor="#f0d6b6"
            attenuationDistance={12}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* the coffee sitting in the bottom */}
        <mesh geometry={brew}>
          <meshStandardMaterial
            color="#3a1c0c"
            roughness={0.16}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* wooden collar at the waist */}
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.12, 0.26, 16, 64]} />
          <meshStandardMaterial color="#6d4526" roughness={0.85} />
        </mesh>
        {/* leather tie */}
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.15, 0.06, 8, 64]} />
          <meshStandardMaterial color="#22150d" roughness={0.6} />
        </mesh>
      </group>
    </RigidBody>
  );
}

/* ------------------------------------------------------------- camera rig */

function CameraRig() {
  useFrame((state, delta) => {
    const k = 1 - Math.pow(0.001, delta);
    state.camera.position.x +=
      (state.pointer.x * 2.4 - state.camera.position.x) * k;
    state.camera.position.y +=
      (state.pointer.y * 1.4 + 0.4 - state.camera.position.y) * k;
    state.camera.lookAt(0, -0.2, 0);
  });
  return null;
}

/* ------------------------------------------------------------------ scene */

export default function HeroScene({ active = true }: { active?: boolean }) {
  const geometry = useMemo(() => createBeanGeometry("high"), []);
  const beans = useMemo(
    () =>
      Array.from({ length: BEAN_COUNT }, (_, i) => ({
        seed: i + 1,
        ...ROASTS[i % ROASTS.length],
      })),
    [],
  );

  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0.4, 22], fov: 30, near: 1, far: 60 }}
    >
      <color attach="background" args={["#150e09"]} />
      <fog attach="fog" args={["#150e09", 26, 46]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 8, 6]} intensity={1.1} color="#ffd9ac" />
      <directionalLight position={[-8, -4, 2]} intensity={0.4} color="#b8552a" />

      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]} timeStep="vary">
          <Pointer />
          <Vessel />
          {beans.map((b) => (
            <Bean key={b.seed} geometry={geometry} {...b} />
          ))}
        </Physics>

        <Sparkles
          count={70}
          scale={[22, 14, 10]}
          size={3}
          speed={0.25}
          opacity={0.5}
          color="#f0b978"
        />

        <Environment resolution={256}>
          <group rotation={[-Math.PI / 4, -0.3, 0]}>
            <Lightformer
              form="circle"
              intensity={9}
              color="#ffb066"
              rotation-x={Math.PI / 2}
              position={[0, 6, -7]}
              scale={9}
            />
            <Lightformer
              form="rect"
              intensity={4}
              color="#fff1de"
              rotation-y={Math.PI / 2}
              position={[-8, 1, 0]}
              scale={[12, 5, 1]}
            />
            <Lightformer
              form="rect"
              intensity={2.2}
              color="#ff7a3d"
              rotation-y={-Math.PI / 2}
              position={[9, -2, 1]}
              scale={[10, 6, 1]}
            />
            <Lightformer
              form="ring"
              intensity={5}
              color="#ffd7a3"
              scale={7}
              position={[4, 6, 4]}
              onUpdate={(self) => self.lookAt(0, 0, 0)}
            />
          </group>
        </Environment>
      </Suspense>

      <CameraRig />
    </Canvas>
  );
}
