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
              Sourashtra is more than a language—it's a living connection to our ancestors, 
              our traditions, and our identity. With fewer young people learning the language, 
              we're at risk of losing this precious heritage.
            </p>
            <p className="about-text">
              Sourashtra AI is our answer. Built with cutting-edge technology and deep cultural 
              understanding, it provides an accessible, engaging way for anyone to learn, 
              practice, and preserve our beautiful language.
            </p>
            <div className="about-quote">
              <blockquote>
                "அவ்ரே பாஷை அவ்ரே பெருமை"
              </blockquote>
              <cite>— Our language is our pride</cite>
            </div>
          </div>

          <div className={`about-visual ${isVisible ? 'visible' : ''}`}>
            <div className="heritage-symbol">
              <div className="symbol-outer">
                <div className="symbol-ring"></div>
                <div className="symbol-core">ஃ</div>
                <div className="symbol-people">
                  {[...Array(8)].map((_, i) => (
                    <span key={i} style={{ '--i': i }}></span>
                  ))}
                </div>
                <div className="symbol-text-ring">
                  <span className="ring-text">SOURASHTRA ASSOCIATION</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About

