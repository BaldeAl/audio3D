import { useState, useEffect, useCallback } from 'react'
import { useAudio } from '../../context/AudioContext'

export default function DropZone() {
  const [isDragging, setIsDragging] = useState(false)
  const { addFiles } = useAudio()
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

  const handleDrop = useCallback(async (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCountRef.current = 0
    setIsDragging(false)

    const items = e.dataTransfer?.items
    if (items && items.length > 0) {
      const files = []
      const queue = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null
        if (entry) {
          queue.push(traverseEntry(entry))
        } else {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }

      const nestedFiles = await Promise.all(queue)
      const allFiles = [...files, ...nestedFiles.flat()]
      if (allFiles.length > 0) {
        addFiles(allFiles)
      }
    } else if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

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
        <h2>Déposez vos fichiers ou dossiers audio</h2>
        <p>Création automatique de playlist locale (MP3, WAV, OGG, FLAC, AAC)</p>
      </div>
    </div>
  )
}

function traverseEntry(entry) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => resolve([file]), () => resolve([]))
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const entries = []
      const readEntries = () => {
        reader.readEntries(async (batch) => {
          if (batch.length === 0) {
            const nested = await Promise.all(entries.map(e => traverseEntry(e)))
            resolve(nested.flat())
          } else {
            entries.push(...batch)
            readEntries()
          }
        }, () => resolve([]))
      }
      readEntries()
    } else {
      resolve([])
    }
  })
}
