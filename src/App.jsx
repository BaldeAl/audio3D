import { useEffect } from 'react'
import { AudioProvider } from './context/AudioContext'
import Scene3D from './components/scene/Scene3D'
import TopBar from './components/ui/TopBar'
import WelcomePanel from './components/ui/WelcomePanel'
import ControlsPanel from './components/ui/ControlsPanel'
import DropZone from './components/ui/DropZone'
import LoadingScreen from './components/ui/LoadingScreen'

export default function App() {
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('audio:togglePlay'))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <AudioProvider>
      <LoadingScreen />
      <Scene3D />
      <TopBar />
      <WelcomePanel />
      <ControlsPanel />
      <DropZone />
    </AudioProvider>
  )
}
