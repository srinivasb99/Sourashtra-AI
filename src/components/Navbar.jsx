import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Mic, Image, LogOut, ChevronDown, Settings, Users } from 'lucide-react';
import './Navbar.css';

const LOGO_URL = 'https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d';

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { user, signOut, getUserInitials } = useAuth();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

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
    <nav className={`navbar ${isScrolled || !isLandingPage ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={() => setIsMobileMenuOpen(false)}>
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
            <MessageCircle size={18} /> Chat
          </Link>
          <Link 
            to="/voice" 
            className={location.pathname === '/voice' ? 'active' : ''}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Mic size={18} /> Voice
          </Link>
          <Link 
            to="/image" 
            className={location.pathname === '/image' ? 'active' : ''}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Image size={18} /> Image
          </Link>
          <Link 
            to="/community" 
            className={location.pathname === '/community' ? 'active' : ''}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Users size={18} /> Community
          </Link>
          
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
                <ChevronDown size={16} className={`dropdown-arrow ${showUserDropdown ? 'open' : ''}`} />
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
                  <Link 
                    to="/settings" 
                    className="dropdown-item"
                    onClick={() => {
                      setShowUserDropdown(false);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Settings size={18} />
                    Settings
                  </Link>
                  <button onClick={handleSignOut} className="dropdown-item sign-out">
                    <LogOut size={18} />
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
