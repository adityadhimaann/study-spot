const express = require('express');
const { auth } = require('../middleware/auth');
const SoundTrack = require('../models/SoundTrack');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/ambient/tracks
// @desc    Retrieve all active ambient soundtracks from database
// @access  Private
router.get('/tracks', auth, async (req, res) => {
  try {
    const tracks = await SoundTrack.find();
    res.json(tracks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching soundtracks' });
  }
});

// @route   GET /api/ambient/preferences
// @desc    Get user's personal sound volume preferences from database
// @access  Private
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(Object.fromEntries(user.soundPreferences || new Map()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching preferences' });
  }
});

// @route   POST /api/ambient/preferences
// @desc    Save user's personalized ambient sound volume settings in database
// @access  Private
router.post('/preferences', auth, async (req, res) => {
  try {
    const { volumes } = req.body; // Object of trackId: volume
    if (!volumes) return res.status(400).json({ message: 'No volume configurations received' });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Initialize map if missing
    if (!user.soundPreferences) {
      user.soundPreferences = new Map();
    }

    // Save each track volume inside Mongoose Map
    Object.keys(volumes).forEach((trackId) => {
      user.soundPreferences.set(trackId, volumes[trackId]);
    });

    await user.save();
    res.json({
      volumes: Object.fromEntries(user.soundPreferences),
      message: 'Sound preferences persisted successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error persisting preferences' });
  }
});

module.exports = router;
