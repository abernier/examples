import { useMemo } from 'react'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'

import { wallpaper, wood } from '../textures'

const BLOCKS = ['#e0453a', '#f2b632', '#2f6cb5', '#4e9e4a', '#e0453a', '#f2b632']

/** What was already on the floor when the box came down off the shelf. */
function Props() {
  return (
    <>
      {/* A tower of alphabet blocks, leaning the way a stack of six does. */}
      <group position={[-6.6, 0, -3.2]} rotation={[0, 0.4, 0]}>
        {BLOCKS.map((color, i) => (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[Math.sin(i * 1.7) * 0.06, 0.36 + i * 0.72, Math.cos(i * 2.1) * 0.06]}
            rotation={[0, i * 0.18 - 0.3, 0]}
          >
            <boxGeometry args={[0.72, 0.72, 0.72]} />
            <meshStandardMaterial color={color} roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* The ball that ends up under every bed. */}
      <mesh castShadow receiveShadow position={[6.9, 0.85, -2.4]}>
        <sphereGeometry args={[0.85, 32, 24]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.35} />
      </mesh>
      {/* Its stripe, a hair proud of the surface so it doesn't z-fight. */}
      <mesh position={[6.9, 0.85, -2.4]} rotation={[0.3, 0, 0.5]}>
        <torusGeometry args={[0.852, 0.13, 16, 48]} />
        <meshStandardMaterial color="#e0453a" roughness={0.35} />
      </mesh>

      {/* Two crayons, rolled to a stop. */}
      {[
        { x: -4.4, z: 5.4, r: 0.7, color: '#f2b632' },
        { x: -5.3, z: 4.6, r: 1.15, color: '#4e9e4a' },
      ].map((crayon) => (
        <mesh
          key={crayon.color}
          castShadow
          receiveShadow
          position={[crayon.x, 0.12, crayon.z]}
          rotation={[Math.PI / 2, 0, crayon.r]}
        >
          <cylinderGeometry args={[0.12, 0.12, 1.5, 14]} />
          <meshStandardMaterial color={crayon.color} roughness={0.6} />
        </mesh>
      ))}
    </>
  )
}

/**
 * A kid's bedroom in the late afternoon: floorboards, and the cloud wallpaper
 * every bedroom in a Pixar film has. Both are painted into canvases at startup —
 * see `textures.ts` — so the only thing this page fetches is the toys.
 *
 * The room is lit the way a room is: an `Environment` built out of Lightformers
 * — a bright window on one side, the ceiling above, the floor bouncing back —
 * so every toy is lit from all around and no side of one is ever black. It's
 * painted in the browser like the two textures, so the page still only fetches
 * the toys. The directional light is left over that only to cast; it sits high
 * and off the window side rather than behind either chair, because the camera
 * sits at both ends of the board and a key light behind it turns a whole army
 * into a silhouette.
 *
 * ContactShadows adds the dark line right under each toy that a shadow map at
 * this scale can't hold. drei's SoftShadows would be the third way and isn't
 * here: its PCSS patch calls `unpackRGBAToDepth`, which three dropped after the
 * version that demo pins, and every material in the scene fails to compile.
 */
export function Room() {
  const [boards, clouds] = useMemo(() => {
    const boards = wood()
    boards.repeat.set(6, 6)
    const clouds = wallpaper()
    clouds.repeat.set(3, 1.2)
    return [boards, clouds]
  }, [])

  return (
    <>
      <color attach="background" args={['#dfe9f2']} />
      <Environment resolution={256}>
        {/* The window, and the two panes of it: the one thing in the room
            bright enough to read as a source. */}
        <Lightformer form="rect" intensity={4} color="#e8f3ff" position={[9, 4.5, 1.6]} scale={[5, 7, 1]} />
        <Lightformer form="rect" intensity={4} color="#e8f3ff" position={[9, 4.5, -3.4]} scale={[5, 7, 1]} />
        {/* The ceiling, holding the daylight the window threw at it. */}
        <Lightformer form="rect" intensity={1.6} color="#fff4e2" position={[0, 11, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[22, 22, 1]} />
        {/* The floorboards, warm, bouncing it back up under every chin. */}
        <Lightformer form="rect" intensity={0.9} color="#f2c48e" position={[0, -3, 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[22, 22, 1]} />
        {/* And the three walls, so nothing turns to a cut-out when the camera
            swings round to the far end of the board. */}
        <Lightformer form="rect" intensity={0.8} color="#eef2f6" position={[-10, 4, 0]} scale={[10, 8, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#eef2f6" position={[0, 4, 12]} scale={[14, 8, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#eef2f6" position={[0, 4, -12]} scale={[14, 8, 1]} />
      </Environment>
      {/* Everything above lights; this one only casts. Off the window side and
          high, so it never stands behind whichever chair you're sitting in. */}
      <directionalLight
        castShadow
        position={[8, 14, 3]}
        intensity={1.6}
        color="#fff0d0"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0006}
      >
        <orthographicCamera attach="shadow-camera" args={[-14, 14, 14, -14, 0.5, 45]} />
      </directionalLight>

      <ContactShadows position={[0, 0.012, 0]} scale={34} blur={2.4} far={4} opacity={0.32} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={boards} roughness={0.6} />
      </mesh>

      {/* The wall, hung so its skirting lands just behind the far edge of the
          tray — the band between the two is all of it anyone ever sees. */}
      <group position={[0, 0, -12]}>
        <mesh position={[0, 6, 0]} receiveShadow>
          <planeGeometry args={[40, 12]} />
          <meshStandardMaterial map={clouds} roughness={0.95} />
        </mesh>
        <mesh position={[0, 0.35, 0.06]} receiveShadow>
          <boxGeometry args={[40, 0.7, 0.12]} />
          <meshStandardMaterial color="#f6f1e4" roughness={0.5} />
        </mesh>
      </group>
      <Props />
    </>
  )
}
