import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  AlertCircle
} from 'lucide-react';

const ShareModal = ({ isOpen, onClose, blog }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // URL generation
  const blogId = blog?._id || blog?.id;
  const blogUrl = blogId
    ? `${window.location.origin}/blog/${blogId}`
    : '';

  // Negative Case 3: Invalid or unavailable blog
  const isInvalid = !blog || !blogId || (blog.status && blog.status !== 'published');

  const fallbackCopy = (text) => {
    try {
      const tempInput = document.createElement('textarea');
      tempInput.value = text;
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleCopyLink = async () => {
    if (isInvalid) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(blogUrl).catch(() => {
          fallbackCopy(blogUrl);
        });
      } else {
        fallbackCopy(blogUrl);
      }
    } catch (err) {
      fallbackCopy(blogUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSocialShare = (platform) => {
    if (isInvalid) return;
    const title = encodeURIComponent(blog.title || 'Check out this article');
    const url = encodeURIComponent(blogUrl);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${title}&body=${encodeURIComponent(`Check out this article on Chronicle: ${blogUrl}`)}`;
        break;
      default:
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleNativeShare = async () => {
    if (isInvalid) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog.title,
          text: `Check out "${blog.title}" on Chronicle`,
          url: blogUrl
        });
      } catch (err) {
        // User cancelled or aborted native share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      id="share-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div
        id="share-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth: '460px',
          padding: '1.75rem',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Share2 size={16} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Share Article</h3>
          </div>
          <button
            type="button"
            id="btn-close-share-modal"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: '0.25rem', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Negative Case 3: Invalid Blog Handling */}
        {isInvalid ? (
          <div
            id="share-error-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#fb7185',
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>Cannot share an unavailable or unpublished article.</span>
          </div>
        ) : (
          <div>
            {/* Blog Brief Info */}
            <div
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {blog.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                By {blog.authorName || 'Chronicle Writer'} • {blog.category || 'General'}
              </div>
            </div>

            {/* Direct Link Copy Box */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Article Link
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  id="share-link-input"
                  className="form-input"
                  value={blogUrl}
                  readOnly
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', flex: 1 }}
                />
                <button
                  type="button"
                  id="btn-copy-share-link"
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-primary'}`}
                  onClick={handleCopyLink}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              {copied && (
                <span id="share-copy-toast" className="text-xs text-success" style={{ display: 'block', marginTop: '0.35rem' }}>
                  ✓ Link copied to clipboard!
                </span>
              )}
            </div>

            {/* Sharing Options Grid */}
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '0.65rem', fontWeight: 600 }}>
                Share to Platform
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {/* Twitter / X */}
                <button
                  type="button"
                  id="btn-share-twitter"
                  className="share-option-btn"
                  onClick={() => handleSocialShare('twitter')}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>𝕏</span>
                  <span style={{ fontSize: '0.85rem' }}>Twitter / X</span>
                </button>

                {/* LinkedIn */}
                <button
                  type="button"
                  id="btn-share-linkedin"
                  className="share-option-btn"
                  onClick={() => handleSocialShare('linkedin')}
                >
                  <span style={{ color: '#0a66c2', fontWeight: 700, fontSize: '0.95rem' }}>in</span>
                  <span style={{ fontSize: '0.85rem' }}>LinkedIn</span>
                </button>

                {/* Facebook */}
                <button
                  type="button"
                  id="btn-share-facebook"
                  className="share-option-btn"
                  onClick={() => handleSocialShare('facebook')}
                >
                  <span style={{ color: '#1877f2', fontWeight: 700, fontSize: '0.95rem' }}>f</span>
                  <span style={{ fontSize: '0.85rem' }}>Facebook</span>
                </button>

                {/* Email */}
                <button
                  type="button"
                  id="btn-share-email"
                  className="share-option-btn"
                  onClick={() => handleSocialShare('email')}
                >
                  <Mail size={15} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.85rem' }}>Email</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
