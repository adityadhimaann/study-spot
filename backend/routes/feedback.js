const express = require('express');
const { auth } = require('../middleware/auth');
const Feedback = require('../models/Feedback');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit user feedback
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { type, message } = req.body;
    const feedback = new Feedback({
      user: req.user,
      type,
      message
    });
    await feedback.save();
    res.status(201).json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
