import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import audioEngine from '../../audio/AudioEngine'

const COUNT = 7000
const RADIUS = 5.2

export default function ParticlesViz() {
  const meshRef = useRef()
  const basePositions = useRef(null)
  const velocities = useRef(null)
  const tempColor = useMemo(() => new THREE.Color(), [])

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const col = new Float32Array(COUNT * 3)
    const siz = new Float32Array(COUNT)
    const vel = new Float32Array(COUNT * 3)

    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      const r = RADIUS * (0.85 + 0.15 * Math.random())

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      const hue = (i / COUNT) * 360
      const c = new THREE.Color().setHSL(hue / 360, 0.95, 0.55)
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b

      siz[i] = 1.4 + Math.random() * 2.2
      vel[i * 3] = 0
      vel[i * 3 + 1] = 0
      vel[i * 3 + 2] = 0
    }

    basePositions.current = new Float32Array(pos)
    velocities.current = vel
    return { positions: pos, colors: col, sizes: siz }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const geo = meshRef.current.geometry
    const posAttr = geo.attributes.position
    const colAttr = geo.attributes.color
    const sizeAttr = geo.attributes.size
    const time = state.clock.elapsedTime
    const vel = velocities.current

    const freq = audioEngine.getFrequencyData()
    const bass = audioEngine.getBass()
    const rawBass = audioEngine.getRawBass()
    const kick = audioEngine.isKick()
    const beatDecay = audioEngine.getBeatDecay()
    const energy = audioEngine.getEnergy()

    const kickForce = kick ? 2.8 + rawBass * 3.8 : 0

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const bx = basePositions.current[i3]
      const by = basePositions.current[i3 + 1]
      const bz = basePositions.current[i3 + 2]

      const dist = Math.sqrt(bx * bx + by * by + bz * bz)
      const nx = bx / dist
      const ny = by / dist
      const nz = bz / dist

      const freqIndex = Math.floor((i / COUNT) * freq.length * 0.55)
      const freqVal = (freq[freqIndex] || 0) / 255

      if (kick) {
        const kickRand = kickForce * (0.6 + 0.8 * Math.random())
        vel[i3] += nx * kickRand
        vel[i3 + 1] += ny * kickRand
        vel[i3 + 2] += nz * kickRand
      }

      vel[i3] *= 0.83
      vel[i3 + 1] *= 0.83
      vel[i3 + 2] *= 0.83

      const wave = Math.sin(time * 3.5 + (bx * 0.8 + by * 1.2 + bz * 0.5)) * 0.25 * (1 + energy * 2)
      const freqPush = freqVal * 3.4 + bass * 1.6

      posAttr.array[i3] = bx + nx * (freqPush + wave) + vel[i3]
      posAttr.array[i3 + 1] = by + ny * (freqPush + wave) + vel[i3 + 1]
      posAttr.array[i3 + 2] = bz + nz * (freqPush + wave) + vel[i3 + 2]

      const angle = Math.atan2(bz, bx)
      const normAngle = (angle + Math.PI) / (Math.PI * 2)
      const normY = (by / RADIUS + 1) * 0.5
      
      const hue = (normAngle * 0.6 + normY * 0.4 + time * 0.08 + freqVal * 0.35 + (i % 7) * 0.04) % 1.0
      const sat = 0.85 + freqVal * 0.15
      const light = Math.min(0.85, 0.42 + freqVal * 0.38 + beatDecay * 0.25)

      tempColor.setHSL(hue, sat, light)
      colAttr.array[i3] = tempColor.r
      colAttr.array[i3 + 1] = tempColor.g
      colAttr.array[i3 + 2] = tempColor.b

      sizeAttr.array[i] = 1.4 + freqVal * 4.8 + beatDecay * 3.2 + bass * 2.2
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    sizeAttr.needsUpdate = true

    meshRef.current.rotation.y += 0.005 + energy * 0.022
    meshRef.current.rotation.x = Math.sin(time * 0.4) * 0.18 + bass * 0.14
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
            float s = size * (120.0 / -mvPosition.z);
            gl_PointSize = clamp(s, 1.0, 24.0);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float core = 1.0 - smoothstep(0.0, 0.2, d);
            float halo = exp(-d * 6.0);
            vec3 finalColor = vColor * (core * 0.8 + halo * 0.7);
            float alpha = (core + halo) * 0.65;
            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
      />
    </points>
  )
}
