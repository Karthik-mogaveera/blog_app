import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import GoogleIcon from '../components/GoogleIcon';
import GoogleAuthModal from '../components/GoogleAuthModal';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please enter both your username/email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      if (user.role === 'admin') {
        navigate('/admin/blogs');
      } else {
        navigate(from === '/login' ? '/' : from);
      }
    } catch (err) {
      setError(err.message || 'Invalid username/email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelectAccount = async (accountData) => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle(accountData);
      setIsGoogleModalOpen(false);
      if (user.role === 'admin') {
        navigate('/admin/blogs');
      } else {
        navigate(from === '/login' ? '/' : from);
      }
    } catch (err) {
      setError(err.message || 'Google authentication failed.');
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
              const user = await loginWithGoogle({ accessToken: tokenResponse.access_token });
              if (user.role === 'admin') {
                navigate('/admin/blogs');
              } else {
                navigate(from === '/login' ? '/' : from);
              }
            } catch (err) {
              setError(err.message || 'Google authentication failed.');
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
    setError('Google authentication failed. Please try again or sign in with email.');
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', display: 'flex', justifyContent: 'center' }}>
      <div className="auth-card">
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
            <LogIn size={24} />
          </div>
          <h2>Welcome Back</h2>
          <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
            Sign in to your account to like, comment, and engage with the community.
          </p>
        </div>

        {error && (
          <div
            id="login-error-banner"
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
          id="btn-google-auth-login"
          className="btn-google"
          onClick={handleGoogleClick}
          disabled={loading || googleLoading}
        >
          <GoogleIcon size={20} />
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="auth-divider">
          <span>or sign in with credentials</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-identifier">
              Username or Email
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
                id="login-identifier"
                className="form-input"
                placeholder="e.g., alex or alex@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ paddingLeft: '2.75rem' }}
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" htmlFor="login-password" style={{ marginBottom: 0 }}>
                Password
              </label>
              <Link
                to="/forgot-password"
                id="link-forgot-password"
                style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}
              >
                Forgot Password?
              </Link>
            </div>
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
                id="login-password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                id="toggle-password-visibility"
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
            id="login-submit-btn"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <span className="text-muted">Don't have an account yet? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }} id="link-to-register">
            Register as a Reader
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

export default LoginPage;
