const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Optional, depending on if it's signup or login
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    default: function() { return `STU-${Math.floor(Math.random()*1000000)}` }
  },
  department: {
    type: String,
    default: 'Unassigned',
  },
  year: {
    type: String,
    default: '1st Year',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  focusCycles: {
    type: Number,
    default: 0,
  },
  focusMinutes: {
    type: Number,
    default: 0,
  },
  weeklyFocusLogs: {
    type: Map,
    of: Number,
    default: { Mon: 45, Tue: 90, Wed: 30, Thu: 120, Fri: 60, Sat: 25, Sun: 0 }
  },
  soundPreferences: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
