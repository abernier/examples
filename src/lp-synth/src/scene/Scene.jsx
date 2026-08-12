import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

import { Rack } from '../rack/Rack'
import Rig from './Rig'

export default function Scene({ scroll }) {
  return (
    <>
      <color attach="background" args={['#07080a']} />
      <fog attach="fog" args={['#07080a', 9, 26]} />

      <ambientLight intensity={0.6} />
      {/* Key light from the top left, the way a bench lamp sits over a case */}
      <spotLight position={[-4, 5, 6]} angle={0.8} penumbra={1} intensity={160} color="#dfe7ff" />
      <spotLight position={[5, -3, 5]} angle={0.9} penumbra={1} intensity={60} color="#ff9a3d" />

      <Rack rotation={[0.04, -0.1, 0]} />

      {/* Softboxes: aluminium faceplates and plated jacks are all reflection, so
          the environment does more for the look here than the lights do. */}
      <Environment resolution={128}>
        <Lightformer intensity={7} rotation-x={Math.PI / 2} position={[0, 5, -2]} scale={[12, 6, 1]} />
        <Lightformer intensity={5} rotation-y={Math.PI / 2} position={[-7, 1, 2]} scale={[12, 5, 1]} />
        <Lightformer intensity={3.5} rotation-y={-Math.PI / 2} position={[7, 0, 2]} scale={[12, 5, 1]} />
        <Lightformer form="ring" intensity={4} color="#ff8a1f" position={[-3, -2, 4]} scale={3} />
        <Lightformer form="ring" intensity={3} color="#2ff0d0" position={[4, 2, 4]} scale={2.4} />
      </Environment>

      <Rig scroll={scroll} />

      <EffectComposer enableNormalPass={false}>
        <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.75} luminanceSmoothing={0.25} />
        <Vignette offset={0.3} darkness={0.8} />
      </EffectComposer>
    </>
  )
}
