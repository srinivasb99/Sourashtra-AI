import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './CTA.css'

function CTA() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)
  const { user } = useAuth()

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
            <h2>Ready to Learn Your Heritage?</h2>
            <p>Join thousands of Sourashtrians rediscovering their language through natural, conversational AI.</p>
            <Link to={user ? "/chat" : "/signup"} className="btn-primary btn-large">
              <span>Start Chatting</span>
              <span className="btn-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </span>
            </Link>
            <p className="cta-note">Free to use • No signup required • Available 24/7</p>
          </div>
          <div className="cta-decoration">
            <div className="floating-elements">
              <span className="float-el el-1">Namaskaram</span>
              <span className="float-el el-2">Jhukku thannu</span>
              <span className="float-el el-3">Avre</span>
              <span className="float-el el-4">Bhashai</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
