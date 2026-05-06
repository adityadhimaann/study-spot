const express = require('express');
const { auth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { room, date, slot } = req.body;

    // Check if slot is already booked for that room and date
    const existingBooking = await Booking.findOne({ room, date, slot, status: { $ne: 'cancelled' } });
    if (existingBooking) {
      return res.status(400).json({ message: 'This slot is already booked.' });
    }

    const newBooking = new Booking({
      user: req.user,
      room,
      date,
      slot
    });

    const savedBooking = await newBooking.save();
    
    await Notification.create({
      user: req.user,
      title: 'Booking Requested',
      message: `Your room booking request for ${date} at ${slot} has been received and is pending approval.`
    });

    res.status(201).json(savedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/my-bookings
// @desc    Get all bookings for the logged-in user
// @access  Private
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user })
      .populate('room', ['name', 'floor', 'type', 'capacity', 'amenities', 'status'])
      .sort({ date: 1, slot: 1 });
      
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Make sure user owns booking
    if (booking.user.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();
    
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Modify an existing booking date/time
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, slot } = req.body;
    let booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    if (booking.user.toString() !== req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot modify a cancelled booking.' });
    }

    // Check if new slot is already booked for that room and date
    const existingBooking = await Booking.findOne({ room: booking.room, date, slot, status: { $ne: 'cancelled' } });
    if (existingBooking && existingBooking._id.toString() !== booking._id.toString()) {
      return res.status(400).json({ message: 'This new slot is already booked.' });
    }

    booking.date = date;
    booking.slot = slot;
    // Keep the status as is (upcoming/completed) or revert to upcoming
    // Depending on logic, let's keep it as upcoming if they edit it
    booking.status = 'upcoming'; 
    await booking.save();
    
    await Notification.create({
      user: req.user,
      title: 'Booking Modified',
      message: `Your booking has been updated to ${date} at ${slot}.`
    });

    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/invite
// @desc    Invite a peer to a booking by email
// @access  Private
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const { email } = req.body;
    let booking = await Booking.findById(req.params.id).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const targetUser = await User.findOne({ email });
    if (!targetUser) return res.status(404).json({ message: 'User not found with that email' });

    await Notification.create({
      user: targetUser._id,
      title: 'Group Room Invitation',
      message: `You have been invited to join a study session in ${booking.room.name} on ${booking.date} at ${booking.slot}.`
    });

    res.json({ message: 'Invitation sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
