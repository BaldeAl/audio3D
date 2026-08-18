import { useState, useRef } from 'react'
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

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

export default function ControlsPanel() {
  const {
    isReady,
    isPlaying,
    togglePlay,
    seek,
    seekRelative,
    prevTrack,
    nextTrack,
    volume,
    changeVolume,
    playbackRate,
    changePlaybackRate,
    vizMode,
    setVizMode,
    addFiles,
    playlist,
    togglePlaylistOpen,
    isShuffle,
    toggleShuffle,
    currentTime,
    duration,
  } = useAudio()

  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const fileInputRef = useRef(null)
  const folderInputRef = useRef(null)
  const progressRef = useRef(null)

  const handleProgressClick = (e) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(frac)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
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
            <button className="ctrl-btn" onClick={prevTrack} title="Piste précédente (ou début)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 20L9 12l10-8v16zM5 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button className="ctrl-btn play-btn" onClick={togglePlay} title="Lecture / Pause">
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                  <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                </svg>
              )}
            </button>

            <button className="ctrl-btn" onClick={nextTrack} title="Piste suivante">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 4l10 8-10 8V4zM19 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="speed-control-wrapper">
            <button
              className={`ctrl-btn small ${playbackRate !== 1.0 ? 'active' : ''}`}
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              title="Vitesse de lecture"
            >
              <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {playbackRate}x
              </span>
            </button>

            {showSpeedMenu && (
              <div className="speed-dropdown">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    className={`speed-option ${playbackRate === s ? 'selected' : ''}`}
                    onClick={() => {
                      changePlaybackRate(s)
                      setShowSpeedMenu(false)
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className={`ctrl-btn small ${isShuffle ? 'active' : ''}`}
            onClick={toggleShuffle}
            title={isShuffle ? 'Aléatoire : Activé' : 'Aléatoire : Désactivé'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button
            className="ctrl-btn small playlist-trigger-btn"
            onClick={togglePlaylistOpen}
            title="Ouvrir la playlist"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {playlist.length > 0 && (
              <span className="playlist-badge">{playlist.length}</span>
            )}
          </button>

          <div className="volume-control">
            <button
              className="ctrl-btn small"
              onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
              title="Muet"
            >
              {volume > 0 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
                  <path d="M15.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18.5 5.5a9 9 0 010 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

          <label className="load-btn" htmlFor="file-input-controls" title="Ajouter des fichiers">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v12M4 8l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 14v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="file-input-controls"
            accept="audio/*"
            multiple
            hidden
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  )
}
