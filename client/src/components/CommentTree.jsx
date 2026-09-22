import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Edit3, Trash2, CornerDownRight, Check, X } from 'lucide-react';

const CommentItem = ({
  comment,
  repliesMap,
  onReply,
  onEdit,
  onDelete
}) => {
  const { user, isAdmin } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const authorId = comment.author?.id || (comment.userId?._id || comment.userId);
  const currentUserId = user?._id || user?.id;

  const isAuthor = Boolean(currentUserId && authorId && currentUserId.toString() === authorId.toString());
  const canModify = isAuthor || isAdmin;

  const childReplies = repliesMap[comment._id || comment.id] || [];

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onReply(comment._id || comment.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
    } catch (err) {
      setError(err.message || 'Failed to submit reply');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onEdit(comment._id || comment.id, editText.trim());
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to save edits');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const hasReplies = childReplies.length > 0;
    const confirmMsg = hasReplies
      ? 'Deleting this comment will permanently remove it AND all of its replies. Proceed?'
      : 'Are you sure you want to delete this comment?';

    if (window.confirm(confirmMsg)) {
      setLoading(true);
      try {
        await onDelete(comment._id || comment.id);
      } catch (err) {
        alert(err.message || 'Failed to delete comment');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="comment-node" id={`comment-${comment._id || comment.id}`}>
      <div className="comment-card">
        {/* Comment Header */}
        <div className="comment-header">
          <div className="comment-author-info flex-wrap">
            <div className="avatar avatar-sm">
              {comment.author?.initials || comment.author?.username?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <span className="comment-username">{comment.author?.username || 'Reader'}</span>
            {comment.author?.role === 'admin' && (
              <span className="badge badge-admin">Admin</span>
            )}
            <span className="comment-timestamp">
              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>

            {/* Editorial Transparency Badges */}
            {comment.editedBy === 'admin' && (
              <span className="comment-admin-edited-label" title="This content was edited by an administrator">
                (edited by Admin)
              </span>
            )}
            {comment.editedBy === 'author' && (
              <span className="comment-edited-label" title="Edited by author">
                (edited)
              </span>
            )}
          </div>
        </div>

        {/* Comment Body / Inline Edit Mode */}
        {isEditing ? (
          <form onSubmit={handleEditSubmit} style={{ marginTop: '0.5rem' }}>
            <textarea
              className="form-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              style={{ minHeight: '80px', marginBottom: '0.5rem' }}
              disabled={loading}
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
            <div className="flex items-center gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                <Check size={14} /> Save
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.content);
                }}
                disabled={loading}
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="comment-body">{comment.content}</div>
        )}

        {/* Comment Action Buttons */}
        <div className="comment-actions flex-wrap">
          {user ? (
            <button
              type="button"
              className="comment-action-btn"
              onClick={() => setIsReplying(!isReplying)}
              title="Reply to this comment"
            >
              <CornerDownRight size={13} />
              <span>Reply</span>
            </button>
          ) : (
            <span
              className="comment-action-btn text-muted"
              style={{ cursor: 'not-allowed', opacity: 0.6 }}
              title="Log in to reply"
            >
              <CornerDownRight size={13} />
              <span>Log in to reply</span>
            </span>
          )}

          {canModify && !isEditing && (
            <>
              <button
                type="button"
                className="comment-action-btn"
                onClick={() => setIsEditing(true)}
                title="Edit this comment"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                className="comment-action-btn delete"
                onClick={handleDelete}
                disabled={loading}
                title="Delete comment and all replies"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>

        {/* Reply Submission Form */}
        {isReplying && (
          <form onSubmit={handleReplySubmit} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <textarea
              className="form-textarea"
              placeholder={`Replying to ${comment.author?.username || 'this comment'}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              style={{ minHeight: '70px', marginBottom: '0.5rem' }}
              disabled={loading}
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
            <div className="flex items-center gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !replyText.trim()}>
                Post Reply
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setIsReplying(false);
                  setReplyText('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recursive Multi-Level Nested Replies */}
      {childReplies.length > 0 && (
        <div className="reply-tree-branch">
          {childReplies.map((reply) => (
            <CommentItem
              key={reply._id || reply.id}
              comment={reply}
              repliesMap={repliesMap}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CommentTree = ({ comments, onReply, onEdit, onDelete }) => {
  // Construct tree map: top-level (parentId === null) and children keyed by parentId
  const rootComments = [];
  const repliesMap = {};

  comments.forEach((c) => {
    const parentId = c.parentId ? (c.parentId._id || c.parentId).toString() : null;
    if (!parentId) {
      rootComments.push(c);
    } else {
      if (!repliesMap[parentId]) {
        repliesMap[parentId] = [];
      }
      repliesMap[parentId].push(c);
    }
  });

  if (rootComments.length === 0) {
    return (
      <div className="comment-tree" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
        <MessageSquare size={36} style={{ margin: '0 auto 1rem auto', opacity: 0.4 }} />
        <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>No comments yet</h4>
        <p className="text-sm">Be the first to share your thoughts and start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="comment-tree">
      {rootComments.map((rootComment) => (
        <CommentItem
          key={rootComment._id || rootComment.id}
          comment={rootComment}
          repliesMap={repliesMap}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CommentTree;
