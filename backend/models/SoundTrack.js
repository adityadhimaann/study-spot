const mongoose = require('mongoose');

const SoundTrackSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true, // Store string name like "Music", "CloudRain", etc.
  },
  url: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  defaultVolume: {
    type: Number,
    default: 0.5,
  },
});

module.exports = mongoose.model('SoundTrack', SoundTrackSchema);
