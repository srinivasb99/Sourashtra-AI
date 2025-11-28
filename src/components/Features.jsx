import { useEffect, useRef, useState } from 'react'
import './Features.css'

const features = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
        <path d="M24 14v10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Real-Time Conversation",
    description: "Speak naturally and receive instant responses in authentic Sourashtra. No delays, no typing—just pure conversation.",
    isLarge: true,
    hasWaveform: true
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M8 24h32M24 8v32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    title: "Cultural Context",
    description: "Understands traditional phrases, family terms, and cultural expressions unique to our community."
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 20h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Learn & Practice",
    description: "Perfect for learning Sourashtra or practicing with a patient, knowledgeable conversation partner."
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 4l6 12 14 2-10 10 2 14-12-6-12 6 2-14L4 18l14-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Heritage Stories",
    description: "Access traditional stories, proverbs, and wisdom passed down through generations."
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <circle cx="16" cy="20" r="8" stroke="currentColor" strokeWidth="2"/>
        <circle cx="32" cy="20" r="8" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 40c0-8 8-12 16-12s16 4 16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Connect Generations",
    description: "Bridge the gap between elders and youth. Help children connect with grandparents through shared language learning.",
    isWide: true,
    hasCTA: true
  }
]

function Features() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section className="features" id="features" ref={sectionRef}>
      <div className="container">
        <div className={`section-header ${isVisible ? 'visible' : ''}`}>
          <span className="section-tag">Capabilities</span>
          <h2 className="section-title">
            A New Way to<br />
            <span className="highlight">Preserve Your Language</span>
          </h2>
          <p className="section-desc">
            Our AI is trained to understand the nuances, idioms, and cultural context 
            of Sourashtra like never before.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${feature.isLarge ? 'feature-large' : ''} ${feature.isWide ? 'feature-wide' : ''} ${isVisible ? 'visible' : ''}`}
              style={{ '--delay': `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              
              {feature.hasWaveform && (
                <div className="feature-visual">
                  <div className="waveform">
                    {[...Array(10)].map((_, i) => (
                      <span key={i} style={{ '--i': i }}></span>
                    ))}
                  </div>
                </div>
              )}
              
              {feature.hasCTA && (
                <div className="feature-cta">
                  <span>Start a family session</span>
                  <span className="arrow">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features

