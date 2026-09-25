import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RichTextEditor from '../components/RichTextEditor';
import { isContentEmpty } from '../utils/richText';
import {
  ArrowLeft,
  Save,
  Send,
  UploadCloud,
  Link as LinkIcon,
  Trash2,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

const CATEGORIES = ['Technology', 'Design', 'Lifestyle', 'Career', 'Tutorials', 'General'];

const BlogEditorPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { token, user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(user?.username || 'Admin');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState('draft');

  // Cover Image Upload State
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [error, setError] = useState('');

  // Fetch article if in Edit mode
  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }

    if (isEditing) {
      const fetchBlog = async () => {
        try {
          const res = await fetch(`/api/blogs/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.blog) {
            const b = data.blog;
            setTitle(b.title || '');
            setContent(b.content || '');
            setAuthorName(b.authorName || 'Admin');
            setCategory(b.category || 'General');
            setTagsInput(b.tags ? b.tags.join(', ') : '');
            setCoverImage(b.coverImage || '');
            setStatus(b.status || 'draft');
            if (b.coverImage) {
              if (b.coverImage.startsWith('http://') || b.coverImage.startsWith('https://')) {
                setUploadMode('url');
              } else {
                setUploadMode('file');
                setUploadedFileName('Existing Cover Image');
              }
            }
          } else {
            setError(data.message || 'Failed to load article for editing');
          }
        } catch (err) {
          setError('Network error fetching article details');
        } finally {
          setFetching(false);
        }
      };
      fetchBlog();
    }
  }, [id, isEditing, isAdmin, navigate, token]);

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

  const handleSave = async (desiredStatus) => {
    setError('');

    if (!title.trim() || isContentEmpty(content)) {
      setError('Please provide both an article title and content body.');
      return;
    }


    setLoading(true);

    const formattedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim() || user?.username || 'Admin',
      category,
      tags: formattedTags,
      coverImage: coverImage.trim(),
      status: desiredStatus || status
    };

    try {
      const url = isEditing ? `/api/blogs/${id}` : '/api/blogs';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        navigate('/admin/blogs');
      } else {
        setError(data.message || 'Failed to save article.');
      }
    } catch (err) {
      setError('Network error saving article.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p className="text-muted">Loading article editor...</p>
      </div>
    );
  }

  return (
    <div className="container content-narrow" style={{ paddingBottom: '6rem' }}>
      {/* Top Header */}
      <div className="flex justify-between items-center flex-wrap gap-3" style={{ marginBottom: '2rem' }}>
        <Link to="/admin/blogs" className="btn btn-ghost btn-sm" id="editor-back-btn">
          <ArrowLeft size={16} /> Back to Studio
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            id="editor-save-draft-btn"
            onClick={() => handleSave('draft')}
            disabled={loading}
          >
            <Save size={15} /> Save as Draft
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            id="editor-publish-btn"
            onClick={() => handleSave('published')}
            disabled={loading}
          >
            <Send size={15} /> {isEditing && status === 'published' ? 'Update & Publish' : 'Publish Article'}
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(1.25rem, 4vw, 2.5rem)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <h2 style={{ marginBottom: '0.5rem' }}>
          {isEditing ? 'Edit Article' : 'Draft New Article'}
        </h2>
        <p className="text-sm text-secondary" style={{ marginBottom: '2rem' }}>
          Configure your title, editorial copy, category classification, cover image, and custom author attribution.
        </p>

        {error && (
          <div
            id="editor-error-banner"
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

        <form onSubmit={(e) => { e.preventDefault(); handleSave(status); }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="blog-title-input">
              Article Title *
            </label>
            <input
              type="text"
              id="blog-title-input"
              className="form-input"
              placeholder="e.g., The Future of Distributed Systems and Modern Web Runtimes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ fontSize: '1.15rem', fontWeight: 600 }}
              required
            />
          </div>

          {/* Category & Custom Author Name Row */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="blog-category-select">
                Category *
              </label>
              <select
                id="blog-category-select"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="blog-author-input">
                Author Attribution Name
              </label>
              <input
                type="text"
                id="blog-author-input"
                className="form-input"
                placeholder="e.g., Guest Author or Pen Name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label" htmlFor="blog-tags-input">
              Tags (Comma-separated)
            </label>
            <input
              type="text"
              id="blog-tags-input"
              className="form-input"
              placeholder="e.g., react, architecture, clean-code, devops"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Cover Photo Section with System Storage Upload */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <div className="flex justify-between items-center flex-wrap gap-2" style={{ marginBottom: '0.65rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
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
                    Click to browse or drag & drop cover image from system storage
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
                  id="blog-cover-input"
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  value={coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    setUploadedFileName('');
                  }}
                />
                <span className="text-xs text-muted" style={{ marginTop: '0.35rem', display: 'block' }}>
                  Paste any direct public image URL to use as the hero header.
                </span>
              </div>
            )}

            {/* Live Cover Photo Preview */}
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
                    color: 'var(--text-muted)'
                  }}
                >
                  <span>Cover photo active (will display on article cards and reading page)</span>
                  <span className="font-semibold text-primary">Preview Ready</span>
                </div>
              </div>
            )}

            <span className="text-xs text-muted" style={{ marginTop: '0.5rem', display: 'block' }}>
              Leave blank to automatically apply an elegant, typography-first editorial layout!
            </span>
          </div>

          {/* Content Body */}
          <div className="form-group">
            <label className="form-label" htmlFor="blog-content-textarea" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Article Body Content *
            </label>
            <RichTextEditor
              id="blog-content-textarea"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article body here... Supports rich formatting including bold, italic, headings, lists, and links."
              disabled={loading}
              minHeight="300px"
              required
            />
          </div>

        </form>
      </div>
    </div>
  );
};

export default BlogEditorPage;
