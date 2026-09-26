const express = require('express');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

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

module.exports = router;
