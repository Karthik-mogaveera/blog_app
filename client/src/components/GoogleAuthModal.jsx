import React, { useState } from 'react';
import GoogleIcon from './GoogleIcon';
import { X, User, AlertCircle, PlusCircle } from 'lucide-react';

const GoogleAuthModal = ({
  isOpen,
  onClose,
  onSelectAccount,
  onSimulateError,
  loading = false
}) => {
  const [showCustom, setShowCustom] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  if (!isOpen) return null;

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    onSelectAccount({
      googleId: `google_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: customEmail.trim().toLowerCase(),
      name: customName.trim() || customEmail.split('@')[0],
      avatar: null
    });
  };

  return (
    <div className="google-modal-overlay" id="google-auth-modal" onClick={onClose}>
      <div
        className="google-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-modal-title"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <GoogleIcon size={24} />
            <h3 id="google-modal-title" style={{ fontSize: '1.2rem', margin: 0 }}>
              Sign in with Google
            </h3>
          </div>
          <button
            type="button"
            id="btn-google-close"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
            title="Cancel"
            aria-label="Close Google sign in"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-secondary" style={{ marginBottom: '1.5rem' }}>
          Choose a Google Account to continue to <strong>Chronicle</strong>.
        </p>

        {/* Account List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {/* Account 1 */}
          <button
            type="button"
            id="google-account-alex"
            className="google-account-item"
            disabled={loading}
            onClick={() =>
              onSelectAccount({
                googleId: 'google_user_alex_123',
                email: 'alex.reader@gmail.com',
                name: 'Alex Johnson',
                avatar: null
              })
            }
          >
            <div
              className="avatar avatar-sm"
              style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)', color: 'white', fontWeight: 600 }}
            >
              AJ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Alex Johnson</span>
              <span className="text-xs text-muted">alex.reader@gmail.com</span>
            </div>
          </button>

          {/* Account 2 */}
          <button
            type="button"
            id="google-account-sarah"
            className="google-account-item"
            disabled={loading}
            onClick={() =>
              onSelectAccount({
                googleId: 'google_user_sarah_456',
                email: 'sarah.tech@gmail.com',
                name: 'Sarah Miller',
                avatar: null
              })
            }
          >
            <div
              className="avatar avatar-sm"
              style={{ background: 'linear-gradient(135deg, #EA4335, #FBBC05)', color: 'white', fontWeight: 600 }}
            >
              SM
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Sarah Miller</span>
              <span className="text-xs text-muted">sarah.tech@gmail.com</span>
            </div>
          </button>
        </div>

        {/* Custom account toggle */}
        {!showCustom ? (
          <button
            type="button"
            id="google-account-custom-toggle"
            className="text-sm"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500,
              padding: '0.25rem 0',
              marginBottom: '1.25rem'
            }}
            onClick={() => setShowCustom(true)}
          >
            <PlusCircle size={16} />
            Use another Google account
          </button>
        ) : (
          <form onSubmit={handleCustomSubmit} style={{ marginBottom: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label text-xs" htmlFor="google-custom-email">
                Google Email
              </label>
              <input
                type="email"
                id="google-custom-email"
                className="form-input text-sm"
                placeholder="name@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label text-xs" htmlFor="google-custom-name">
                Full Name
              </label>
              <input
                type="text"
                id="google-custom-name"
                className="form-input text-sm"
                placeholder="Your Name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                id="btn-google-custom-submit"
                className="btn btn-primary text-xs"
                style={{ flex: 1 }}
                disabled={loading}
              >
                Sign in with this account
              </button>
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => setShowCustom(false)}
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Actions / Negative test trigger & Cancel */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            id="btn-google-simulate-fail"
            className="text-xs text-muted"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            onClick={onSimulateError}
            title="Simulate Google authentication failure for testing"
          >
            <AlertCircle size={14} />
            Simulate Auth Error
          </button>

          <button
            type="button"
            id="btn-google-cancel"
            className="btn btn-secondary text-xs"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;
