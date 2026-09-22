const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new reader
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are all required.'
      });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters long.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { username: username.trim() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.trim().toLowerCase()) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create reader
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'reader'
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Welcome to the platform!',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration. Please try again later.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Log in an existing reader or Admin
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required.'
      });
    }

    const cleanIdentifier = identifier.trim();

    // Find by either email or username
    const user = await User.findOne({
      $or: [
        { email: cleanIdentifier.toLowerCase() },
        { username: cleanIdentifier }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username/email and password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your username/email and password.'
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login. Please try again later.'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get currently authenticated user details
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
});

module.exports = router;
