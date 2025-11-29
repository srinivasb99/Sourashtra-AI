import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Heart, BookOpen, BookHeart, Users, Mic } from 'lucide-react'
import './Features.css'

const features = [
  {
    icon: <MessageCircle />,
    title: "Real-Time Conversation",
    description: "Speak freely and hear Sourashtra spoken back to you—naturally, instantly, and clearly."
  },
  {
    icon: <Heart />,
    title: "Cultural Understanding",
    description: "Recognizes everyday family terms, traditional sayings, and the unique way our community communicates."
  },
  {
    icon: <BookOpen />,
    title: "Learn & Practice",
    description: "Perfect whether you're learning from scratch or trying to strengthen what you already know."
  },
  {
    icon: <BookHeart />,
    title: "Heritage Stories",
    description: "Listen to stories, proverbs, and lessons passed down through generations."
  },
  {
    icon: <Users />,
    title: "Connect Generations",
    description: "Help children and elders communicate more easily, and bring families closer through shared language."
  },
  {
    icon: <Mic />,
    title: "Voice First",
    description: "Just speak—no typing needed. Designed for natural, comfortable conversations."
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
            <span className="highlight">Keep Our Language Alive</span>
          </h2>
          <p className="section-desc">
            Sourashtra AI understands our expressions, traditions, and the cultural warmth behind every word.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${isVisible ? 'visible' : ''}`}
              style={{ '--delay': `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
