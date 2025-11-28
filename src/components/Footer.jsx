import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <a href="#" className="nav-logo">
              <div className="logo-icon">
                <span className="logo-symbol">ஃ</span>
              </div>
              <span className="logo-text">
                Sourashtra<span className="ai-text">AI</span>
              </span>
            </a>
            <p>
              Preserving our heritage through the power of artificial intelligence 
              and human connection.
            </p>
          </div>
          
          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#about">About</a>
            </div>
            <div className="footer-col">
              <h4>Community</h4>
              <a href="https://sourashtraassociation.org/" target="_blank" rel="noopener noreferrer">
                Sourashtra Association
              </a>
              <a href="https://sourashtraassociation.org/poltam-classes-spoken-sourashtra/" target="_blank" rel="noopener noreferrer">
                poLTam Classes
              </a>
              <a href="https://sourashtraassociation.org/literacy-foundation-classes-written-sourashtra/" target="_blank" rel="noopener noreferrer">
                Literacy Foundation
              </a>
            </div>
            <div className="footer-col">
              <h4>Connect</h4>
              <a href="https://sourashtraassociation.org/contact/" target="_blank" rel="noopener noreferrer">
                Contact Us
              </a>
              <a href="https://sourashtraassociation.org/become-a-volunteer/" target="_blank" rel="noopener noreferrer">
                Volunteer
              </a>
              <a href="https://sourashtraassociation.org/become-a-donor/" target="_blank" rel="noopener noreferrer">
                Donate
              </a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Sourashtra AI. Built with ❤️ for the Sourashtra community.</p>
          <p className="footer-partner">
            In partnership with{' '}
            <a href="https://sourashtraassociation.org/" target="_blank" rel="noopener noreferrer">
              Sourashtra Association Inc.
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

