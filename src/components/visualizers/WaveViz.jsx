import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import audioEngine from '../../audio/AudioEngine'

const SEGMENTS = 512
const WIDTH = 14
const LAYERS = 5

function WaveLayer({ layerIndex, totalLayers }) {
  const meshRef = useRef()
  const prevY = useRef(new Float32Array(SEGMENTS).fill(0))
  const tempColor = useMemo(() => new THREE.Color(), [])

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(SEGMENTS * 3)
    const col = new Float32Array(SEGMENTS * 3)
    for (let i = 0; i < SEGMENTS; i++) {
      const t = i / SEGMENTS
      pos[i * 3] = (t - 0.5) * WIDTH
      pos[i * 3 + 1] = 0
      pos[i * 3 + 2] = (layerIndex - totalLayers / 2) * 1.2
      col[i * 3] = 0.2
      col[i * 3 + 1] = 0.2
      col[i * 3 + 2] = 0.25
    }
    return { positions: pos, colors: col }
  }, [layerIndex, totalLayers])

  useFrame((state) => {
    if (!meshRef.current) return
    const geo = meshRef.current.geometry
    const posAttr = geo.attributes.position
    const colAttr = geo.attributes.color
    const time = state.clock.elapsedTime
    const prev = prevY.current

    const waveform = audioEngine.getWaveformData()
    const freq = audioEngine.getFrequencyData()
    const energy = audioEngine.getEnergy()
    const beatDecay = audioEngine.getBeatDecay()

    const layerOffset = layerIndex / totalLayers
    const layerAmplitude = 1.0 - layerOffset * 0.3

    for (let i = 0; i < SEGMENTS; i++) {
      const i3 = i * 3
      const t = i / SEGMENTS

      const waveIndex = Math.floor(t * waveform.length)
      const waveVal = ((waveform[waveIndex] || 128) - 128) / 128

      const freqIndex = Math.floor(t * freq.length * 0.5)
      const freqVal = (freq[freqIndex] || 0) / 255

      const amplitude = 2.5 + energy * 6.0 + beatDecay * 3.0
      const targetY = waveVal * amplitude * layerAmplitude + freqVal * 1.5

      const rate = Math.abs(targetY) > Math.abs(prev[i]) ? 0.6 : 0.15
      prev[i] += (targetY - prev[i]) * rate
      const y = prev[i]

      posAttr.array[i3 + 1] = y

      const layerHueOffset = layerIndex / totalLayers
      const hue = (t * 1.5 + layerHueOffset * 0.4 + time * 0.12 + freqVal * 0.3) % 1.0
      const sat = 0.95
      const light = Math.min(0.85, 0.45 + (Math.abs(y) / 4.0) * 0.35 + beatDecay * 0.2)

      tempColor.setHSL(hue, sat, light)
      colAttr.array[i3] = tempColor.r
      colAttr.array[i3 + 1] = tempColor.g
      colAttr.array[i3 + 2] = tempColor.b
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
  })

  const opacity = 1.0 - (layerIndex / totalLayers) * 0.5

  return (
    <line ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={SEGMENTS} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={SEGMENTS} array={colors} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={opacity}
        linewidth={1}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </line>
  )
}

export default function WaveViz() {
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    const energy = audioEngine.getEnergy()
    const time = state.clock.elapsedTime
    groupRef.current.rotation.y = Math.sin(time * 0.15) * 0.2
    groupRef.current.rotation.x = energy * 0.15
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: LAYERS }, (_, i) => (
        <WaveLayer key={i} layerIndex={i} totalLayers={LAYERS} />
      ))}
    </group>
  )
}
