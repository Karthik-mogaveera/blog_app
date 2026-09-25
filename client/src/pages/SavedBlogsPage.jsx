import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bookmark,
  BookmarkX,
  Calendar,
  User,
  ArrowRight,
  BookOpen,
  Sparkles,
  Heart,
  MessageSquare
} from 'lucide-react';

const SavedBlogsPage = () => {
  const { user, token } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const fetchSavedBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/saved', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSavedItems(data.savedBlogs || []);
      } else {
        setError(data.message || 'Failed to load saved articles.');
      }
    } catch (err) {
      setError('Network error while loading saved articles.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSavedBlogs();
    }
  }, [token, fetchSavedBlogs]);

  const handleRemove = async (blogId) => {
    setRemovingId(blogId);
    try {
      const res = await fetch(`/api/saved/${blogId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSavedItems((prev) => prev.filter((item) => (item.blog?._id || item.blog?.id) !== blogId));
      }
    } catch (err) {
      console.error('Failed to remove saved article:', err);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '6rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bookmark size={18} />
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Saved Articles
            </h1>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.95rem', margin: 0 }}>
            Your personal reading list saved for later access
          </p>
        </div>

        <div className="badge badge-Technology" style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
          {savedItems.length} {savedItems.length === 1 ? 'article saved' : 'articles saved'}
        </div>
      </div>

      {error && (
        <div className="card" style={{ padding: '1rem', color: 'var(--accent-rose)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
          Loading saved reading list...
        </div>
      ) : savedItems.length === 0 ? (
        <div
          id="empty-saved-message"
          className="card"
          style={{
            textAlign: 'center',
            padding: '5rem 2rem',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-hover)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <BookmarkX size={28} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No saved articles yet
          </h3>
          <p className="text-secondary" style={{ maxWidth: '420px', margin: '0 auto 1.75rem auto', fontSize: '0.9rem' }}>
            When reading articles, click the <strong>Save</strong> button to add them here and build your personal knowledge library.
          </p>
          <Link to="/" className="btn btn-primary" id="btn-browse-articles">
            <BookOpen size={16} />
            <span>Discover Articles</span>
          </Link>
        </div>
      ) : (
        <div id="saved-articles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {savedItems.map(({ savedId, blog }) => {
            if (!blog) return null;
            const bId = blog._id || blog.id;
            return (
              <div
                key={savedId || bId}
                className="card blog-card"
                id={`saved-card-${bId}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-card)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {blog.coverImage && (
                  <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}

                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span className={`badge badge-${blog.category || 'General'}`}>
                      {blog.category || 'General'}
                    </span>
                    <button
                      type="button"
                      id={`btn-unsave-${bId}`}
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRemove(bId)}
                      disabled={removingId === bId}
                      title="Remove from saved reading list"
                      style={{
                        padding: '0.3rem 0.6rem',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <BookmarkX size={14} />
                      <span>{removingId === bId ? 'Removing...' : 'Remove'}</span>
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.35, marginBottom: '0.65rem' }}>
                    <Link
                      to={`/blog/${bId}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                      className="hover:text-primary transition-colors"
                    >
                      {blog.title}
                    </Link>
                  </h3>

                  <p
                    className="text-secondary"
                    style={{
                      fontSize: '0.85rem',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      flex: 1
                    }}
                  >
                    {blog.content}
                  </p>

                  <div
                    style={{
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      @{blog.authorName || 'Admin'}
                    </span>
                    <Link
                      to={`/blog/${bId}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: 'var(--primary)',
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      Read story <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedBlogsPage;
