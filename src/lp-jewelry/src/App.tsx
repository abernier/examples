import { Suspense } from 'react'
import { Experience } from './three/Experience'
import { Content } from './site/Content'

export default function App() {
  return (
    <>
      <div className="canvas-layer">
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </div>
      <Content />
    </>
  )
}
