import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import audioEngine from '../../audio/AudioEngine'

const BAR_COUNT = 80
const RADIUS = 5.2

export default function BarsViz() {
  const groupRef = useRef()
  const meshRefs = useRef([])
  const capRefs = useRef([])
  const materialRefs = useRef([])
  const prevHeights = useRef(new Float32Array(BAR_COUNT).fill(0.1))

  const barData = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const angle = (i / BAR_COUNT) * Math.PI * 2
      return {
        angle,
        x: Math.cos(angle) * RADIUS,
        z: Math.sin(angle) * RADIUS,
      }
    })
  }, [])

  const tempColor = useMemo(() => new THREE.Color(), [])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    const freq = audioEngine.getFrequencyData()
    const bass = audioEngine.getBass()
    const beatDecay = audioEngine.getBeatDecay()
    const energy = audioEngine.getEnergy()
    const kick = audioEngine.isKick()
    const prev = prevHeights.current

    for (let i = 0; i < BAR_COUNT; i++) {
      const mesh = meshRefs.current[i]
      const cap = capRefs.current[i]
      const mat = materialRefs.current[i]
      if (!mesh || !mat) continue

      const t = i / BAR_COUNT
      const freqIndex = Math.floor(Math.pow(t, 0.75) * freq.length * 0.5)
      const freqVal = (freq[freqIndex] || 0) / 255

      const targetHeight = 0.15 + freqVal * 6.5 + bass * 2.2 + beatDecay * 1.8
      const attackRate = targetHeight > prev[i] ? 0.65 : 0.14
      prev[i] += (targetHeight - prev[i]) * attackRate
      const h = prev[i]

      mesh.scale.y = h
      mesh.position.y = h * 0.5

      if (cap) {
        cap.position.y = h + 0.12
      }

      const hue = (t * 1.2 + time * 0.1 + freqVal * 0.2) % 1.0
      const sat = 0.9
      const light = Math.min(0.75, 0.4 + freqVal * 0.35 + beatDecay * 0.2)

      tempColor.setHSL(hue, sat, light)
      mat.color.copy(tempColor)
      mat.emissive.copy(tempColor).multiplyScalar(0.45 + freqVal * 0.75 + beatDecay * 0.6)
    }

    groupRef.current.rotation.y += 0.003 + energy * 0.015
    if (kick) groupRef.current.rotation.y += 0.04
    groupRef.current.rotation.x = Math.sin(time * 0.3) * 0.08
  })

  return (
    <group ref={groupRef}>
      {barData.map((bar, i) => (
        <group key={i} position={[bar.x, 0, bar.z]} rotation={[0, -bar.angle + Math.PI / 2, 0]}>
          <mesh ref={(el) => { meshRefs.current[i] = el }}>
            <boxGeometry args={[0.22, 1, 0.22]} />
            <meshStandardMaterial
              ref={(el) => { materialRefs.current[i] = el }}
              color="#00e5ff"
              emissive="#00e5ff"
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.8}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={(el) => { capRefs.current[i] = el }} position={[0, 1, 0]}>
            <boxGeometry args={[0.26, 0.06, 0.26]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
