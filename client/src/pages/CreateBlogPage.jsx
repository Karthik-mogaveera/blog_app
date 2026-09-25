import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  Send,
  Save,
  Image as ImageIcon,
  Tag,
  FolderOpen,
  Sparkles,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = ['General', 'Technology', 'Design', 'Lifestyle', 'Career', 'Tutorials'];

const CreateBlogPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (targetStatus = 'published') => {
    setError('');

    // Strict validation for required fields
    if (!title.trim() || !content.trim()) {
      setError('Please provide both a title and content for your article.');
      return;
    }

    setLoading(true);
    try {
      const tags = tagsInput
        ? tagsInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
        : [];

      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          tags,
          coverImage: coverImage.trim(),
          status: targetStatus
        })
      });

      const data = await res.json();

      if (!data.success || !data.blog) {
        throw new Error(data.message || 'Failed to submit article.');
      }

      if (targetStatus === 'published') {
        navigate(`/blog/${data.blog._id}`);
      } else {
        navigate('/my-stories');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while saving your article.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '840px', paddingTop: '2.5rem', paddingBottom: '6rem' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/"
          id="btn-back-from-create"
          className="btn btn-ghost btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          Back to Articles
        </Link>
      </div>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Write a Story
          </h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem', fontSize: '0.95rem' }}>
            Publish your insights as <strong className="text-primary">@{user?.username}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            id="btn-save-draft"
            className="btn btn-outline"
            onClick={() => handleSubmit('draft')}
            disabled={loading}
          >
            <Save size={16} />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            id="btn-publish-reader-blog"
            className="btn btn-primary"
            onClick={() => handleSubmit('published')}
            disabled={loading}
          >
            <Send size={16} />
            <span>{loading ? 'Publishing...' : 'Publish Story'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          id="create-blog-error-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#fb7185',
            fontSize: '0.9rem',
            marginBottom: '2rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Creation Card */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit('published'); }}>
          {/* Title Input */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label
              htmlFor="input-blog-title"
              className="form-label"
              style={{ fontSize: '0.95rem', fontWeight: 600 }}
            >
              Story Title <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              id="input-blog-title"
              className="form-input"
              placeholder="e.g. Modern Architecture Patterns in Scalable Web Apps"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              style={{ fontSize: '1.15rem', fontWeight: 600, padding: '0.85rem 1rem' }}
              disabled={loading}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <span className="text-xs text-muted">{title.length} / 150</span>
            </div>
          </div>

          {/* Category & Tags Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            {/* Category Select */}
            <div className="form-group">
              <label
                htmlFor="select-blog-category"
                className="form-label"
                style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FolderOpen size={15} />
                Category
              </label>
              <select
                id="select-blog-category"
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <div className="form-group">
              <label
                htmlFor="input-blog-tags"
                className="form-label"
                style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Tag size={15} />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="input-blog-tags"
                className="form-input"
                placeholder="tech, web, react"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label
              htmlFor="input-blog-cover-url"
              className="form-label"
              style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <ImageIcon size={15} />
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              id="input-blog-cover-url"
              className="form-input"
              placeholder="https://images.unsplash.com/photo-..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              disabled={loading}
            />
            {coverImage && (
              <div style={{ marginTop: '0.75rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '180px' }}>
                <img
                  src={coverImage}
                  alt="Cover preview"
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          {/* Content Textarea */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label
              htmlFor="input-blog-content"
              className="form-label"
              style={{ fontSize: '0.95rem', fontWeight: 600 }}
            >
              Story Content <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <textarea
              id="input-blog-content"
              className="form-input"
              placeholder="Write your story here... Share your thoughts, experience, or tutorials with the community."
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ resize: 'vertical', lineHeight: 1.6, padding: '1rem', minHeight: '260px' }}
              disabled={loading}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Supports plaintext and standard formatting</span>
              <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
            </div>
          </div>

          {/* Bottom Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <Link to="/" className="btn btn-ghost" disabled={loading}>
              Cancel
            </Link>
            <button
              type="submit"
              id="btn-submit-blog"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '0.65rem 1.75rem' }}
            >
              <Send size={16} />
              <span>{loading ? 'Publishing...' : 'Publish Story'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlogPage;
