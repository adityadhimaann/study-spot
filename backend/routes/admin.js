const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');

const User = require('../models/User');

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const activeRooms = await Room.countDocuments();
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysBookings = await Booking.countDocuments({ date: todayStr });
    
    const registeredUsers = await User.countDocuments({ role: 'student' });

    const roomUsageRaw = await Booking.aggregate([
      { $group: { _id: "$room", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    await Room.populate(roomUsageRaw, { path: '_id', select: 'name' });
    const roomUsage = roomUsageRaw.map(r => ({ name: r._id?.name || 'Deleted Room', usage: Math.min(100, r.count * 15) }));

    const peakHoursRaw = await Booking.aggregate([
      { $group: { _id: "$slot", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const peakHours = peakHoursRaw.map(p => ({ hour: p._id.split(' - ')[0], pct: Math.min(100, p.count * 25) }));

    res.json({
      adminStats: [
        { label: "Total Bookings", value: totalBookings.toString() },
        { label: "Active Rooms", value: activeRooms.toString() },
        { label: "Today's Bookings", value: todaysBookings.toString() },
        { label: "Registered Users", value: registeredUsers.toString() }
      ],
      roomUsage,
      peakHours
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings with user and room info
// @access  Admin
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', ['name', 'email'])
      .populate('room', ['name', 'type', 'floor'])
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/bookings/:id
// @desc    Update a booking status
// @access  Admin
router.patch('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    let booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    booking.status = status;
    await booking.save();
    
    const statusText = status === 'completed' ? 'Approved' : 'Rejected';
    await Notification.create({
      user: booking.user,
      title: `Booking ${statusText}`,
      message: `Your booking for ${booking.date} at ${booking.slot} has been ${statusText.toLowerCase()}.`
    });
    
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all registered users and their booking counts
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password');
    const usersWithStats = await Promise.all(users.map(async (u) => {
      const bookingsCount = await Booking.countDocuments({ user: u._id });
      return { ...u.toObject(), totalBookings: bookingsCount };
    }));
    res.json(usersWithStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/rooms
// @desc    Create a new room
// @access  Admin
router.post('/rooms', adminAuth, async (req, res) => {
  try {
    const { name, type, capacity, amenities, floor, x, y, w, h } = req.body;
    const room = new Room({ name, type, capacity, amenities, floor, x, y, w, h });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/rooms/:id
// @desc    Delete a room
// @access  Admin
router.delete('/rooms/:id', adminAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    // Also delete associated bookings
    await Booking.deleteMany({ room: req.params.id });
    await room.deleteOne();
    
    res.json({ message: 'Room removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/rooms/:id
// @desc    Update a room (details, map coordinates)
// @access  Admin
router.put('/rooms/:id', adminAuth, async (req, res) => {
  try {
    const { name, type, capacity, amenities, floor, status, x, y, w, h } = req.body;
    let room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    if (name) room.name = name;
    if (type) room.type = type;
    if (capacity !== undefined) room.capacity = capacity;
    if (amenities) room.amenities = amenities;
    if (floor) room.floor = floor;
    if (status) room.status = status;
    if (x !== undefined) room.x = x;
    if (y !== undefined) room.y = y;
    if (w !== undefined) room.w = w;
    if (h !== undefined) room.h = h;
    
    await room.save();
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/feedback
// @desc    Get all user feedback
// @access  Admin
router.get('/feedback', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.find().populate('user', ['name', 'email', 'studentId']).sort({ createdAt: -1 });
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/admin/feedback/:id
// @desc    Mark feedback as resolved
// @access  Admin
router.patch('/feedback/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    feedback.status = req.body.status;
    await feedback.save();
    res.json(feedback);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
