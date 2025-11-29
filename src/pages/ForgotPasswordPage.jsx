import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import emailjs from '@emailjs/browser';
import API_URL from '../config/api';
import './AuthPages.css';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_bs1r1y7';
const EMAILJS_TEMPLATE_ID = 'sourashtra_password';
const EMAILJS_PUBLIC_KEY = 'uR7iBJsw0GekpX4EA';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // Step 1: Get password reset link from our API
      const response = await fetch(`${API_URL}/auth/generate-reset-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate reset link');
      }

      // Step 2: Send email via EmailJS
      const templateParams = {
        to_email: email,
        reset_link: data.resetLink,
        user_email: email,
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );

      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(getErrorMessage(err.message));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (message) => {
    if (message.includes('No account found')) {
      return 'No account found with this email';
    }
    if (message.includes('invalid-email') || message.includes('Invalid email')) {
      return 'Invalid email address';
    }
    if (message.includes('too-many-requests')) {
      return 'Too many requests. Please try again later';
    }
    return message || 'An error occurred. Please try again';
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d" 
            alt="Sourashtra AI" 
            className="auth-logo"
          />
          <h1>Reset Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        
        {success ? (
          <div className="auth-success">
            <p>Password reset email sent! Check your inbox for instructions.</p>
            <Link to="/signin" className="auth-submit-btn" style={{ display: 'block', textAlign: 'center', marginTop: '1rem' }}>
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form auth-form-single">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Remember your password? <Link to="/signin">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
