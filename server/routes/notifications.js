const express = require('express');
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get all notifications and unread count for current user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .populate('actorId', 'username role')
        .populate('blogId', 'title')
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    const formatted = notifications.map((n) => ({
      ...n,
      id: n._id,
      actorName: n.actorId ? n.actorId.username : 'Someone',
      blogTitle: n.blogId ? n.blogId.title : 'Article'
    }));

    return res.status(200).json({
      success: true,
      notifications: formatted,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load notifications.'
    });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a specific notification as read
// @access  Private
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.'
      });
    }

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.'
    });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications for the current user as read
// @access  Private
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
      unreadCount: 0
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read.'
    });
  }
});

module.exports = router;
