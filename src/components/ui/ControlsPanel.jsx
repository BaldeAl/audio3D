import { useRef } from 'react'
import { useAudio } from '../../context/AudioContext'

const VIZ_MODES = [
  {
    id: 'particles',
    label: 'Particules',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="4" cy="4" r="2" fill="currentColor" />
        <circle cx="14" cy="4" r="2" fill="currentColor" />
        <circle cx="9" cy="9" r="2" fill="currentColor" />
        <circle cx="4" cy="14" r="2" fill="currentColor" />
        <circle cx="14" cy="14" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'bars',
    label: 'Barres spectrales',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="10" width="3" height="7" rx="1" fill="currentColor" />
        <rect x="5.5" y="6" width="3" height="11" rx="1" fill="currentColor" />
        <rect x="10" y="3" width="3" height="14" rx="1" fill="currentColor" />
        <rect x="14.5" y="8" width="3" height="9" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'wave',
    label: 'Onde',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M1 9c2-4 4 4 6 0s4-4 6 0 4 4 4 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'galaxy',
    label: 'Galaxie',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="2" fill="currentColor" />
        <ellipse cx="9" cy="9" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" fill="none" transform="rotate(-30 9 9)" />
        <ellipse cx="9" cy="9" rx="7" ry="3" stroke="currentColor" strokeWidth="1.5" fill="none" transform="rotate(30 9 9)" />
      </svg>
    ),
  },
]

export default function ControlsPanel() {
  const {
    isReady, isPlaying, togglePlay, seek, seekRelative,
    volume, changeVolume, vizMode, setVizMode, loadFile,
    currentTime, duration,
  } = useAudio()

  const fileInputRef = useRef(null)
  const progressRef = useRef(null)

  const handleProgressClick = (e) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(frac)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className={`controls-panel ${isReady ? '' : 'hidden'}`}>
      <div className="controls-inner">
        <div className="progress-container" ref={progressRef} onClick={handleProgressClick}>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
            <div className="progress-head" style={{ left: `${progress}%` }} />
          </div>
        </div>

        <div className="controls-row">
          <div className="transport-controls">
            <button className="ctrl-btn" onClick={() => seekRelative(-10)} title="Reculer 10s">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="ctrl-btn play-btn" onClick={togglePlay} title="Lecture / Pause">
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                  <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                </svg>
              )}
            </button>
            <button className="ctrl-btn" onClick={() => seekRelative(10)} title="Avancer 10s">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="volume-control">
            <button
              className="ctrl-btn small"
              onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
              title="Muet"
            >
              {volume > 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
                  <path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18.5 5.5a9 9 0 010 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
                  <path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
            />
          </div>

          <div className="viz-selector">
            {VIZ_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`viz-btn ${vizMode === mode.id ? 'active' : ''}`}
                onClick={() => setVizMode(mode.id)}
                title={mode.label}
              >
                {mode.icon}
              </button>
            ))}
          </div>

          <label className="load-btn" htmlFor="file-input-controls" title="Charger un fichier">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v12M4 8l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 14v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="file-input-controls"
            accept="audio/*"
            hidden
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  )
}
