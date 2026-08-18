import { useFrame } from '@react-three/fiber'
import audioEngine from '../../audio/AudioEngine'

export default function AudioUpdater() {
  useFrame(() => {
    audioEngine.update()
  }, -100)

  return null
}
