import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar.png?alt=media&token=9284aeb3-8cbd-4cc1-bed3-35d9f889283a';

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signInWithGoogle, signOut, loading } = useAuth();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled || !isLandingPage ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-icon">
            <img src={LOGO_URL} alt="Sourashtra AI" className="logo-img" />
          </div>
          <span className="logo-text">
            Sourashtra<span className="ai-text">AI</span>
          </span>
        </Link>

        <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link 
            to="/chat" 
            className={location.pathname === '/chat' ? 'active' : ''}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            💬 Chat
          </Link>
          <Link 
            to="/voice" 
            className={location.pathname === '/voice' ? 'active' : ''}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            🎙️ Voice
          </Link>
          <Link 
            to="/image" 
            className={location.pathname === '/image' ? 'active' : ''}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            🎨 Image
          </Link>
          
          {!loading && (
            <>
              {user ? (
                <div className="user-menu">
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName} 
                    className="user-avatar"
                  />
                  <span className="user-name">{user.displayName?.split(' ')[0]}</span>
                  <button onClick={signOut} className="sign-out-btn">
                    Sign Out
                  </button>
                </div>
              ) : (
                <button onClick={signInWithGoogle} className="nav-cta">
                  Sign In
                </button>
              )}
            </>
          )}
        </div>

        <button 
          className={`mobile-menu-btn ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
