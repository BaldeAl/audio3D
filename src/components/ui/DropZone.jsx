import { useState, useEffect, useCallback } from 'react'
import { useAudio } from '../../context/AudioContext'

export default function DropZone() {
  const [isDragging, setIsDragging] = useState(false)
  const { loadFile } = useAudio()
  const dragCountRef = { current: 0 }

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current++
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current--
    if (dragCountRef.current <= 0) {
      dragCountRef.current = 0
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current = 0
    setIsDragging(false)

    const file = e.dataTransfer?.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      loadFile(file)
    }
  }, [loadFile])

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop])

  return (
    <div className={`drop-overlay ${isDragging ? 'active' : ''}`}>
      <div className="drop-content">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="rgba(0,229,255,0.5)" strokeWidth="2" strokeDasharray="8 4" fill="none">
            <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="20s" repeatCount="indefinite" />
          </circle>
          <path d="M40 24v24M28 40h24" stroke="#00e5ff" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <h2>Déposez votre fichier audio ici</h2>
        <p>MP3, WAV, OGG, FLAC supportés</p>
      </div>
    </div>
  )
}
