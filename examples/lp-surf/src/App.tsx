import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, Scroll, ScrollControls, useScroll } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'

import { Content } from './Content'
import { Scene } from './three/Scene'
import { jumpToPage, setScrollEl } from './scrollBus'

const PAGES = 7

/** Publishes the ScrollControls container so the fixed nav can drive it. */
function ScrollBridge() {
  const scroll = useScroll()
  useEffect(() => {
    setScrollEl(scroll.el)
    // The browser restores the scroll offset of this container on reload,
    // which would drop a first-time visitor halfway into the dive.
    const t = window.setTimeout(() => {
      scroll.el.scrollTop = 1
    }, 80)
    return () => {
      window.clearTimeout(t)
      setScrollEl(null)
    }
  }, [scroll.el])
  return null
}

function Nav() {
  return (
    <nav className="nav">
      <button className="nav__brand" type="button" onClick={() => jumpToPage(0)}>
        <span className="nav__mark" aria-hidden="true" />
        Côte Sauvage
      </button>
      <div className="nav__links">
        <button type="button" onClick={() => jumpToPage(2)}>
          Lessons
        </button>
        <button type="button" onClick={() => jumpToPage(3)}>
          Coaches
        </button>
        <button type="button" onClick={() => jumpToPage(4)}>
          Spots
        </button>
        <button className="nav__cta" type="button" onClick={() => jumpToPage(6)}>
          Book
        </button>
      </div>
    </nav>
  )
}

export default function App() {
  const [dpr, setDpr] = useState(1.25)

  return (
    <>
      <div className="stage">
        <Canvas
          dpr={dpr}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          camera={{ position: [0, 6.2, 46], fov: 48, near: 0.5, far: 6000 }}
        >
          <PerformanceMonitor
            onIncline={() => setDpr(1.5)}
            onDecline={() => setDpr(1)}
            flipflops={3}
            onFallback={() => setDpr(1)}
          />
          <Suspense fallback={null}>
            <ScrollControls pages={PAGES} damping={0.28} distance={1}>
              <ScrollBridge />
              <Scene />
              <Scroll html style={{ width: '100%' }}>
                <Content />
              </Scroll>
            </ScrollControls>
            <EffectComposer multisampling={2} enableNormalPass={false}>
              <Bloom mipmapBlur intensity={0.32} luminanceThreshold={0.92} luminanceSmoothing={0.24} />
              <Vignette offset={0.24} darkness={0.7} />
            </EffectComposer>
          </Suspense>
        </Canvas>
      </div>
      <Nav />
    </>
  )
}
