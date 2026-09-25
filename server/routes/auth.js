const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/mailer');

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

// @route   POST /api/auth/google
// @desc    Authenticate or register a reader using Google account
// @access  Public
router.post('/google', async (req, res) => {
  try {
    let { googleId, email, name, avatar, accessToken, credential } = req.body;

    // Verify real Google OAuth Access Token if provided
    if (accessToken) {
      try {
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const googleUser = await googleRes.json();
        if (googleUser && (googleUser.sub || googleUser.id)) {
          googleId = googleUser.sub || googleUser.id;
          email = googleUser.email;
          name = googleUser.name || `${googleUser.given_name || ''} ${googleUser.family_name || ''}`.trim();
          avatar = googleUser.picture;
        } else {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired Google OAuth access token.'
          });
        }
      } catch (tokenErr) {
        console.error('Google access token verification failed:', tokenErr);
        return res.status(401).json({
          success: false,
          message: 'Failed to verify Google access token with Google services.'
        });
      }
    } else if (credential) {
      // Verify real Google ID Token if provided
      try {
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        const googleUser = await googleRes.json();
        if (googleUser && googleUser.sub) {
          googleId = googleUser.sub;
          email = googleUser.email;
          name = googleUser.name;
          avatar = googleUser.picture;
        } else {
          return res.status(401).json({
            success: false,
            message: 'Invalid or expired Google credential token.'
          });
        }
      } catch (tokenErr) {
        console.error('Google ID token verification failed:', tokenErr);
        return res.status(401).json({
          success: false,
          message: 'Failed to verify Google ID token with Google services.'
        });
      }
    }

    if (!email && !googleId) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication requires email or Google ID.'
      });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (cleanEmail && !emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address provided by Google account.'
      });
    }

    // 1. Look up user by googleId or email
    const queryConditions = [];
    if (googleId) queryConditions.push({ googleId });
    if (cleanEmail) queryConditions.push({ email: cleanEmail });

    let user = await User.findOne({ $or: queryConditions });

    if (user) {
      // If user exists, link googleId and avatar if not present
      let updated = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (updated) {
        await user.save();
      }

      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.username}!`,
        token,
        user
      });
    }

    // 2. New user registration
    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required to register a new Google account.'
      });
    }

    // Determine initial candidate username
    let baseUsername = '';
    if (name && name.trim()) {
      baseUsername = name.trim().replace(/[^a-zA-Z0-9_]/g, '');
    }
    if (!baseUsername || baseUsername.length < 3) {
      baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
    }
    if (!baseUsername || baseUsername.length < 3) {
      baseUsername = 'reader_' + Math.floor(1000 + Math.random() * 9000);
    }
    baseUsername = baseUsername.slice(0, 20);

    // Ensure username uniqueness
    let candidateUsername = baseUsername;
    let suffix = 1;
    while (await User.findOne({ username: candidateUsername })) {
      candidateUsername = `${baseUsername.slice(0, 16)}_${suffix++}`;
    }

    user = await User.create({
      username: candidateUsername,
      email: cleanEmail,
      googleId: googleId || `google_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      avatar: avatar || null,
      role: 'reader'
    });

    const token = generateToken(user);
    return res.status(201).json({
      success: true,
      message: 'Google registration successful. Welcome to the platform!',
      token,
      user
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Google authentication. Please try again later.'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request a 6-digit OTP for password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered email address.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.'
      });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetOtp = otp;
    user.resetOtpExpires = expiresAt;
    user.resetOtpVerified = false;
    await user.save();

    console.log(`[PASSWORD RESET OTP] Generated for ${cleanEmail}: ${otp} (expires ${expiresAt.toISOString()})`);

    // Dispatch email via Nodemailer
    await sendOtpEmail({
      to: cleanEmail,
      otp,
      username: user.username
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing password reset. Please try again later.'
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify the received 6-digit OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP verification code are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.'
      });
    }

    if (!user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'No active OTP found. Please request a new verification code.'
      });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.'
      });
    }

    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }

    user.resetOtpVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You may now set a new password.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error verifying OTP. Please try again later.'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password after successful OTP verification
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.'
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (!user.resetOtpVerified || user.resetOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be verified before resetting password.'
      });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpVerified = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error resetting password. Please try again later.'
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
