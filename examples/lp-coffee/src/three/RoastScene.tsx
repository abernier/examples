import * as THREE from "three";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { createBeanGeometry, roastColor } from "./beanGeometry";

type TrioProps = { roast: number };

// creases kept roughly toward camera (small x/y rotations) so the bean reads
const LAYOUT: { pos: [number, number, number]; rot: [number, number, number]; s: number }[] =
  [
    { pos: [-1.85, 0.55, -0.3], rot: [0.18, -0.35, 0.85], s: 0.8 },
    { pos: [0.1, -0.15, 0.5], rot: [-0.22, 0.2, -0.25], s: 0.95 },
    { pos: [1.95, 0.5, -0.5], rot: [0.3, 0.4, 1.5], s: 0.76 },
  ];

function Beans({ roast }: TrioProps) {
  const geometry = useMemo(() => createBeanGeometry("low"), []);
  const group = useRef<THREE.Group>(null);
  const materials = useRef<THREE.MeshStandardMaterial[]>([]);
  const target = useMemo(() => new THREE.Color(), []);

  useFrame((state, delta) => {
    if (group.current) {
      // a slow sway rather than a full spin, so the creases stay readable
      group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.5;
      group.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.42) * 0.14;
    }
    roastColor(roast, target);
    // darker roasts get oilier: less roughness, a touch more sheen
    for (const m of materials.current) {
      if (!m) continue;
      m.color.lerp(target, 1 - Math.pow(0.002, delta));
      m.roughness = THREE.MathUtils.lerp(0.75, 0.28, roast);
    }
  });

  return (
    <group ref={group}>
      {LAYOUT.map((l, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={l.pos}
          rotation={l.rot}
          scale={l.s}
        >
          <meshStandardMaterial
            ref={(m) => {
              if (m) materials.current[i] = m;
            }}
            color="#93a06a"
            roughness={0.75}
            metalness={0.05}
            envMapIntensity={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function RoastScene({
  roast,
  active = true,
}: TrioProps & { active?: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      gl={{ antialias: true, toneMappingExposure: 0.82 }}
      camera={{ position: [0, 0.5, 7.4], fov: 32 }}
    >
      <ambientLight intensity={0.32} />
      <directionalLight position={[3, 5, 5]} intensity={0.95} color="#ffdcb4" />
      <directionalLight position={[-4, -2, -3]} intensity={0.35} color="#c0521f" />
      <Beans roast={roast} />
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#fff0dc"
          position={[-5, 3, 2]}
          scale={[8, 5, 1]}
          rotation-y={Math.PI / 2}
        />
        <Lightformer
          form="circle"
          intensity={3}
          color="#ffb266"
          position={[3, 4, -3]}
          scale={6}
          rotation-x={Math.PI / 2}
        />
      </Environment>
    </Canvas>
  );
}
