const express = require('express');
const SavedBlog = require('../models/SavedBlog');
const Blog = require('../models/Blog');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/saved/toggle
// @desc    Toggle saving / bookmarking an article
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
        message: 'Cannot save an unpublished article.'
      });
    }

    const existingSave = await SavedBlog.findOne({
      blogId: blog._id,
      userId: req.user._id
    });

    let isSaved = false;

    if (existingSave) {
      // Unsave: remove record
      await SavedBlog.findByIdAndDelete(existingSave._id);
      isSaved = false;
      return res.status(200).json({
        success: true,
        isSaved: false,
        message: 'Article removed from saved items.'
      });
    } else {
      // Save: create record (unique compound index prevents duplicate saves)
      try {
        await SavedBlog.create({
          blogId: blog._id,
          userId: req.user._id
        });
        isSaved = true;
      } catch (err) {
        if (err.code === 11000) {
          // Compound index unique violation: already saved
          isSaved = true;
        } else {
          throw err;
        }
      }

      return res.status(200).json({
        success: true,
        isSaved: true,
        message: 'Article saved successfully.'
      });
    }
  } catch (error) {
    console.error('Error toggling save:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update saved status.'
    });
  }
});

// @route   GET /api/saved
// @desc    Get all saved articles for the authenticated reader
// @access  Registered Readers & Admin
router.get('/', authenticate, async (req, res) => {
  try {
    const savedRecords = await SavedBlog.find({ userId: req.user._id })
      .populate('blogId')
      .sort({ createdAt: -1 })
      .lean();

    // Filter out null or unpublished blogs (unless admin)
    const validSavedBlogs = savedRecords
      .filter((rec) => {
        if (!rec.blogId) return false;
        if (rec.blogId.status !== 'published' && req.user.role !== 'admin') {
          return false;
        }
        return true;
      })
      .map((rec) => ({
        savedId: rec._id,
        savedAt: rec.createdAt,
        blog: rec.blogId
      }));

    return res.status(200).json({
      success: true,
      savedBlogs: validSavedBlogs
    });
  } catch (error) {
    console.error('Error fetching saved articles:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved articles.'
    });
  }
});

// @route   DELETE /api/saved/:blogId
// @desc    Remove an article from saved list
// @access  Registered Readers & Admin
router.delete('/:blogId', authenticate, async (req, res) => {
  try {
    const { blogId } = req.params;
    await SavedBlog.findOneAndDelete({
      blogId,
      userId: req.user._id
    });

    return res.status(200).json({
      success: true,
      message: 'Article removed from saved items.'
    });
  } catch (error) {
    console.error('Error removing saved article:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove saved article.'
    });
  }
});

module.exports = router;
