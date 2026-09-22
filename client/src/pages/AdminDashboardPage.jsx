import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Heart,
  MessageSquare,
  Shield,
  Search
} from 'lucide-react';

const AdminDashboardPage = () => {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch all blogs (drafts + published) for Admin
  const fetchAdminBlogs = useCallback(async () => {
    try {
      const res = await fetch('/api/blogs/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs || []);
      } else {
        setError(data.message || 'Failed to load blogs');
      }
    } catch (err) {
      setError('Network error loading admin dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    fetchAdminBlogs();
  }, [isAdmin, navigate, fetchAdminBlogs]);

  // Toggle Publish / Unpublish
  const handleTogglePublish = async (blog) => {
    setActionLoading(blog._id || blog.id);
    try {
      const res = await fetch(`/api/blogs/${blog._id || blog.id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) =>
          prev.map((b) =>
            (b._id || b.id) === (blog._id || blog.id) ? { ...b, status: data.status } : b
          )
        );
      } else {
        alert(data.message || 'Failed to update publication status');
      }
    } catch (err) {
      alert('Network error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  // Permanent Cascade Delete
  const handleDeleteBlog = async (blog) => {
    const confirmMsg = `Are you sure you want to permanently delete "${blog.title}"?\n\nWARNING: This will permanently purge this article and all of its ${blog.commentCount || 0} comments and ${blog.likeCount || 0} likes with zero residue!`;
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(blog._id || blog.id);
    try {
      const res = await fetch(`/api/blogs/${blog._id || blog.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.filter((b) => (b._id || b.id) !== (blog._id || blog.id)));
      } else {
        alert(data.message || 'Failed to delete blog');
      }
    } catch (err) {
      alert('Network error deleting blog');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBlogs = blogs.filter((b) =>
    b.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    b.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    b.authorName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 6rem 1.5rem' }}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
            <Shield size={20} className="text-accent-purple" />
            <h2 style={{ fontSize: '1.8rem' }}>Admin Blog Studio</h2>
          </div>
          <p className="text-secondary text-sm">
            Create, publish, unpublish, and manage complete editorial lifecycles.
          </p>
        </div>

        <Link to="/admin/blogs/new" className="btn btn-primary" id="admin-create-blog-btn">
          <PlusCircle size={18} />
          Create New Article
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex gap-2" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Filter studio articles..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ paddingLeft: '2.5rem', fontSize: '0.875rem' }}
          />
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Blogs Management Table */}
      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading studio articles...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No articles found. Click "Create New Article" to draft your first post!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table" id="admin-blogs-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Engagement</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlogs.map((b) => {
                  const id = b._id || b.id;
                  const isActionBusy = actionLoading === id;
                  return (
                    <tr key={id} id={`admin-blog-row-${id}`}>
                      {/* Title */}
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '280px' }}>
                        <Link to={`/blog/${id}`} style={{ color: 'inherit' }} title={b.title}>
                          {b.title}
                        </Link>
                      </td>

                      {/* Category */}
                      <td>
                        <span className={`badge badge-${b.category || 'General'}`}>
                          {b.category}
                        </span>
                      </td>

                      {/* Author */}
                      <td>{b.authorName}</td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${b.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                          {b.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      {/* Engagement */}
                      <td>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1" title={`${b.likeCount || 0} likes`}>
                            <Heart size={13} className={(b.likeCount || 0) > 0 ? 'text-accent-rose' : ''} />
                            {b.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1" title={`${b.commentCount || 0} comments`}>
                            <MessageSquare size={13} className={(b.commentCount || 0) > 0 ? 'text-primary' : ''} />
                            {b.commentCount || 0}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="text-xs text-muted">
                        {new Date(b.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1">
                          {/* View Link */}
                          <Link
                            to={`/blog/${id}`}
                            className="btn btn-ghost btn-sm"
                            title="Preview article"
                            id={`admin-view-btn-${id}`}
                          >
                            <Eye size={15} />
                          </Link>

                          {/* Edit Link */}
                          <Link
                            to={`/admin/blogs/${id}/edit`}
                            className="btn btn-ghost btn-sm"
                            title="Edit article"
                            id={`admin-edit-btn-${id}`}
                          >
                            <Edit size={15} />
                          </Link>

                          {/* Publish / Unpublish Toggle */}
                          <button
                            type="button"
                            className={`btn btn-sm ${b.status === 'published' ? 'btn-outline' : 'btn-secondary'}`}
                            onClick={() => handleTogglePublish(b)}
                            disabled={isActionBusy}
                            title={b.status === 'published' ? 'Unpublish article (hides from visitors)' : 'Publish article'}
                            id={`admin-publish-toggle-btn-${id}`}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            {b.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>

                          {/* Permanent Delete */}
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => handleDeleteBlog(b)}
                            disabled={isActionBusy}
                            title="Permanently delete article and all comments"
                            id={`admin-delete-btn-${id}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
