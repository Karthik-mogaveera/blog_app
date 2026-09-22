import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Trash2, Edit3, MessageSquare, ExternalLink, Check, X } from 'lucide-react';

const AdminModerationPage = () => {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchModerationComments = useCallback(async () => {
    try {
      const res = await fetch('/api/comments/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load moderation comments:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    fetchModerationComments();
  }, [isAdmin, navigate, fetchModerationComments]);

  // Admin Moderator Edit
  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;
    setActionLoading(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: editText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) =>
          prev.map((c) =>
            (c._id || c.id) === commentId
              ? { ...c, content: editText.trim(), editedBy: 'admin' }
              : c
          )
        );
        setEditingId(null);
      } else {
        alert(data.message || 'Failed to update comment');
      }
    } catch (err) {
      alert('Error saving moderator edit');
    } finally {
      setActionLoading(null);
    }
  };

  // Admin Cascade Delete
  const handleDeleteComment = async (commentId) => {
    const confirmMsg =
      'WARNING: Deleting this comment will permanently remove this comment and ALL of its subordinate nested replies.\n\nProceed with cascade deletion?';
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(commentId);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchModerationComments();
      } else {
        alert(data.message || 'Failed to delete comment');
      }
    } catch (err) {
      alert('Error deleting comment');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 6rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: '0.25rem' }}>
          <ShieldCheck size={22} className="text-accent-purple" />
          <h2 style={{ fontSize: '1.8rem' }}>Community Moderation Hub</h2>
        </div>
        <p className="text-secondary text-sm">
          Review, moderate, edit, or cascade-delete reader discussions across the platform.
        </p>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading moderation queue...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
            <p>No community comments to display.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table" id="admin-moderation-table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Article</th>
                  <th style={{ width: '40%' }}>Comment Content</th>
                  <th>Status</th>
                  <th>Posted On</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments.map((c) => {
                  const id = c._id || c.id;
                  const isEditing = editingId === id;
                  const isBusy = actionLoading === id;

                  return (
                    <tr key={id} id={`moderation-row-${id}`}>
                      {/* Author */}
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm">
                            {c.userId?.username ? c.userId.username.slice(0, 2).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-sm" style={{ display: 'block' }}>
                              {c.userId?.username || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted">{c.userId?.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Blog Link */}
                      <td>
                        <Link
                          to={`/blog/${c.blogId?._id || c.blogId}`}
                          className="flex items-center gap-1 text-xs text-primary"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.blogTitle || 'View Article'}
                          </span>
                          <ExternalLink size={12} />
                        </Link>
                      </td>

                      {/* Comment Body / Inline Edit */}
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <textarea
                              className="form-textarea"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                              style={{ minHeight: '60px', fontSize: '0.875rem' }}
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleSaveEdit(id)}
                                disabled={isBusy}
                              >
                                <Check size={14} /> Save
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditingId(null)}
                                disabled={isBusy}
                              >
                                <X size={14} /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                            {c.content}
                          </span>
                        )}
                      </td>

                      {/* Status / Edited Badges */}
                      <td>
                        {c.editedBy === 'admin' ? (
                          <span className="badge badge-Technology" style={{ fontSize: '0.7rem' }}>
                            (edited by Admin)
                          </span>
                        ) : c.editedBy === 'author' ? (
                          <span className="badge badge-General" style={{ fontSize: '0.7rem' }}>
                            (edited)
                          </span>
                        ) : (
                          <span className="text-xs text-muted">Original</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="text-xs text-muted">
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-1">
                          {!isEditing && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingId(id);
                                setEditText(c.content);
                              }}
                              title="Edit as moderator"
                              id={`mod-edit-btn-${id}`}
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm text-danger"
                            onClick={() => handleDeleteComment(id)}
                            disabled={isBusy}
                            title="Cascade delete comment and all replies"
                            id={`mod-delete-btn-${id}`}
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

export default AdminModerationPage;
