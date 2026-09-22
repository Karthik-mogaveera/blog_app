const express = require('express');
const Like = require('../models/Like');
const Blog = require('../models/Blog');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/likes/toggle
// @desc    Toggle like / unlike on a blog post
// @access  Registered Readers & Admin
router.post('/toggle', authenticate, async (req, res) => {
  try {
    const { blogId } = req.body;
    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: 'Blog ID is required.'
      });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog article not found.'
      });
    }

    if (blog.status !== 'published' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot interact with an unpublished article.'
      });
    }

    const existingLike = await Like.findOne({
      blogId: blog._id,
      userId: req.user._id
    });

    let userHasLiked = false;

    if (existingLike) {
      // Unlike: remove like record
      await Like.findByIdAndDelete(existingLike._id);
      userHasLiked = false;
    } else {
      // Like: create like record (unique compound index prevents race condition duplicates)
      try {
        await Like.create({
          blogId: blog._id,
          userId: req.user._id
        });
        userHasLiked = true;
      } catch (err) {
        if (err.code === 11000) {
          // Duplicate key collision
          userHasLiked = true;
        } else {
          throw err;
        }
      }
    }

    const likeCount = await Like.countDocuments({ blogId: blog._id });

    return res.status(200).json({
      success: true,
      userHasLiked,
      likeCount,
      message: userHasLiked ? 'Article liked!' : 'Like removed.'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update like status.'
    });
  }
});

// @route   GET /api/likes/blog/:blogId
// @desc    Get like count and personal like state for a blog post
// @access  Public
router.get('/blog/:blogId', optionalAuth, async (req, res) => {
  try {
    const [likeCount, userLike] = await Promise.all([
      Like.countDocuments({ blogId: req.params.blogId }),
      req.user ? Like.findOne({ blogId: req.params.blogId, userId: req.user._id }) : null
    ]);

    return res.status(200).json({
      success: true,
      likeCount,
      userHasLiked: !!userLike
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch like details.'
    });
  }
});

module.exports = router;
