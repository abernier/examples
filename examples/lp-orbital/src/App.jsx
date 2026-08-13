import { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import * as THREE from 'three'

import Scene from './scene/Scene.jsx'
import Page from './site/Page.jsx'
import { bindViewListeners } from './store.js'

export default function App() {
  useEffect(() => bindViewListeners(), [])

  return (
    <>
      <div className="stage" aria-hidden="true">
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          camera={{ fov: 42, near: 0.5, far: 200, position: [0, 1.4, 21] }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.05
          }}
        >
          <Suspense fallback={null}>
            <Scene />
            <Preload all />
          </Suspense>
        </Canvas>
      </div>

      <div className="hud" aria-hidden="true">
        <div className="hud__grid" />
        <span className="hud__tick hud__tick--tl" />
        <span className="hud__tick hud__tick--tr" />
        <span className="hud__tick hud__tick--bl" />
        <span className="hud__tick hud__tick--br" />
      </div>

      <Page />
    </>
  )
}
