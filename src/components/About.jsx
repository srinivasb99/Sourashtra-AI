import { useEffect, useRef, useState } from 'react'
import './About.css'

function About() {
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
    <section className="about" id="about" ref={sectionRef}>
      <div className="container">
        <div className="about-grid">
          <div className={`about-content ${isVisible ? 'visible' : ''}`}>
            <span className="section-tag">Our Mission</span>
            <h2 className="section-title">
              Preserving a<br />
              <span className="highlight">2000-Year Legacy</span>
            </h2>
            <p className="about-text">
              Sourashtra is more than a language.<br />
              It holds our stories, our identity, and our roots.
            </p>
            <p className="about-text">
              But fewer young people grow up speaking it today.
            </p>
            <p className="about-text">
              Sourashtra AI is our way of keeping the language alive.<br />
              <strong>Accessible. Simple. Cultural.</strong>
            </p>
            <p className="about-text">
              A place where anyone can learn, practice, and pass our heritage forward.
            </p>
            <div className="about-quote">
              <blockquote>
                "Avre bhashai avre perumai"
              </blockquote>
              <cite>— Our language is our pride.</cite>
            </div>
          </div>

          <div className={`about-visual ${isVisible ? 'visible' : ''}`}>
            <div className="heritage-symbol">
              <div className="symbol-outer">
                <div className="symbol-ring"></div>
                <div className="symbol-core">
                  <img 
                    src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d" 
                    alt="Sourashtra AI Logo"
                    className="symbol-logo"
                  />
                </div>
                <div className="symbol-people">
                  {[...Array(8)].map((_, i) => (
                    <span key={i} style={{ '--i': i }}></span>
                  ))}
                </div>
              </div>
              <div className="symbol-text-below">
                <span className="ring-text">SOURASHTRA ASSOCIATION</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
