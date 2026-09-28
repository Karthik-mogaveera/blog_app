const express = require('express');
const User = require('../models/User');
const Blog = require('../models/Blog');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Notification = require('../models/Notification');
const SavedBlog = require('../models/SavedBlog');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get currently authenticated user's profile details
// @access  Authenticated (Private)
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash -resetOtp');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.'
    });
  }
});

// @route   PATCH /api/users/profile
// @desc    Update authenticated user profile (photo, bio, social links)
// @access  Authenticated (Private)
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { bio, profilePicture, socialLinks } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Validate and update bio
    if (bio !== undefined) {
      if (typeof bio === 'string' && bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Bio cannot exceed 500 characters.'
        });
      }
      user.bio = typeof bio === 'string' ? bio.trim() : '';
    }

    // Update profilePicture (can be base64 data string or image URL)
    if (profilePicture !== undefined) {
      const cleanPic = profilePicture ? profilePicture.trim() : '';
      user.profilePicture = cleanPic;
      user.avatar = cleanPic;
    }

    // Update social / portfolio links
    if (socialLinks !== undefined && typeof socialLinks === 'object' && socialLinks !== null) {
      user.socialLinks = {
        website: socialLinks.website !== undefined ? String(socialLinks.website).trim() : (user.socialLinks?.website || ''),
        twitter: socialLinks.twitter !== undefined ? String(socialLinks.twitter).trim() : (user.socialLinks?.twitter || ''),
        github: socialLinks.github !== undefined ? String(socialLinks.github).trim() : (user.socialLinks?.github || ''),
        linkedin: socialLinks.linkedin !== undefined ? String(socialLinks.linkedin).trim() : (user.socialLinks?.linkedin || '')
      };
    }

    await user.save();

    // Fetch updated user with virtuals serialized
    const updatedUser = await User.findById(user._id).select('-passwordHash -resetOtp');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error updating profile.'
    });
  }
});

// ============================================================================
// PUBLIC READER DISCOVERY & AUTHOR PROFILE ENDPOINTS
// ============================================================================

// @route   GET /api/users/search
// @desc    Search active readers/authors by username or bio for discovery
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    // Filter: active users only (exclude suspended), sensitive fields stripped
    const filter = {
      status: { $ne: 'suspended' }
    };

    if (q) {
      const regex = new RegExp(q, 'i');
      filter.$or = [{ username: regex }, { bio: regex }];
    }

    const total = await User.countDocuments(filter);
    const rawUsers = await User.find(filter)
      .select('username avatar profilePicture bio socialLinks role createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = rawUsers.map((u) => u._id);

    // Compute total published articles for each discovered author
    const publishedBlogsAgg = await Blog.aggregate([
      {
        $match: {
          authorId: { $in: userIds },
          status: 'published'
        }
      },
      {
        $group: {
          _id: '$authorId',
          count: { $sum: 1 }
        }
      }
    ]);

    const publishedMap = new Map(publishedBlogsAgg.map((item) => [item._id.toString(), item.count]));

    const authors = rawUsers.map((u) => {
      const initials = u.username ? u.username.slice(0, 2).toUpperCase() : '??';
      const picture = u.profilePicture || u.avatar || '';
      return {
        _id: u._id,
        id: u._id,
        username: u.username,
        bio: u.bio || '',
        avatar: picture,
        profilePicture: picture,
        initials,
        role: u.role || 'reader',
        socialLinks: u.socialLinks || {},
        createdAt: u.createdAt,
        publishedArticlesCount: publishedMap.get(u._id.toString()) || 0
      };
    });

    return res.status(200).json({
      success: true,
      authors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error searching reader authors:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search authors.'
    });
  }
});

// @route   GET /api/users/:id/public
// @desc    Get public reader profile metadata & strictly their published articles
// @access  Public
router.get('/:id/public', async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;

    // Check if valid ObjectId or query by username as fallback
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isValidObjectId) {
      user = await User.findById(id).select('username avatar profilePicture bio socialLinks role status createdAt').lean();
    }
    if (!user) {
      user = await User.findOne({ username: id }).select('username avatar profilePicture bio socialLinks role status createdAt').lean();
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Author profile not found.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(404).json({
        success: false,
        message: 'This author profile is not available.'
      });
    }

    // Fetch strictly published blogs authored by this user (drafts strictly excluded)
    const rawBlogs = await Blog.find({
      $or: [{ authorId: user._id }, { authorName: user.username }],
      status: 'published'
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    const blogIds = rawBlogs.map((b) => b._id);

    // Enrich with likes and comments metrics
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

    const publishedBlogs = rawBlogs.map((b) => ({
      ...b,
      id: b._id,
      likeCount: likesMap.get(b._id.toString()) || 0,
      commentCount: commentsMap.get(b._id.toString()) || 0
    }));

    const initials = user.username ? user.username.slice(0, 2).toUpperCase() : '??';
    const picture = user.profilePicture || user.avatar || '';

    return res.status(200).json({
      success: true,
      author: {
        _id: user._id,
        id: user._id,
        username: user.username,
        bio: user.bio || '',
        avatar: picture,
        profilePicture: picture,
        initials,
        role: user.role || 'reader',
        socialLinks: user.socialLinks || {},
        createdAt: user.createdAt,
        totalArticles: publishedBlogs.length
      },
      blogs: publishedBlogs
    });
  } catch (error) {
    console.error('Error fetching public author profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch author profile.'
    });
  }
});

// ============================================================================
// ADMIN USER MODERATION & MANAGEMENT ENDPOINTS
// ============================================================================

// @route   GET /api/users/admin/all
// @desc    Get all users with activity counts (blogs, comments) & filters
// @access  Admin Only
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { search, status, role } = req.query;

    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ username: regex }, { email: regex }];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    const total = await User.countDocuments(filter);
    const rawUsers = await User.find(filter)
      .select('-passwordHash -resetOtp')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = rawUsers.map((u) => u._id);

    // Aggregate activity counts (authored blogs & authored comments)
    const [blogsAgg, commentsAgg] = await Promise.all([
      Blog.aggregate([
        { $match: { authorId: { $in: userIds } } },
        { $group: { _id: '$authorId', count: { $sum: 1 } } }
      ]),
      Comment.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ])
    ]);

    const blogsMap = new Map(blogsAgg.map((b) => [b._id.toString(), b.count]));
    const commentsMap = new Map(commentsAgg.map((c) => [c._id.toString(), c.count]));

    const users = rawUsers.map((u) => ({
      ...u,
      id: u._id,
      status: u.status || 'active',
      blogsCount: blogsMap.get(u._id.toString()) || 0,
      commentsCount: commentsMap.get(u._id.toString()) || 0
    }));

    // High-level system statistics
    const [totalUsers, activeUsers, suspendedUsers, totalReaders] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ status: { $ne: 'suspended' } }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: 'reader' })
    ]);

    return res.status(200).json({
      success: true,
      users,
      stats: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalReaders
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin users list:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user directory.'
    });
  }
});

// @route   PATCH /api/users/admin/:id/status
// @desc    Suspend or Re-activate a reader user account
// @access  Admin Only
router.patch('/admin/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Safety guard: Administrators cannot suspend their own active account
    if (req.user._id.equals(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot suspend their own active account.'
      });
    }

    const { status } = req.body;
    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'suspended'."
      });
    }

    targetUser.status = status;
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: `User @${targetUser.username} has been successfully ${status === 'suspended' ? 'suspended' : 're-activated'}.`,
      user: {
        _id: targetUser._id,
        id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating user status.'
    });
  }
});

// @route   DELETE /api/users/admin/:id
// @desc    Permanently delete reader user and safely cascade remove all associated content
// @access  Admin Only
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    // Safety guard: Administrators cannot delete their own active account
    if (req.user._id.equals(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'Administrators cannot delete their own active account.'
      });
    }

    // Safety guard: Admin accounts cannot be deleted through reader moderation controls
    if (targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrator accounts cannot be deleted through reader moderation controls.'
      });
    }

    // Safe handling: Collect authored blog IDs to cascade-delete discussions
    const userBlogs = await Blog.find({ authorId: targetUser._id }).select('_id');
    const blogIds = userBlogs.map((b) => b._id);

    await Promise.all([
      // 1. Comments on user's blogs + comments authored by user on any blog
      Comment.deleteMany({ $or: [{ blogId: { $in: blogIds } }, { userId: targetUser._id }] }),
      // 2. Likes on user's blogs + likes given by user
      Like.deleteMany({ $or: [{ blogId: { $in: blogIds } }, { userId: targetUser._id }] }),
      // 3. Notifications involving the user or user's blogs
      Notification.deleteMany({
        $or: [
          { userId: targetUser._id },
          { actorId: targetUser._id },
          { blogId: { $in: blogIds } }
        ]
      }),
      // 4. Saved blogs referencing user or user's blogs
      SavedBlog.deleteMany({ $or: [{ userId: targetUser._id }, { blogId: { $in: blogIds } }] }),
      // 5. Authored blogs
      Blog.deleteMany({ authorId: targetUser._id }),
      // 6. Delete user account record
      User.findByIdAndDelete(targetUser._id)
    ]);

    return res.status(200).json({
      success: true,
      message: `User @${targetUser.username} and all authored articles and discussions have been safely removed.`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting user.'
    });
  }
});

module.exports = router;
