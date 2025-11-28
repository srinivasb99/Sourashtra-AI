import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar.png?alt=media&token=9284aeb3-8cbd-4cc1-bed3-35d9f889283a';

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { user, signOut, loading, getUserInitials } = useAuth();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-menu')) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserDropdown(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled || !isLandingPage ? 'scrolled' : ''} ${isAuthPage ? 'auth-navbar' : ''}`}>
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
                  <button 
                    className="user-menu-trigger"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="user-avatar"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="user-avatar-initials">
                        {getUserInitials()}
                      </div>
                    )}
                    <span className="user-name">{user.displayName?.split(' ')[0] || 'User'}</span>
                    <svg className={`dropdown-arrow ${showUserDropdown ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  {showUserDropdown && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.displayName || 'User'} 
                            className="dropdown-avatar"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="dropdown-avatar-initials">
                            {getUserInitials()}
                          </div>
                        )}
                        <div className="dropdown-user-info">
                          <span className="dropdown-name">{user.displayName || 'User'}</span>
                          <span className="dropdown-email">{user.email}</span>
                        </div>
                      </div>
                      <div className="dropdown-divider"></div>
                      <button onClick={handleSignOut} className="dropdown-item sign-out">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link 
                    to="/signin" 
                    className="nav-signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/signup" 
                    className="nav-cta"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
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
