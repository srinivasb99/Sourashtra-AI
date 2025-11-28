import { useEffect, useRef, useState } from 'react'
import './CTA.css'

function CTA() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section className="cta-section" id="start" ref={sectionRef}>
      <div className="container">
        <div className={`cta-card ${isVisible ? 'visible' : ''}`}>
          <div className="cta-content">
            <h2>Ready to Speak Your Heritage?</h2>
            <p>Join thousands of Sourashtrians reconnecting with their language through AI-powered conversations.</p>
            <button className="btn-primary btn-large">
              <span className="btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </span>
              <span>Start Your First Conversation</span>
            </button>
            <p className="cta-note">Free to use • No signup required • Available 24/7</p>
          </div>
          <div className="cta-decoration">
            <div className="floating-elements">
              <span className="float-el el-1">நமஸ்கரம்</span>
              <span className="float-el el-2">ஜுக்கு தன்னு</span>
              <span className="float-el el-3">அவ்ரே</span>
              <span className="float-el el-4">பாஷை</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA

