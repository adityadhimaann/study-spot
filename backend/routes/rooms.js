const express = require('express');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms
router.get('/', async (req, res) => {
  try {
    let rooms = await Room.find().lean();
    
    const upcomingBookings = await Booking.find({ status: 'upcoming' });
    const bookedRoomIds = new Set(upcomingBookings.map(b => b.room.toString()));
    
    rooms = rooms.map(r => {
      // If it's statically 'available' but has an upcoming booking, show as 'booked'
      if (r.status === 'available' && bookedRoomIds.has(r._id.toString())) {
        r.status = 'booked';
      }
      return r;
    });

    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get single room by ID
router.get('/:id', async (req, res) => {
  try {
    let room = await Room.findById(req.params.id).lean();
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const upcomingBooking = await Booking.findOne({ room: room._id, status: 'upcoming' });
    if (room.status === 'available' && upcomingBooking) {
      room.status = 'booked';
    }

    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room (usually admin only, keeping it open for seeding right now)
router.post('/', async (req, res) => {
  try {
    const newRoom = new Room(req.body);
    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
