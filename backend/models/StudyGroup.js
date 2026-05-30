const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  text: {
    type: String,
  },
  fileUrl: {
    type: String, // Base64 data URL
  },
  fileName: {
    type: String,
  },
  fileType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const StudyGroupSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
  },
  roomName: {
    type: String,
    required: true,
  },
  floor: {
    type: String,
    required: true,
  },
  slot: {
    type: String,
    required: true,
  },
  host: {
    type: String,
    required: true,
  },
  participants: {
    type: [String],
    default: [],
  },
  maxSeats: {
    type: Number,
    required: true,
    default: 6,
  },
  messages: {
    type: [MessageSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('StudyGroup', StudyGroupSchema);

