import { useRef } from 'react'
import { useAudio } from '../../context/AudioContext'

export default function WelcomePanel() {
  const { isReady, loadFile, playDemo } = useAudio()
  const fileInputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  return (
    <div className={`welcome-panel ${isReady ? 'hidden' : ''}`}>
      <div className="welcome-card">
        <div className="welcome-glow" />
        <div className="welcome-icon">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
            <circle cx="28" cy="28" r="18" stroke="#ff3d00" strokeWidth="1.5" opacity="0.4" />
            <polygon points="24,18 38,28 24,38" fill="#00e5ff" />
          </svg>
        </div>
        <h1>VISUALISEUR <span className="gradient-text">AUDIO 3D</span></h1>
        <p className="welcome-desc">
          Rendu spectral 3D temps réel asservi au beat et aux transitoires.
          Moteur Web Audio 100% local — zéro upload serveur.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <label className="upload-btn" htmlFor="file-input-welcome">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v12M4 8l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 14v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Charger un fichier local (MP3, WAV...)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="file-input-welcome"
            accept="audio/*"
            hidden
            onChange={handleFile}
          />

          <button
            onClick={playDemo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              border: '1px solid rgba(255, 61, 0, 0.4)',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 61, 0, 0.08)',
              color: '#ff9100',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'var(--font-main)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 61, 0, 0.18)'
              e.currentTarget.style.borderColor = '#ff3d00'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 61, 0, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 61, 0, 0.4)'
              e.currentTarget.style.color = '#ff9100'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            Tester avec le Cyber-Beat Démo (128 BPM)
          </button>
        </div>

        <p className="welcome-hint">Glissez-déposez n'importe quel fichier audio dans la fenêtre</p>
        <div className="supported-formats">
          <span>MP3</span><span>WAV</span><span>FLAC</span><span>OGG</span><span>AAC</span>
        </div>
      </div>
    </div>
  )
}
