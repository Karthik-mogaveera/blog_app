const express = require('express');
const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Helper: Recursively collect all descendant comment IDs for cascade deletion
const getDescendantCommentIds = async (commentId) => {
  const idsToDelete = [commentId];
  const queue = [commentId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await Comment.find({ parentId: currentId }).select('_id');
    for (const child of children) {
      idsToDelete.push(child._id);
      queue.push(child._id);
    }
  }

  return idsToDelete;
};

// @route   GET /api/comments/blog/:blogId
// @desc    Get all comments and nested replies for a specific blog
// @access  Public
router.get('/blog/:blogId', async (req, res) => {
  try {
    const comments = await Comment.find({ blogId: req.params.blogId })
      .populate('userId', 'username role')
      .sort({ createdAt: 1 })
      .lean();

    const formattedComments = comments.map((c) => ({
      ...c,
      id: c._id,
      author: c.userId
        ? {
            id: c.userId._id,
            username: c.userId.username,
            role: c.userId.role,
            initials: c.userId.username
              ? c.userId.username.slice(0, 2).toUpperCase()
              : 'U'
          }
        : { username: 'Deleted User', role: 'reader', initials: '?' }
    }));

    return res.status(200).json({
      success: true,
      comments: formattedComments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load comments.'
    });
  }
});

// @route   POST /api/comments
// @desc    Post a top-level comment or nested reply
// @access  Registered Readers & Admin
router.post('/', authenticate, async (req, res) => {
  try {
    const { blogId, parentId, content } = req.body;

    if (!blogId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.'
      });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog article not found.'
      });
    }

    // Unregistered / draft check
    if (blog.status !== 'published' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot comment on an unpublished article.'
      });
    }

    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findById(parentId);
      if (!parentComment || !parentComment.blogId.equals(blog._id)) {
        return res.status(404).json({
          success: false,
          message: 'The comment you are attempting to reply to no longer exists.'
        });
      }
    }

    const newComment = await Comment.create({
      blogId: blog._id,
      userId: req.user._id,
      parentId: parentId || null,
      content: content.trim()
    });

    const populatedComment = await Comment.findById(newComment._id)
      .populate('userId', 'username role')
      .lean();

    // Trigger Notifications
    if (!parentId) {
      // Top-level comment -> Notify Admin
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser && !adminUser._id.equals(req.user._id)) {
        await Notification.create({
          userId: adminUser._id,
          actorId: req.user._id,
          blogId: blog._id,
          commentId: newComment._id,
          type: 'new_comment',
          message: `${req.user.username} posted a new comment on "${blog.title}".`
        });
      }
    } else if (parentComment) {
      // Nested reply -> Notify parent comment's author
      if (!parentComment.userId.equals(req.user._id)) {
        await Notification.create({
          userId: parentComment.userId,
          actorId: req.user._id,
          blogId: blog._id,
          commentId: newComment._id,
          type: 'reply',
          message: `${req.user.username} replied to your comment on "${blog.title}".`
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      comment: {
        ...populatedComment,
        id: populatedComment._id,
        author: {
          id: req.user._id,
          username: req.user.username,
          role: req.user.role,
          initials: req.user.username.slice(0, 2).toUpperCase()
        }
      }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to post comment.'
    });
  }
});

// @route   PUT /api/comments/:id
// @desc    Edit comment/reply (Author or Admin only)
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.'
      });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    const isAuthor = comment.userId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this comment.'
      });
    }

    comment.content = content.trim();

    // Set transparency badge
    if (isAdmin && !isAuthor) {
      comment.editedBy = 'admin';
    } else {
      comment.editedBy = 'author';
    }

    await comment.save();

    const updated = await Comment.findById(comment._id)
      .populate('userId', 'username role')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      comment: {
        ...updated,
        id: updated._id,
        author: {
          id: updated.userId._id,
          username: updated.userId.username,
          role: updated.userId.role,
          initials: updated.userId.username.slice(0, 2).toUpperCase()
        }
      }
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update comment.'
    });
  }
});

// @route   DELETE /api/comments/:id
// @desc    Cascade-delete a comment and all of its nested replies
// @access  Author or Admin Only
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.'
      });
    }

    const isAuthor = comment.userId.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment.'
      });
    }

    // Cascade deletion of the entire subtree
    const allIdsToDelete = await getDescendantCommentIds(comment._id);

    await Promise.all([
      Comment.deleteMany({ _id: { $in: allIdsToDelete } }),
      Notification.deleteMany({ commentId: { $in: allIdsToDelete } })
    ]);

    return res.status(200).json({
      success: true,
      message: 'Comment and all subordinate replies were deleted.',
      deletedCount: allIdsToDelete.length,
      deletedIds: allIdsToDelete
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete comment.'
    });
  }
});

// @route   GET /api/comments/admin/all
// @desc    Admin view of all comments for moderation
// @access  Admin Only
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('userId', 'username email role')
      .populate('blogId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      comments: comments.map((c) => ({
        ...c,
        id: c._id,
        blogTitle: c.blogId ? c.blogId.title : 'Deleted Blog'
      }))
    });
  } catch (error) {
    console.error('Error fetching admin comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load moderation comments.'
    });
  }
});

module.exports = router;
