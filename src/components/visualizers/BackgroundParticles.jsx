import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import audioEngine from '../../audio/AudioEngine'

const COUNT = 1500

export default function BackgroundParticles() {
  const meshRef = useRef()

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const siz = new Float32Array(COUNT)
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 45
      pos[i * 3 + 1] = (Math.random() - 0.5) * 45
      pos[i * 3 + 2] = (Math.random() - 0.5) * 45
      siz[i] = Math.random() * 1.5
    }
    return { positions: pos, sizes: siz }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime
    const sizeAttr = meshRef.current.geometry.attributes.size
    const bass = audioEngine.getBass()
    const beatDecay = audioEngine.getBeatDecay()

    for (let i = 0; i < COUNT; i++) {
      sizeAttr.array[i] = 0.3 + Math.sin(time * 0.3 + i * 0.05) * 0.2 + bass * 1.0 + beatDecay * 2.0
    }
    sizeAttr.needsUpdate = true
    meshRef.current.rotation.y = time * 0.005
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={COUNT} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float size;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (80.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * 0.08;
            gl_FragColor = vec4(0.4, 0.5, 0.6, alpha);
          }
        `}
      />
    </points>
  )
}
