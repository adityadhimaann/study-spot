const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create salt & hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // Create token
    const token = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        department: savedUser.department,
        year: savedUser.year,
        studentId: savedUser.studentId,
      },
      message: 'User registered successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for existing user by email or studentId
    const user = await User.findOne({
      $or: [{ email: email }, { studentId: email }]
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User not found.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        studentId: user.studentId,
      },
      message: 'Logged in successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, department, year, studentId } = req.body;
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (name) user.name = name;
    if (department) user.department = department;
    if (year) user.year = year;
    if (studentId) user.studentId = studentId;
    if (req.body.profilePicture !== undefined) user.profilePicture = req.body.profilePicture;
    
    await user.save();
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      year: user.year,
      studentId: user.studentId
    });
  } catch(err) {
    res.status(500).json({ message: 'Server error' });
  }
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   POST /api/auth/google
// @desc    Login/Register with Google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required' });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      user = new User({
        name,
        email,
        googleId,
        password: await bcrypt.hash(Math.random().toString(36), 10), // Random password for social users
        role: 'student',
        profilePicture: picture,
      });
      await user.save();
    } else if (!user.googleId) {
      // Link google account to existing email user
      user.googleId = googleId;
      if (!user.profilePicture) user.profilePicture = picture;
      await user.save();
    }

    // Create token
    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        studentId: user.studentId,
        profilePicture: user.profilePicture,
      },
      message: 'Google login successful',
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google authentication' });
  }
});

// @route   GET /api/auth/focus-stats
// @desc    Retrieve user study focus statistics
// @access  Private
router.get('/focus-stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Ensure default map is initialized if missing
    if (!user.weeklyFocusLogs || user.weeklyFocusLogs.size === 0) {
      user.weeklyFocusLogs = { Mon: 45, Tue: 90, Wed: 30, Thu: 120, Fri: 60, Sat: 25, Sun: 0 };
      await user.save();
    }
    
    res.json({
      focusCycles: user.focusCycles || 0,
      focusMinutes: user.focusMinutes || 0,
      weeklyFocusLogs: Object.fromEntries(user.weeklyFocusLogs)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/focus-stats
// @desc    Update/log a completed focus session
// @access  Private
router.post('/focus-stats', auth, async (req, res) => {
  try {
    const { minutes } = req.body;
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.focusCycles = (user.focusCycles || 0) + 1;
    user.focusMinutes = (user.focusMinutes || 0) + (minutes || 25);

    // Update daily logs map
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = days[new Date().getDay()];
    
    if (!user.weeklyFocusLogs || user.weeklyFocusLogs.size === 0) {
      user.weeklyFocusLogs = { Mon: 45, Tue: 90, Wed: 30, Thu: 120, Fri: 60, Sat: 25, Sun: 0 };
    }

    const currentDaily = user.weeklyFocusLogs.get(today) || 0;
    user.weeklyFocusLogs.set(today, currentDaily + (minutes || 25));

    await user.save();

    res.json({
      focusCycles: user.focusCycles,
      focusMinutes: user.focusMinutes,
      weeklyFocusLogs: Object.fromEntries(user.weeklyFocusLogs),
      message: 'Focus session logged successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
