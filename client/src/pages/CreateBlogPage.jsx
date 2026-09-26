import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import { isContentEmpty } from '../utils/richText';
import {
  ArrowLeft,
  Send,
  Save,
  Image as ImageIcon,
  Tag,
  FolderOpen,
  Sparkles,
  AlertCircle,
  UploadCloud,
  Link as LinkIcon,
  CheckCircle2,
  Trash2
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

  // Device Cover Upload State
  const fileInputRef = useRef(null);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Handle Image File Selection & Compression
  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP, or GIF).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image file exceeds the 8MB maximum size limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target.result;
      const img = new Image();
      img.onload = () => {
        // Optimize image resolution to max 1600px width/height for fast loading
        const maxWidth = 1600;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const optimizedDataUrl = canvas.toDataURL(mimeType, 0.88);

        setCoverImage(optimizedDataUrl);
        setUploadedFileName(file.name);
        setError('');
      };
      img.onerror = () => {
        setError('Failed to parse selected image file.');
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setError('Error reading image file from system storage.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveCover = () => {
    setCoverImage('');
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (targetStatus = 'published') => {
    setError('');

    // Strict validation for required fields
    if (!title.trim() || isContentEmpty(content)) {
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
        navigate('/profile');
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

          {/* Cover Photo Section with Device Upload & URL Options */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.65rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <label
                className="form-label"
                style={{
                  marginBottom: 0,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ImageIcon size={15} />
                Cover Photo (Optional)
              </label>

              {/* Upload Mode Selector */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--bg-surface)',
                  padding: '3px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-medium)',
                  gap: '2px'
                }}
              >
                <button
                  type="button"
                  id="btn-mode-file"
                  className={`btn btn-sm ${uploadMode === 'file' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setUploadMode('file')}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.775rem',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <UploadCloud size={13} />
                  <span>Upload from Device</span>
                </button>
                <button
                  type="button"
                  id="btn-mode-url"
                  className={`btn btn-sm ${uploadMode === 'url' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setUploadMode('url')}
                  style={{
                    padding: '0.25rem 0.65rem',
                    fontSize: '0.775rem',
                    height: '28px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <LinkIcon size={13} />
                  <span>Image URL</span>
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <div>
                {/* Hidden Native File Input */}
                <input
                  type="file"
                  id="blog-cover-file-input"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {/* Dropzone Container */}
                <div
                  id="cover-dropzone-area"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  style={{
                    border: isDragging ? '2px dashed var(--primary)' : '2px dashed var(--border-medium)',
                    background: isDragging ? 'var(--primary-light)' : 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem 1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 0.75rem auto'
                    }}
                  >
                    <UploadCloud size={22} />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    Click to browse or drag & drop cover image from device
                  </p>
                  <p className="text-xs text-muted">
                    Supports PNG, JPG, JPEG, WEBP, or GIF (Up to 8MB)
                  </p>
                  {uploadedFileName && (
                    <div
                      className="badge badge-Technology"
                      style={{
                        marginTop: '0.75rem',
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        padding: '0.3rem 0.75rem'
                      }}
                    >
                      <CheckCircle2 size={13} /> {uploadedFileName}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="url"
                  id="input-blog-cover-url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={coverImage.startsWith('data:') ? '' : coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    setUploadedFileName('');
                  }}
                  disabled={loading}
                />
                <span className="text-xs text-muted" style={{ marginTop: '0.35rem', display: 'block' }}>
                  Paste any direct public image URL to use as the hero header.
                </span>
              </div>
            )}

            {/* Live Cover Photo Preview Card */}
            {coverImage && (
              <div
                id="cover-photo-preview-card"
                style={{
                  position: 'relative',
                  marginTop: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-card)'
                }}
              >
                <img
                  src={coverImage}
                  alt="Cover Preview"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    display: 'flex',
                    gap: '0.5rem'
                  }}
                >
                  <button
                    type="button"
                    id="btn-remove-cover"
                    className="btn btn-danger btn-sm"
                    onClick={handleRemoveCover}
                    title="Remove cover photo"
                    style={{ padding: '0.35rem 0.75rem', backdropFilter: 'blur(8px)' }}
                  >
                    <Trash2 size={14} />
                    <span>Remove Photo</span>
                  </button>
                </div>
                <div
                  style={{
                    padding: '0.5rem 0.85rem',
                    background: 'var(--bg-card)',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <span>Cover Photo Active</span>
                  <span>{uploadedFileName || (coverImage.startsWith('data:') ? 'Uploaded from Device' : 'External URL')}</span>
                </div>
              </div>
            )}
          </div>


          {/* Rich Content Editor */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label
              htmlFor="input-blog-content"
              className="form-label"
              style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}
            >
              Story Content <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <RichTextEditor
              id="input-blog-content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your story here... Supports rich formatting including bold, italic, headings, lists, and links."
              disabled={loading}
              minHeight="280px"
              required
            />
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
