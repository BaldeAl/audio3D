import { useState, useEffect } from 'react'

export default function LoadingScreen() {
  const [fadeOut, setFadeOut] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1200)
    const t2 = setTimeout(() => setHidden(true), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (hidden) return null

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loader-content">
        <div className="loader-ring">
          <div className="ring-segment" />
          <div className="ring-segment" />
          <div className="ring-segment" />
        </div>
        <h1 className="loader-title">AUDIO<span>3D</span></h1>
        <p className="loader-sub">Initialisation du moteur 3D…</p>
      </div>
    </div>
  )
}
