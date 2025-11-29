import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mic, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Hero.css'

function Hero() {
  const [isOrbActive, setIsOrbActive] = useState(false)
  const [showBubbles, setShowBubbles] = useState(false)
  const { user } = useAuth()

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
          <Mic size={20} className="badge-icon" />
          <span>Real-Time AI</span>
        </div>
        
        <h1 className="hero-title">
          <span className="title-line">Learn Your</span>
          <span className="title-highlight">Heritage</span>
        </h1>
        
        <p className="hero-subtitle">
          Sourashtra, brought to life with AI.
          <br />
          Speak naturally. Learn easily. Share your heritage proudly.
        </p>
        
        <div className="hero-actions">
          {user ? (
            <Link to="/chat" className="btn-primary">
              <MessageCircle size={20} />
              <span>Go to Chat</span>
            </Link>
          ) : (
            <Link to="/signup" className="btn-primary">
              <span>Get Started</span>
              <ArrowRight size={20} />
            </Link>
          )}
          <a href="#how-it-works" className="btn-secondary">
            <span>See How It Works</span>
            <ArrowRight size={18} />
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
          <div className="orb-core">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d" 
              alt="Sourashtra AI"
              className="orb-logo"
            />
          </div>
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
            <span className="bubble-text">Jhukku dhannu!</span>
          </div>
          <div className="bubble bubble-ai">
            <span className="bubble-text">Askthinengo namaskar</span>
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
