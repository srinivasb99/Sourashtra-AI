import { useEffect, useRef, useState } from 'react'
import './HowItWorks.css'

const steps = [
  {
    number: "01",
    title: "Click to Start",
    description: "No signup required. Just click \"Start Conversation\" and you're ready to begin.",
    visual: "click",
    emoji: "🖱️"
  },
  {
    number: "02",
    title: "Speak Naturally",
    description: "Talk in Sourashtra or English. Our AI understands both and responds in Sourashtra.",
    visual: "mic",
    emoji: "🎤"
  },
  {
    number: "03",
    title: "Learn & Connect",
    description: "Get instant responses, learn new words, and deepen your connection to your heritage.",
    visual: "connect",
    emoji: "💬"
  }
]

function HowItWorks() {
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
    <section className="how-it-works" id="how-it-works" ref={sectionRef}>
      <div className="container">
        <div className={`section-header center ${isVisible ? 'visible' : ''}`}>
          <span className="section-tag">Simple Process</span>
          <h2 className="section-title">
            Start Learning in<br />
            <span className="highlight">Three Easy Steps</span>
          </h2>
        </div>

        <div className="steps-container">
          {steps.map((step, index) => (
            <div key={index} className="step-wrapper">
              <div 
                className={`step ${isVisible ? 'visible' : ''}`}
                style={{ '--delay': `${index * 0.2}s` }}
              >
                <div className="step-number">{step.number}</div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <div className="step-visual">
                  {step.emoji && <div className="step-emoji">{step.emoji}</div>}
                  {step.visual === 'click' && (
                    <div className="click-visual">
                      <span>✨</span>
                    </div>
                  )}
                  {step.visual === 'mic' && (
                    <div className="mic-animation">
                      <div className="sound-waves">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                  {step.visual === 'connect' && (
                    <div className="connection-visual">
                      <div className="connect-hearts">
                        <span>❤️</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-connector ${isVisible ? 'visible' : ''}`}>
                  <svg viewBox="0 0 100 40" fill="none">
                    <path d="M0 20h100" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4"/>
                    <path d="M90 10l10 10-10 10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
