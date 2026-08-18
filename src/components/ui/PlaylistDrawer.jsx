import { useRef } from 'react'
import { useAudio } from '../../context/AudioContext'

export default function PlaylistDrawer() {
  const {
    playlist,
    currentIndex,
    isPlaylistOpen,
    togglePlaylistOpen,
    playTrackAtIndex,
    removeTrack,
    clearPlaylist,
    addFiles,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
  } = useAudio()

  const filesInputRef = useRef(null)
  const folderInputRef = useRef(null)

  if (!isPlaylistOpen) return null

  const handleFilesSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
  }

  const handleFolderSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
  }

  return (
    <div className="playlist-backdrop" onClick={togglePlaylistOpen}>
      <div className="playlist-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="playlist-header">
          <div className="playlist-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h10" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h2>Playlist</h2>
            <span className="playlist-count">{playlist.length} piste{playlist.length > 1 ? 's' : ''}</span>
          </div>

          <div className="playlist-actions">
            <button
              className={`ctrl-btn small ${isShuffle ? 'active' : ''}`}
              onClick={toggleShuffle}
              title={isShuffle ? 'Lecture aléatoire : Activée' : 'Lecture aléatoire : Désactivée'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              className={`ctrl-btn small ${isRepeat !== 'none' ? 'active' : ''}`}
              onClick={toggleRepeat}
              title={`Répétition : ${isRepeat === 'all' ? 'Toutes les pistes' : isRepeat === 'one' ? 'Piste actuelle' : 'Désactivée'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M17 1l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 13v2a4 4 0 01-4 4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                {isRepeat === 'one' && (
                  <text x="12" y="14" fill="#00e5ff" fontSize="8" fontWeight="bold" textAnchor="middle">1</text>
                )}
              </svg>
            </button>

            {playlist.length > 0 && (
              <button className="ctrl-btn small" onClick={clearPlaylist} title="Vider la playlist">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}

            <button className="ctrl-btn small" onClick={togglePlaylistOpen} title="Fermer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="playlist-upload-row">
          <label className="playlist-add-btn" htmlFor="playlist-files-input">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v12M4 8l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 14v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            + Fichiers
          </label>
          <input
            ref={filesInputRef}
            type="file"
            id="playlist-files-input"
            accept="audio/*"
            multiple
            hidden
            onChange={handleFilesSelect}
          />

          <label className="playlist-add-btn folder" htmlFor="playlist-folder-input">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            + Dossier complet
          </label>
          <input
            ref={folderInputRef}
            type="file"
            id="playlist-folder-input"
            webkitdirectory="true"
            directory="true"
            multiple
            hidden
            onChange={handleFolderSelect}
          />
        </div>

        <div className="playlist-list">
          {playlist.length === 0 ? (
            <div className="playlist-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.3">
                <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>Aucune piste dans la playlist</p>
              <span>Ajoutez des fichiers individuels ou un dossier de musique</span>
            </div>
          ) : (
            playlist.map((track, idx) => {
              const isActive = idx === currentIndex
              return (
                <div
                  key={track.id || idx}
                  className={`playlist-item ${isActive ? 'active' : ''}`}
                  onClick={() => playTrackAtIndex(idx)}
                >
                  <div className="track-number">
                    {isActive ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#00e5ff">
                        <path d="M8 5v14l11-7L8 5z"/>
                      </svg>
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="track-details">
                    <span className="track-item-name">{track.name}</span>
                  </div>
                  <button
                    className="track-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeTrack(idx)
                    }}
                    title="Retirer de la playlist"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
