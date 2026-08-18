import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import audioEngine from '../audio/AudioEngine'
import { generateDemoTrack } from '../audio/BeatGenerator'

const AudioContext = createContext(null)

export function AudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [trackName, setTrackName] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [vizMode, setVizMode] = useState('particles')
  const rafRef = useRef(null)

  useEffect(() => {
    let running = true
    const tick = () => {
      if (!running) return
      if (audioEngine.isReady) {
        setCurrentTime(audioEngine.currentTime)
        setDuration(audioEngine.duration)
        setIsPlaying(audioEngine.isPlaying)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => { running = false; cancelAnimationFrame(rafRef.current) }
  }, [])

  const loadFile = useCallback(async (file) => {
    await audioEngine.loadFile(file)
    setTrackName(file.name.replace(/\.[^.]+$/, ''))
    setIsReady(true)
    setDuration(audioEngine.duration)
    audioEngine.onEnded(() => setIsPlaying(false))
    audioEngine.play()
    setIsPlaying(true)
  }, [])

  const playDemo = useCallback(async () => {
    const blob = generateDemoTrack()
    const file = new File([blob], 'Cyber-Beat 128 BPM [Club Master].wav', { type: 'audio/wav' })
    await loadFile(file)
  }, [loadFile])

  const togglePlay = useCallback(() => {
    audioEngine.togglePlay()
    setIsPlaying(audioEngine.isPlaying)
  }, [])

  const seek = useCallback((frac) => {
    audioEngine.seek(frac)
  }, [])

  const seekRelative = useCallback((sec) => {
    audioEngine.seekRelative(sec)
  }, [])

  const changeVolume = useCallback((val) => {
    setVolume(val)
    audioEngine.setVolume(val)
  }, [])

  useEffect(() => {
    const handler = () => togglePlay()
    window.addEventListener('audio:togglePlay', handler)
    return () => window.removeEventListener('audio:togglePlay', handler)
  }, [togglePlay])

  const value = {
    isPlaying, isReady, trackName, currentTime, duration, volume, vizMode,
    loadFile, playDemo, togglePlay, seek, seekRelative, changeVolume, setVizMode,
    engine: audioEngine
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be within AudioProvider')
  return ctx
}
