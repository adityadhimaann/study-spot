const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['quiet', 'group'], // quiet zone or group study
  },
  capacity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'almost-full', 'booked'],
    default: 'available',
  },
  floor: {
    type: String,
    required: true,
  },
  amenities: {
    type: [String],
    default: [],
  },
  rating: {
    type: Number,
    default: 0,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
  w: {
    type: Number,
    default: 100,
  },
  h: {
    type: Number,
    default: 80,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', RoomSchema);
