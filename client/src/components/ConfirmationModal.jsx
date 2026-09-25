import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action? This cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  icon: CustomIcon
}) => {
  const confirmBtnRef = useRef(null);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Auto-focus confirm or cancel button for accessibility
      setTimeout(() => {
        if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        }
      }, 50);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';
  const IconComponent = CustomIcon || (isDanger ? Trash2 : AlertTriangle);

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
  };

  return (
    <div
      id="confirmation-modal-overlay"
      onClick={loading ? undefined : onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1rem',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div
        id="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle)',
          width: '100%',
          maxWidth: '460px',
          padding: '1.75rem',
          position: 'relative',
          animation: 'modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-full)',
              background: isDanger ? 'rgba(244, 63, 94, 0.14)' : 'rgba(245, 158, 11, 0.14)',
              color: isDanger ? '#fb7185' : '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isDanger
                ? '0 0 16px rgba(244, 63, 94, 0.25)'
                : '0 0 16px rgba(245, 158, 11, 0.25)'
            }}
          >
            <IconComponent size={22} />
          </div>

          <div style={{ flex: 1, paddingTop: '0.15rem' }}>
            <h3
              id="confirmation-modal-title"
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em'
              }}
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            id="btn-modal-close-x"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Message */}
        <div
          id="confirmation-modal-message"
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.925rem',
            lineHeight: 1.6,
            marginBottom: '1.75rem'
          }}
        >
          {typeof message === 'string' ? <p style={{ margin: 0 }}>{message}</p> : message}
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <button
            type="button"
            id="btn-modal-cancel"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={loading}
            style={{ padding: '0.45rem 1rem', fontSize: '0.875rem' }}
          >
            {cancelText}
          </button>

          <button
            type="button"
            ref={confirmBtnRef}
            id="btn-modal-confirm"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} btn-sm`}
            onClick={handleConfirm}
            disabled={loading}
            style={{
              padding: '0.45rem 1.15rem',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {loading && (
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite'
                }}
              />
            )}
            <span>{loading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
