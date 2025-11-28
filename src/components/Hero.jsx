import { useState, useEffect } from 'react'
import './Hero.css'

function Hero() {
  const [isOrbActive, setIsOrbActive] = useState(false)
  const [showBubbles, setShowBubbles] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setIsOrbActive(true), 500)
    const timer2 = setTimeout(() => setShowBubbles(true), 1200)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-icon">🎙️</span>
          <span>Real-Time Voice AI</span>
        </div>
        
        <h1 className="hero-title">
          <span className="title-line">Speak Your</span>
          <span className="title-highlight">Heritage</span>
        </h1>
        
        <p className="hero-subtitle">
          Experience the world's first AI that truly understands and speaks Sourashtra. 
          Connect with your roots through natural conversation.
        </p>
        
        <div className="hero-actions">
          <button className="btn-primary" onClick={() => setIsOrbActive(!isOrbActive)}>
            <span className="btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </span>
            <span>Start Conversation</span>
          </button>
          <a href="#how-it-works" className="btn-secondary">
            <span>See How It Works</span>
            <span className="arrow">→</span>
          </a>
        </div>
        
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">500K+</span>
            <span className="stat-label">Sourashtra Speakers</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">2000+</span>
            <span className="stat-label">Years of Heritage</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">∞</span>
            <span className="stat-label">Conversations</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <div className={`voice-orb ${isOrbActive ? 'active' : ''}`}>
          <div className="orb-core"></div>
          <div className="orb-ring ring-1"></div>
          <div className="orb-ring ring-2"></div>
          <div className="orb-ring ring-3"></div>
          <div className="orb-pulse"></div>
          <div className="orb-particles">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="particle" style={{ '--i': i }}></span>
            ))}
          </div>
        </div>
        
        <div className={`conversation-bubbles ${showBubbles ? 'visible' : ''}`}>
          <div className="bubble bubble-user">
            <span className="bubble-text">நமஸ்கரம் !</span>
            <span className="bubble-translation">Namaskaram!</span>
          </div>
          <div className="bubble bubble-ai">
            <span className="bubble-text">அஸ்கு தின்னங்கோ நமஸ்கரம்!</span>
            <span className="bubble-translation">Asku thinnango namaskaram!</span>
          </div>
        </div>
      </div>

      <div className="hero-scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <span>Scroll to explore</span>
      </div>
    </section>
  )
}

export default Hero

