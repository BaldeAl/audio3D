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
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [vizMode, setVizMode] = useState('particles')

  const [playlist, setPlaylist] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState('all')
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)

  const rafRef = useRef(null)
  const playlistRef = useRef([])
  const currentIndexRef = useRef(-1)
  const isShuffleRef = useRef(false)
  const isRepeatRef = useRef('all')

  playlistRef.current = playlist
  currentIndexRef.current = currentIndex
  isShuffleRef.current = isShuffle
  isRepeatRef.current = isRepeat

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

  const playTrackAtIndex = useCallback(async (index, list = playlistRef.current) => {
    if (!list || index < 0 || index >= list.length) return
    const item = list[index]
    await audioEngine.loadFile(item.file)
    setTrackName(item.name)
    setCurrentIndex(index)
    setIsReady(true)
    setDuration(audioEngine.duration)
    audioEngine.play()
    setIsPlaying(true)
  }, [])

  const nextTrack = useCallback(() => {
    const list = playlistRef.current
    const curr = currentIndexRef.current
    const shuffle = isShuffleRef.current
    const repeat = isRepeatRef.current

    if (list.length === 0) return

    if (repeat === 'one' && curr >= 0) {
      playTrackAtIndex(curr)
      return
    }

    if (shuffle && list.length > 1) {
      let nextIdx = Math.floor(Math.random() * list.length)
      if (nextIdx === curr) nextIdx = (curr + 1) % list.length
      playTrackAtIndex(nextIdx)
      return
    }

    const nextIdx = curr + 1
    if (nextIdx < list.length) {
      playTrackAtIndex(nextIdx)
    } else if (repeat === 'all') {
      playTrackAtIndex(0)
    } else {
      setIsPlaying(false)
    }
  }, [playTrackAtIndex])

  const prevTrack = useCallback(() => {
    const list = playlistRef.current
    const curr = currentIndexRef.current
    const shuffle = isShuffleRef.current

    if (list.length === 0) return

    if (audioEngine.currentTime > 3) {
      audioEngine.seek(0)
      return
    }

    if (shuffle && list.length > 1) {
      let prevIdx = Math.floor(Math.random() * list.length)
      if (prevIdx === curr) prevIdx = (curr - 1 + list.length) % list.length
      playTrackAtIndex(prevIdx)
      return
    }

    const prevIdx = curr - 1
    if (prevIdx >= 0) {
      playTrackAtIndex(prevIdx)
    } else {
      playTrackAtIndex(list.length - 1)
    }
  }, [playTrackAtIndex])

  useEffect(() => {
    audioEngine.onEnded(() => {
      nextTrack()
    })
  }, [nextTrack])

  const addFiles = useCallback((files) => {
    const audioFiles = Array.from(files).filter(f => {
      const name = f.name.toLowerCase()
      return f.type.startsWith('audio/') || 
        name.endsWith('.mp3') || name.endsWith('.wav') || 
        name.endsWith('.flac') || name.endsWith('.ogg') || 
        name.endsWith('.aac') || name.endsWith('.m4a') || 
        name.endsWith('.wma')
    })

    if (audioFiles.length === 0) return

    const newTracks = audioFiles.map((file, idx) => ({
      id: `${Date.now()}_${idx}_${Math.random()}`,
      name: file.name.replace(/\.[^.]+$/, ''),
      file: file,
      size: file.size
    }))

    setPlaylist(prev => {
      const updated = [...prev, ...newTracks]
      if (currentIndexRef.current === -1 || !audioEngine.isReady) {
        playTrackAtIndex(prev.length, updated)
      }
      return updated
    })
  }, [playTrackAtIndex])

  const loadFile = useCallback(async (file) => {
    addFiles([file])
  }, [addFiles])

  const playDemo = useCallback(async () => {
    const blob = generateDemoTrack()
    const file = new File([blob], 'Cyber-Beat 128 BPM [Club Master].wav', { type: 'audio/wav' })
    addFiles([file])
  }, [addFiles])

  const removeTrack = useCallback((index) => {
    setPlaylist(prev => {
      const updated = prev.filter((_, i) => i !== index)
      if (index === currentIndexRef.current) {
        if (updated.length > 0) {
          const nextIdx = Math.min(index, updated.length - 1)
          playTrackAtIndex(nextIdx, updated)
        } else {
          audioEngine.pause()
          setIsPlaying(false)
          setIsReady(false)
          setTrackName('')
          setCurrentIndex(-1)
        }
      } else if (index < currentIndexRef.current) {
        setCurrentIndex(c => c - 1)
      }
      return updated
    })
  }, [playTrackAtIndex])

  const clearPlaylist = useCallback(() => {
    audioEngine.pause()
    setIsPlaying(false)
    setIsReady(false)
    setTrackName('')
    setPlaylist([])
    setCurrentIndex(-1)
  }, [])

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

  const changePlaybackRate = useCallback((rate) => {
    setPlaybackRate(rate)
    audioEngine.setPlaybackRate(rate)
  }, [])

  const toggleShuffle = useCallback(() => {
    setIsShuffle(s => !s)
  }, [])

  const toggleRepeat = useCallback(() => {
    setIsRepeat(r => (r === 'all' ? 'one' : r === 'one' ? 'none' : 'all'))
  }, [])

  const togglePlaylistOpen = useCallback(() => {
    setIsPlaylistOpen(o => !o)
  }, [])

  useEffect(() => {
    const handler = () => togglePlay()
    window.addEventListener('audio:togglePlay', handler)
    return () => window.removeEventListener('audio:togglePlay', handler)
  }, [togglePlay])

  const value = {
    isPlaying, isReady, trackName, currentTime, duration, volume, playbackRate, vizMode,
    playlist, currentIndex, isShuffle, isRepeat, isPlaylistOpen,
    loadFile, addFiles, playDemo, playTrackAtIndex, nextTrack, prevTrack, removeTrack, clearPlaylist,
    togglePlay, seek, seekRelative, changeVolume, changePlaybackRate, setVizMode,
    toggleShuffle, toggleRepeat, togglePlaylistOpen,
    engine: audioEngine
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export function useAudio() {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be within AudioProvider')
  return ctx
}
