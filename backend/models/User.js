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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
