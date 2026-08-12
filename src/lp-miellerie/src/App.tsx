import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'

import Experience from './three/Experience'
import Overlay from './site/Overlay'

export default function App() {
  // Shared 0..1 scroll progress. The DOM overlay writes it, the canvas reads it
  // in useFrame — no state, no re-render.
  const scroll = useRef(0)

  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        camera={{ position: [0, 0, 7.5], fov: 40, near: 0.5, far: 40 }}
        eventSource={document.getElementById('root')!}
        eventPrefix="client"
      >
        <Suspense fallback={null}>
          <Experience scroll={scroll} />
        </Suspense>
      </Canvas>
      <Overlay scroll={scroll} />
    </>
  )
}
