import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to send verification code.');
      }

      setSuccessMsg(data.message);
      // In dev/test mode, devOtp is available for convenience
      if (data.devOtp) {
        setOtp(data.devOtp);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Error requesting OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp.trim()) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Invalid verification code.');
      }

      setSuccessMsg(data.message);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
          confirmPassword
        })
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setSuccessMsg(data.message);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', display: 'flex', justifyContent: 'center' }}>
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        {/* Header Icon */}
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
            {step === 4 ? <CheckCircle2 size={24} /> : <KeyRound size={24} />}
          </div>

          {step === 1 && (
            <>
              <h2>Forgot Password?</h2>
              <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
                Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Enter Verification Code</h2>
              <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
                Please enter the 6-digit verification code sent to <strong>{email}</strong>.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Create New Password</h2>
              <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
                Your identity has been verified. Enter a new, secure password for your account.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Password Reset Successful</h2>
              <p className="text-sm text-secondary" style={{ marginTop: '0.25rem' }}>
                Your account password has been updated. You can now sign in with your new password.
              </p>
            </>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div
            id="forgot-error-banner"
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

        {/* Success Banner */}
        {successMsg && step !== 4 && (
          <div
            id="forgot-success-banner"
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#34d399',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}
          >
            {successMsg}
          </div>
        )}

        {/* Step 1: Request OTP Form */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">
                Registered Email Address
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
                  id="forgot-email"
                  className="form-input"
                  placeholder="e.g. reader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.75rem' }}
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="btn-request-otp"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link
                to="/login"
                id="link-back-to-login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                <ArrowLeft size={16} />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: Verify OTP Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="input-otp">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                id="input-otp"
                className="form-input"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  letterSpacing: '0.3em',
                  fontFamily: 'monospace'
                }}
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="btn-verify-otp"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', fontSize: '0.875rem' }}>
              <button
                type="button"
                id="btn-change-email"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
              >
                Change Email
              </button>
              <button
                type="button"
                id="btn-resend-otp"
                style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                onClick={handleRequestOtp}
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password Form */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="input-new-password">
                New Password
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
                  type={showNewPassword ? 'text' : 'password'}
                  id="input-new-password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  disabled={loading}
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  id="toggle-new-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="input-confirm-password">
                Confirm New Password
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="input-confirm-password"
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  id="toggle-confirm-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="btn-reset-password"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Step 4: Success Screen */}
        {step === 4 && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link
              to="/login"
              className="btn btn-primary"
              id="btn-go-to-login"
              style={{ width: '100%', display: 'inline-flex', justifyContent: 'center' }}
            >
              Sign In to Your Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
