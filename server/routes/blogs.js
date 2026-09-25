const express = require('express');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Notification = require('../models/Notification');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { PREDEFINED_CATEGORIES } = require('../models/Blog');

const router = express.Router();

// @route   GET /api/blogs/categories
// @desc    Get predefined categories list
// @access  Public
router.get('/categories', (req, res) => {
  return res.status(200).json({
    success: true,
    categories: PREDEFINED_CATEGORIES
  });
});

// @route   GET /api/blogs
// @desc    Get published blogs with search, category/tag filter, and pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 6));
    const skip = (page - 1) * limit;

    const { search, category, tag } = req.query;

    const filter = { status: 'published' };

    // Category filter
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Tag filter
    if (tag) {
      filter.tags = tag.replace(/^#/, '').toLowerCase();
    }

    // Keyword search on title, content, or tags
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex }
      ];
    }

    const total = await Blog.countDocuments(filter);
    const rawBlogs = await Blog.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich with like counts and comment counts
    const blogIds = rawBlogs.map((b) => b._id);
    const [likesAgg, commentsAgg] = await Promise.all([
      Like.aggregate([
        { $match: { blogId: { $in: blogIds } } },
        { $group: { _id: '$blogId', count: { $sum: 1 } } }
      ]),
      Comment.aggregate([
        { $match: { blogId: { $in: blogIds } } },
        { $group: { _id: '$blogId', count: { $sum: 1 } } }
      ])
    ]);

    const likesMap = new Map(likesAgg.map((l) => [l._id.toString(), l.count]));
    const commentsMap = new Map(commentsAgg.map((c) => [c._id.toString(), c.count]));

    const blogs = rawBlogs.map((b) => ({
      ...b,
      id: b._id,
      likeCount: likesMap.get(b._id.toString()) || 0,
      commentCount: commentsMap.get(b._id.toString()) || 0
    }));

    return res.status(200).json({
      success: true,
      blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      },
      categories: PREDEFINED_CATEGORIES
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs.'
    });
  }
});

// @route   GET /api/blogs/admin/all
// @desc    Get all blogs (drafts + published) for Admin management
// @access  Admin Only
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const rawBlogs = await Blog.find().sort({ createdAt: -1 }).lean();

    const blogIds = rawBlogs.map((b) => b._id);
    const [likesAgg, commentsAgg] = await Promise.all([
      Like.aggregate([
        { $match: { blogId: { $in: blogIds } } },
        { $group: { _id: '$blogId', count: { $sum: 1 } } }
      ]),
      Comment.aggregate([
        { $match: { blogId: { $in: blogIds } } },
        { $group: { _id: '$blogId', count: { $sum: 1 } } }
      ])
    ]);

    const likesMap = new Map(likesAgg.map((l) => [l._id.toString(), l.count]));
    const commentsMap = new Map(commentsAgg.map((c) => [c._id.toString(), c.count]));

    const blogs = rawBlogs.map((b) => ({
      ...b,
      id: b._id,
      likeCount: likesMap.get(b._id.toString()) || 0,
      commentCount: commentsMap.get(b._id.toString()) || 0
    }));

    return res.status(200).json({
      success: true,
      blogs
    });
  } catch (error) {
    console.error('Admin fetch blogs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admin blogs.'
    });
  }
});

// @route   GET /api/blogs/:id
// @desc    Get individual blog details
// @access  Public (Strict 404 for draft/unpublished if non-admin)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    // Strict 404 for drafts/unpublished if not Admin or the author
    if (blog.status !== 'published') {
      const isOwner = req.user && ((blog.authorId && blog.authorId.equals(req.user._id)) || blog.authorName === req.user.username);
      if (!req.user || (req.user.role !== 'admin' && !isOwner)) {
        return res.status(404).json({
          success: false,
          message: 'Article not found.'
        });
      }
    }

    const [likeCount, commentCount, userLike] = await Promise.all([
      Like.countDocuments({ blogId: blog._id }),
      Comment.countDocuments({ blogId: blog._id }),
      req.user ? Like.findOne({ blogId: blog._id, userId: req.user._id }) : null
    ]);

    return res.status(200).json({
      success: true,
      blog: {
        ...blog.toJSON(),
        likeCount,
        commentCount,
        userHasLiked: !!userLike
      }
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }
    console.error('Error fetching blog detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch article.'
    });
  }
});

// @route   GET /api/blogs/me/stories
// @desc    Get articles authored by the current logged-in user
// @access  Authenticated (Reader or Admin)
router.get('/me/stories', authenticate, async (req, res) => {
  try {
    const rawBlogs = await Blog.find({
      $or: [
        { authorId: req.user._id },
        { authorName: req.user.username }
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    const blogIds = rawBlogs.map((b) => b._id);
    const [likesAgg, commentsAgg] = await Promise.all([
      Like.aggregate([
        { $match: { blogId: { $in: blogIds } } },
        { $group: { _id: '$blogId', count: { $sum: 1 } } }
      ]),
      Comment.aggregate([
        { $match: { blogId: { $in: blogIds } } },
        { $group: { _id: '$blogId', count: { $sum: 1 } } }
      ])
    ]);

    const likesMap = new Map(likesAgg.map((l) => [l._id.toString(), l.count]));
    const commentsMap = new Map(commentsAgg.map((c) => [c._id.toString(), c.count]));

    const blogs = rawBlogs.map((b) => ({
      ...b,
      id: b._id,
      likeCount: likesMap.get(b._id.toString()) || 0,
      commentCount: commentsMap.get(b._id.toString()) || 0
    }));

    return res.status(200).json({
      success: true,
      blogs
    });
  } catch (error) {
    console.error('Error fetching reader stories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your articles.'
    });
  }
});

// @route   POST /api/blogs
// @desc    Create a new blog article (Admin or Reader)
// @access  Authenticated
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, authorName, category, tags, coverImage, status } = req.body;

    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required.'
      });
    }

    const authorNameFinal = req.user.role === 'admin'
      ? (authorName && authorName.trim() ? authorName.trim() : (req.user.username || 'Admin'))
      : req.user.username;

    const authorRole = req.user.role === 'admin' ? 'admin' : 'reader';
    const blogStatus = status === 'published' ? 'published' : 'draft';

    const blog = await Blog.create({
      title: title.trim(),
      content: content.trim(),
      authorName: authorNameFinal,
      authorId: req.user._id,
      authorRole,
      category: category || 'General',
      tags: tags || [],
      coverImage: coverImage ? coverImage.trim() : '',
      status: blogStatus,
      publishedAt: blogStatus === 'published' ? new Date() : null
    });

    return res.status(201).json({
      success: true,
      message: `Article saved successfully as ${blogStatus}!`,
      blog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create blog article.'
    });
  }
});

// @route   PUT /api/blogs/:id
// @desc    Update an existing blog article (Admin or Owner)
// @access  Authenticated
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, content, authorName, category, tags, coverImage, status } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    const isOwner = (blog.authorId && blog.authorId.equals(req.user._id)) || (blog.authorName === req.user.username);
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only edit your own articles.'
      });
    }

    if (title) blog.title = title.trim();
    if (content) blog.content = content.trim();
    if (authorName && req.user.role === 'admin') blog.authorName = authorName.trim();
    if (category) blog.category = category;
    if (tags !== undefined) blog.tags = tags;
    if (coverImage !== undefined) blog.coverImage = coverImage.trim();

    if (status && status !== blog.status) {
      blog.status = status;
      if (status === 'published' && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
    }

    await blog.save();

    return res.status(200).json({
      success: true,
      message: 'Article updated successfully.',
      blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update blog.'
    });
  }
});

// @route   PATCH /api/blogs/:id/publish
// @desc    Toggle blog publication status (Publish / Unpublish)
// @access  Admin or Owner
router.patch('/:id/publish', authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    const isOwner = (blog.authorId && blog.authorId.equals(req.user._id)) || (blog.authorName === req.user.username);
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only manage publication of your own articles.'
      });
    }

    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    blog.status = newStatus;
    if (newStatus === 'published' && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    await blog.save();

    return res.status(200).json({
      success: true,
      message: `Article has been ${newStatus === 'published' ? 'published' : 'unpublished'}!`,
      status: blog.status,
      blog
    });
  } catch (error) {
    console.error('Error toggling publication status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update publication status.'
    });
  }
});

// @route   DELETE /api/blogs/:id
// @desc    Permanently delete blog post and cascade-delete all comments, replies, and likes
// @access  Admin or Owner
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    const isOwner = (blog.authorId && blog.authorId.equals(req.user._id)) || (blog.authorName === req.user.username);
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized. You can only delete your own articles.'
      });
    }

    // Permanent hard cascade delete
    await Promise.all([
      Comment.deleteMany({ blogId: blog._id }),
      Like.deleteMany({ blogId: blog._id }),
      Notification.deleteMany({ blogId: blog._id }),
      Blog.findByIdAndDelete(blog._id)
    ]);

    return res.status(200).json({
      success: true,
      message: 'Article and all associated discussions have been permanently purged.'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete article.'
    });
  }
});

module.exports = router;
