import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import audioEngine from '../../audio/AudioEngine'

const COUNT = 8500
const ARMS = 5
const MAX_RADIUS = 9.5

export default function GalaxyViz() {
  const meshRef = useRef()
  const baseData = useRef(null)
  const rotationOffset = useRef(0)
  const tempColor = useMemo(() => new THREE.Color(), [])

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)
    const siz = new Float32Array(COUNT)
    const data = new Float32Array(COUNT * 4)

    for (let i = 0; i < COUNT; i++) {
      const arm = i % ARMS
      const armAngle = (arm / ARMS) * Math.PI * 2
      const t = Math.pow(Math.random(), 1.35)
      const radius = 0.6 + t * MAX_RADIUS

      const spinAngle = radius * 0.75
      const angle = armAngle + spinAngle

      const spread = 0.45 * (0.8 + t * 1.3)
      const rx = (Math.random() - 0.5) * spread
      const ry = (Math.random() - 0.5) * 0.35 * (1.1 - t * 0.7)
      const rz = (Math.random() - 0.5) * spread

      pos[i * 3] = Math.cos(angle) * radius + rx
      pos[i * 3 + 1] = ry
      pos[i * 3 + 2] = Math.sin(angle) * radius + rz

      data[i * 4] = angle
      data[i * 4 + 1] = radius
      data[i * 4 + 2] = t
      data[i * 4 + 3] = arm

      const armBaseHue = arm / ARMS
      const c = new THREE.Color().setHSL((armBaseHue + t * 0.3) % 1.0, 0.9, 0.5)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b

      siz[i] = 1.2 + Math.random() * 2.0
    }

    baseData.current = data
    return { positions: pos, colors: col, sizes: siz }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const geo = meshRef.current.geometry
    const posAttr = geo.attributes.position
    const colAttr = geo.attributes.color
    const sizeAttr = geo.attributes.size
    const time = state.clock.elapsedTime
    const data = baseData.current

    const freq = audioEngine.getFrequencyData()
    const bass = audioEngine.getBass()
    const kick = audioEngine.isKick()
    const beatDecay = audioEngine.getBeatDecay()
    const energy = audioEngine.getEnergy()

    if (kick) rotationOffset.current += 0.08
    rotationOffset.current *= 0.95
    const baseRot = time * (0.2 + energy * 0.6) + rotationOffset.current

    for (let i = 0; i < COUNT; i++) {
      const i4 = i * 4
      const i3 = i * 3
      const baseAngle = data[i4]
      const baseRadius = data[i4 + 1]
      const t = data[i4 + 2]
      const arm = data[i4 + 3]

      const freqIndex = Math.floor((i / COUNT) * freq.length * 0.5)
      const freqVal = (freq[freqIndex] || 0) / 255

      const armRotSpeed = 1.0 / (1.0 + t * 1.8)
      const angle = baseAngle + baseRot * armRotSpeed

      const expand = 1.0 + bass * 0.35 + freqVal * 0.45 + (kick ? 0.2 : 0)
      const r = baseRadius * expand

      const yWave = Math.sin(time * 3.0 + r * 1.5) * 0.25 * (1 + bass * 2)
      const yKick = beatDecay * 0.6 * (1.0 - t)

      posAttr.array[i3] = Math.cos(angle) * r
      posAttr.array[i3 + 1] = yWave + (t < 0.25 ? yKick : 0)
      posAttr.array[i3 + 2] = Math.sin(angle) * r

      const armHue = (arm / ARMS) + (time * 0.05) + (t * 0.25) + (freqVal * 0.2)
      const sat = Math.min(1.0, 0.85 + freqVal * 0.15)
      const light = t < 0.15 
        ? Math.min(0.9, 0.6 + beatDecay * 0.3 + freqVal * 0.2)
        : Math.min(0.8, 0.45 + freqVal * 0.3 + beatDecay * 0.2)

      tempColor.setHSL(armHue % 1.0, sat, light)
      colAttr.array[i3] = tempColor.r
      colAttr.array[i3 + 1] = tempColor.g
      colAttr.array[i3 + 2] = tempColor.b

      sizeAttr.array[i] = 1.2 + freqVal * 4.2 + beatDecay * 3.2 + bass * 2.2
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    sizeAttr.needsUpdate = true

    meshRef.current.rotation.x = Math.PI * 0.18 + Math.sin(time * 0.5) * 0.08
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={COUNT} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={COUNT} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float s = size * (130.0 / -mvPosition.z);
            gl_PointSize = clamp(s, 1.0, 26.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float core = 1.0 - smoothstep(0.0, 0.25, d);
            float halo = exp(-d * 5.5);
            vec3 finalColor = vColor * (core * 0.7 + halo * 0.6);
            float alpha = (core + halo) * 0.6;
            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
      />
    </points>
  )
}
