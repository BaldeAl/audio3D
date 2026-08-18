import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Suspense } from 'react'
import { useAudio } from '../../context/AudioContext'
import ParticlesViz from '../visualizers/ParticlesViz'
import BarsViz from '../visualizers/BarsViz'
import WaveViz from '../visualizers/WaveViz'
import GalaxyViz from '../visualizers/GalaxyViz'
import BackgroundParticles from '../visualizers/BackgroundParticles'
import CameraController from './CameraController'
import AudioUpdater from './AudioUpdater'

function ActiveVisualizer({ mode }) {
  switch (mode) {
    case 'particles': return <ParticlesViz key="particles" />
    case 'bars': return <BarsViz key="bars" />
    case 'wave': return <WaveViz key="wave" />
    case 'galaxy': return <GalaxyViz key="galaxy" />
    default: return <ParticlesViz key="particles-def" />
  }
}

export default function Scene3D() {
  const { vizMode } = useAudio()

  return (
    <div className="canvas-container">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: 3,
        }}
        style={{ background: '#0a0a0a' }}
      >
        <PerspectiveCamera makeDefault position={[0, 2, 12]} fov={60} near={0.1} far={100} />
        <AudioUpdater />
        <CameraController />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={25}
          dampingFactor={0.05}
          enableDamping
        />

        <ambientLight intensity={0.08} color="#334455" />
        <pointLight position={[10, 8, 8]} intensity={0.3} color="#00e5ff" />
        <pointLight position={[-8, -4, -8]} intensity={0.2} color="#ff3d00" />

        <fog attach="fog" args={['#0a0a0a', 18, 40]} />

        <Suspense fallback={null}>
          <BackgroundParticles />
          <ActiveVisualizer mode={vizMode} />
        </Suspense>

        <EffectComposer>
          <Bloom
            intensity={0.65}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0006, 0.0006]}
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
