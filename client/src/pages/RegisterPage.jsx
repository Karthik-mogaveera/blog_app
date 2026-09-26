import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Sparkles, Eye, EyeOff } from 'lucide-react';
import GoogleIcon from '../components/GoogleIcon';
import GoogleAuthModal from '../components/GoogleAuthModal';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Compute live initials avatar preview
  const getInitials = (name) => {
    if (!name || !name.trim()) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelectAccount = async (accountData) => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(accountData);
      setIsGoogleModalOpen(false);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Google registration failed.');
      setIsGoogleModalOpen(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setError('');
    const clientId = import.meta.env.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (clientId && window.google?.accounts?.oauth2 && !navigator.webdriver) {
      setGoogleLoading(true);
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setGoogleLoading(false);
              setError(tokenResponse.error_description || 'Google sign-in was cancelled or failed.');
              return;
            }
            try {
              await loginWithGoogle({ accessToken: tokenResponse.access_token });
              navigate('/');
            } catch (err) {
              setError(err.message || 'Google registration failed.');
            } finally {
              setGoogleLoading(false);
            }
          },
          error_callback: (err) => {
            setGoogleLoading(false);
            if (err && err.type !== 'popup_closed') {
              setError('Failed to initialize Google Sign-In.');
            }
          }
        });
        tokenClient.requestAccessToken();
        return;
      } catch (err) {
        console.error('Error invoking Google OAuth:', err);
        setGoogleLoading(false);
      }
    }

    setIsGoogleModalOpen(true);
  };

  const handleGoogleSimulateError = () => {
    setIsGoogleModalOpen(false);
    setError('Google registration failed. Please try again or create an account with email.');
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', display: 'flex', justifyContent: 'center' }}>
      <div className="auth-card" style={{ maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'white',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <UserPlus size={24} />
          </div>
          <h2>Join Chronicle</h2>
          <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
            Create a reader account to like articles, write comments, and join discussions.
          </p>
        </div>

        {/* Live Initials Avatar Showcase */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '0.85rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem'
          }}
        >
          <div className="avatar avatar-md" id="register-avatar-preview">
            {getInitials(username)}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs text-muted">Your Discussion Avatar</span>
            <span className="text-sm font-semibold text-primary">
              {username.trim() ? username.trim() : 'Anonymous Reader'}
            </span>
          </div>
        </div>

        {error && (
          <div
            id="register-error-banner"
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fb7185',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}
          >
            {error}
          </div>
        )}

        {/* Continue with Google Button */}
        <button
          type="button"
          id="btn-google-auth-register"
          className="btn-google"
          onClick={handleGoogleClick}
          disabled={loading || googleLoading}
        >
          <GoogleIcon size={20} />
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-username">
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                id="register-username"
                className="form-input"
                placeholder="e.g., JaneDoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="email"
                id="register-email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                id="toggle-register-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            id="register-submit-btn"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <span className="text-muted">Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }} id="link-to-login">
            Sign In here
          </Link>
        </div>
      </div>

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleGoogleSelectAccount}
        onSimulateError={handleGoogleSimulateError}
        loading={googleLoading}
      />
    </div>
  );
};

export default RegisterPage;
