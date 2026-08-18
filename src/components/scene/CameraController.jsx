import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import audioEngine from '../../audio/AudioEngine'

export default function CameraController() {
  const { camera } = useThree()

  useFrame(() => {
    const bass = audioEngine.getBass()
    const energy = audioEngine.getEnergy()
    const beatDecay = audioEngine.getBeatDecay()

    const dist = camera.position.length()
    if (dist < 22 && dist > 3) {
      const targetDist = 12 - bass * 3.0 - beatDecay * 1.5
      const newDist = THREE.MathUtils.lerp(dist, targetDist, 0.06)
      const dir = camera.position.clone().normalize()
      camera.position.copy(dir.multiplyScalar(newDist))
    }

    const targetFov = 60 + energy * 6 + beatDecay * 8
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.12)
    camera.updateProjectionMatrix()
  })

  return null
}
