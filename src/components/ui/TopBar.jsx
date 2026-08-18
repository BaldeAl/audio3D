import { useAudio } from '../../context/AudioContext'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function TopBar() {
  const { trackName, currentTime, duration, isReady } = useAudio()

  return (
    <header className="top-bar">
      <div className="logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#00e5ff" strokeWidth="2" fill="none" />
          <path d="M8 12h2v4H8zM11 8h2v8h-2zM14 10h2v6h-2z" fill="#00e5ff" />
        </svg>
        <span>AUDIO<strong>3D</strong></span>
        <span style={{
          fontSize: '9px',
          fontWeight: 700,
          background: 'rgba(0, 229, 255, 0.1)',
          color: '#00e5ff',
          padding: '2px 6px',
          borderRadius: '4px',
          letterSpacing: '1px',
          border: '1px solid rgba(0, 229, 255, 0.2)'
        }}>PRO ENGINE</span>
      </div>

      <div className="track-info">
        <span className="track-name">{isReady ? trackName : 'En attente de piste…'}</span>
        <span className="track-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </header>
  )
}
