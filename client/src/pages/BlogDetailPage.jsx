import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CommentTree from '../components/CommentTree';
import ShareModal from '../components/ShareModal';
import {
  Heart,
  Bookmark,
  MessageSquare,
  Calendar,
  User,
  ArrowLeft,
  Share2,
  LogIn,
  UserPlus,
  Send,
  Sparkles
} from 'lucide-react';

const BlogDetailPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [likeCount, setLikeCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [userHasSaved, setUserHasSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveTooltip, setSaveTooltip] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [likeTooltip, setLikeTooltip] = useState(false);

  // Fetch Blog Details
  const fetchBlog = useCallback(async () => {
    try {
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/blogs/${id}`, { headers });
      const data = await res.json();

      if (data.success && data.blog) {
        setBlog(data.blog);
        setLikeCount(data.blog.likeCount || 0);
        setUserHasLiked(data.blog.userHasLiked || false);
        setUserHasSaved(data.blog.userHasSaved || false);
      } else {
        setError(data.message || 'Article not found');
      }
    } catch (err) {
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  // Fetch Comments for this blog
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments/blog/${id}`);
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [fetchBlog, fetchComments]);

  // Handle Like Toggle
  const handleLikeToggle = async () => {
    if (!user) {
      setLikeTooltip(true);
      setTimeout(() => setLikeTooltip(false), 3000);
      return;
    }

    setLikeLoading(true);
    try {
      const res = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ blogId: blog._id || blog.id })
      });
      const data = await res.json();
      if (data.success) {
        setUserHasLiked(data.userHasLiked);
        setLikeCount(data.likeCount);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  // Handle Save / Bookmark Toggle
  const handleSaveToggle = async () => {
    if (!user) {
      setSaveTooltip(true);
      setTimeout(() => setSaveTooltip(false), 3500);
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch('/api/saved/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ blogId: blog._id || blog.id })
      });
      const data = await res.json();
      if (data.success) {
        setUserHasSaved(data.isSaved);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle Share Click
  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  // Submit Top-Level Comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmittingComment(true);
    setCommentError('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          blogId: blog._id || blog.id,
          content: newCommentText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewCommentText('');
        fetchComments();
      } else {
        setCommentError(data.message || 'Failed to post comment');
      }
    } catch (err) {
      setCommentError('Network error while posting comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Reply to existing comment
  const handleReply = async (parentId, text) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        blogId: blog._id || blog.id,
        parentId,
        content: text
      })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to post reply');
    }
    fetchComments();
  };

  // Edit Comment
  const handleEditComment = async (commentId, text) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ content: text })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to update comment');
    }
    fetchComments();
  };

  // Delete Comment (with cascade)
  const handleDeleteComment = async (commentId) => {
    const res = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete comment');
    }
    fetchComments();
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <p className="text-muted">Loading article details...</p>
      </div>
    );
  }

  // Edge Case #21: Strict 404 for nonexistent or draft/unpublished articles
  if (error || !blog) {
    return (
      <div className="container content-narrow" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem' }}>404</h1>
        <h2 style={{ marginBottom: '1rem' }}>Article Not Found</h2>
        <p className="text-secondary" style={{ marginBottom: '2rem' }}>
          The article you are looking for may have been unpublished, deleted, or does not exist.
        </p>
        <Link to="/" className="btn btn-primary" id="not-found-home-btn">
          <ArrowLeft size={16} />
          Return to Articles
        </Link>
      </div>
    );
  }

  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Draft';

  return (
    <div className="container content-narrow" style={{ paddingBottom: '6rem' }}>
      {/* Back Button */}
      <div style={{ paddingTop: '2rem' }}>
        <Link to="/" className="btn btn-ghost btn-sm" id="btn-back-to-articles">
          <ArrowLeft size={16} />
          Back to all articles
        </Link>
      </div>

      {/* Article Header */}
      <header className="article-header">
        <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
          <span className={`badge badge-${blog.category || 'General'}`}>
            {blog.category || 'General'}
          </span>
          {blog.status === 'draft' && (
            <span className="badge badge-draft">Draft Preview</span>
          )}
        </div>

        <h1 className="article-title">{blog.title}</h1>

        <div className="article-author-meta">
          <div className="avatar avatar-sm">
            {blog.authorName ? blog.authorName.slice(0, 2).toUpperCase() : 'A'}
          </div>
          <div>
            <span className="font-bold text-primary">{blog.authorName || 'Admin'}</span>
            <span className="text-xs text-muted" style={{ display: 'block' }}>
              Published on {formattedDate}
            </span>
          </div>
        </div>

        {/* Optional Cover Image */}
        {blog.coverImage && (
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="article-cover-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        )}
      </header>

      {/* Article Body Content */}
      <article className="article-body-content" id="article-body-text">
        {blog.content}
      </article>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div style={{ marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {blog.tags.map((t, idx) => (
            <span key={idx} className="tag-chip">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Like Bar & Community Stats */}
      <section className="like-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Like Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`like-btn ${userHasLiked ? 'liked' : ''}`}
              id="btn-like-toggle"
              onClick={handleLikeToggle}
              disabled={likeLoading}
              title={user ? (userHasLiked ? 'Unlike article' : 'Like article') : 'Log in to like'}
            >
              <Heart size={18} fill={userHasLiked ? '#f43f5e' : 'none'} />
              <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
            </button>

            {/* Guest Like Tooltip */}
            {likeTooltip && (
              <div
                style={{
                  position: 'absolute',
                  top: '-45px',
                  left: 0,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-lg)',
                  whiteSpace: 'nowrap',
                  zIndex: 10
                }}
              >
                Please <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>log in</Link> to like this article.
              </div>
            )}
          </div>

          {/* Save Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`save-btn ${userHasSaved ? 'saved' : ''}`}
              id="btn-save-blog"
              onClick={handleSaveToggle}
              disabled={saveLoading}
              title={user ? (userHasSaved ? 'Remove from saved' : 'Save article') : 'Log in to save'}
            >
              <Bookmark size={18} fill={userHasSaved ? 'currentColor' : 'none'} />
              <span>{userHasSaved ? 'Saved' : 'Save'}</span>
            </button>

            {/* Guest Save Prompt Tooltip */}
            {saveTooltip && (
              <div
                id="save-guest-prompt"
                style={{
                  position: 'absolute',
                  top: '-45px',
                  left: 0,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-lg)',
                  whiteSpace: 'nowrap',
                  zIndex: 10
                }}
              >
                Please <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>log in</Link> to save this article.
              </div>
            )}
          </div>

          {/* Share Button */}
          <button
            type="button"
            className="share-btn"
            id="btn-share-blog"
            onClick={handleShareClick}
            title="Share article"
          >
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-muted text-sm">
          <MessageSquare size={16} />
          <span>{comments.length} Comments</span>
        </div>
      </section>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        blog={blog}
      />

      {/* Discussions Section */}
      <section className="comment-section" id="discussion-section">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Discussion</span>
          <span className="badge badge-General">{comments.length}</span>
        </h3>

        {/* Guest CTA Banner (Edge Case #11) */}
        {!user ? (
          <div className="guest-cta-banner" id="guest-cta-banner">
            <div className="guest-cta-content">
              <h4>Join the conversation</h4>
              <p>Log in or register an account to like articles and participate in threaded discussions.</p>
            </div>
            <div className="guest-cta-buttons flex items-center gap-2 flex-wrap">
              <Link to="/login" className="btn btn-secondary btn-sm" id="cta-login-btn">
                <LogIn size={15} /> Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" id="cta-register-btn">
                <UserPlus size={15} /> Register
              </Link>
            </div>
          </div>
        ) : (
          /* Logged-In Top-Level Comment Submission Form */
          <form onSubmit={handleCommentSubmit} className="comment-input-box" id="new-comment-form">
            <div className="flex items-center gap-2" style={{ marginBottom: '0.75rem' }}>
              <div className="avatar avatar-sm">{user.initials || user.username.slice(0, 2).toUpperCase()}</div>
              <span className="font-semibold text-sm">Comment as {user.username}</span>
            </div>

            <textarea
              className="form-textarea"
              id="comment-input-textarea"
              placeholder="What are your thoughts on this article? Share your perspective..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              rows={3}
              style={{ minHeight: '90px', marginBottom: '0.75rem' }}
              disabled={submittingComment}
            />

            {commentError && <p className="form-error" style={{ marginBottom: '0.75rem' }}>{commentError}</p>}

            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Supports respectful community discourse</span>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                id="comment-submit-btn"
                disabled={submittingComment || !newCommentText.trim()}
              >
                <Send size={14} />
                {submittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        )}

        {/* Multi-Level Comment Tree */}
        <CommentTree
          comments={comments}
          onReply={handleReply}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
        />
      </section>
    </div>
  );
};

export default BlogDetailPage;
