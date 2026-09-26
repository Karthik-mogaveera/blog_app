import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  PenSquare,
  BookOpen,
  Calendar,
  Heart,
  MessageSquare,
  Trash2,
  ExternalLink,
  Edit3,
  Plus
} from 'lucide-react';

const MyStoriesPage = () => {
  const { user, token } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [storyToDelete, setStoryToDelete] = useState(null);

  const fetchMyStories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/blogs/me/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs || []);
      } else {
        setError(data.message || 'Failed to load your stories.');
      }
    } catch (err) {
      setError('Network error loading your stories.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMyStories();
  }, [fetchMyStories]);

  // Toggle Publish / Unpublish for reader story
  const handleTogglePublish = async (blog) => {
    const blogId = blog._id || blog.id;
    setTogglingId(blogId);
    try {
      const res = await fetch(`/api/blogs/${blogId}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) =>
          prev.map((b) =>
            (b._id === blogId || b.id === blogId) ? { ...b, status: data.status } : b
          )
        );
      } else {
        alert(data.message || 'Failed to update publication status');
      }
    } catch (err) {
      alert('Network error updating status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!storyToDelete) return;
    const blogId = storyToDelete._id || storyToDelete.id;

    setDeletingId(blogId);
    try {
      const res = await fetch(`/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== blogId && b.id !== blogId));
        setStoryToDelete(null);
      } else {
        alert(data.message || 'Failed to delete story.');
      }
    } catch (err) {
      alert('Error deleting story.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '960px', paddingTop: '3rem', paddingBottom: '6rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            My Stories
          </h1>
          <p className="text-secondary" style={{ marginTop: '0.25rem' }}>
            Manage and view all articles published by <strong>@{user?.username}</strong>
          </p>
        </div>

        <Link
          to="/create-blog"
          id="btn-write-new-story"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={18} />
          <span>Write a Story</span>
        </Link>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>Loading your stories...</p>
        </div>
      ) : blogs.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(79, 70, 229, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <BookOpen size={28} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            You haven't written any stories yet
          </h2>
          <p className="text-secondary" style={{ maxWidth: '420px', margin: '0 auto 1.75rem auto', fontSize: '0.95rem' }}>
            Share your knowledge, tutorials, or perspectives with the Chronicle community.
          </p>
          <Link to="/create-blog" className="btn btn-primary" id="btn-empty-write-story">
            <Plus size={16} />
            <span>Write Your First Story</span>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} id="my-stories-list">
          {blogs.map((blog) => (
            <div
              key={blog._id || blog.id}
              className="card"
              id={`my-story-card-${blog._id || blog.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span className={`badge badge-${blog.category || 'General'}`}>
                    {blog.category || 'General'}
                  </span>
                  <span
                    id={`story-status-badge-${blog._id || blog.id}`}
                    className={`badge ${blog.status === 'published' ? 'badge-published' : 'badge-draft'}`}
                  >
                    {blog.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-1">
                    <Calendar size={13} />
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Link
                  to={`/blog/${blog._id || blog.id}`}
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textDecoration: 'none'
                  }}
                  className="hover-underline"
                >
                  {blog.title}
                </Link>
              </div>

              {/* Engagement Stats and Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Heart size={15} />
                    {blog.likeCount || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MessageSquare size={15} />
                    {blog.commentCount || 0}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {/* Status Toggle Button (Draft <-> Published) */}
                  <button
                    type="button"
                    id={`btn-publish-toggle-${blog._id || blog.id}`}
                    className={`btn btn-sm ${blog.status === 'published' ? 'btn-outline' : 'btn-secondary'}`}
                    onClick={() => handleTogglePublish(blog)}
                    disabled={togglingId === (blog._id || blog.id) || deletingId === (blog._id || blog.id)}
                    title={blog.status === 'published' ? 'Unpublish story (moves to draft)' : 'Publish story (makes visible to readers)'}
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  >
                    {togglingId === (blog._id || blog.id)
                      ? 'Updating...'
                      : blog.status === 'published'
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>

                  <Link
                    to={`/edit-blog/${blog._id || blog.id}`}
                    id={`btn-edit-story-${blog._id || blog.id}`}
                    className="btn btn-ghost btn-sm"
                    title="Edit article"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Edit3 size={16} />
                  </Link>
                  <Link
                    to={`/blog/${blog._id || blog.id}`}
                    id={`btn-view-story-${blog._id || blog.id}`}
                    className="btn btn-ghost btn-sm"
                    title="View article"
                  >
                    <ExternalLink size={16} />
                  </Link>
                  <button
                    type="button"
                    id={`btn-delete-story-${blog._id || blog.id}`}
                    className="btn btn-ghost btn-sm text-accent-rose"
                    onClick={() => setStoryToDelete(blog)}
                    disabled={deletingId === (blog._id || blog.id) || togglingId === (blog._id || blog.id)}
                    title="Delete story"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal for Story Deletion */}
      <ConfirmationModal
        isOpen={Boolean(storyToDelete)}
        title="Delete Story"
        message={
          storyToDelete
            ? `Are you sure you want to delete "${storyToDelete.title}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete Story"
        confirmVariant="danger"
        loading={deletingId === (storyToDelete?._id || storyToDelete?.id)}
        onConfirm={handleConfirmDelete}
        onClose={() => setStoryToDelete(null)}
      />
    </div>
  );
};

export default MyStoriesPage;
