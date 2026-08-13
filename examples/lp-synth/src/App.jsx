import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'

import Scene from './scene/Scene'
import Page from './site/Page'

export default function App() {
  // 0..1 scroll progress, written by the DOM, read in useFrame. No re-render.
  const scroll = useRef(0)

  return (
    <>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0.6, 0.4, 8.2], fov: 38, near: 0.1, far: 60 }}
        eventSource={document.getElementById('root')}
        eventPrefix="client"
      >
        <Suspense fallback={null}>
          <Scene scroll={scroll} />
        </Suspense>
      </Canvas>
      <Page scroll={scroll} />
    </>
  )
}
