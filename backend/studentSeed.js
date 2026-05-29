require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Room = require('./models/Room');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyspace';

const seedStudentsAndBookings = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Clear existing bookings
    await Booking.deleteMany({});
    
    // Delete non-admin users to reset
    await User.deleteMany({ role: 'student' });
    
    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('password123', salt);
    
    // Create students
    const students = await User.insertMany([
      { name: 'Aditya Sharma', email: 'aditya@example.com', password, role: 'student' },
      { name: 'Jane Doe', email: 'jane.doe@university.edu', password, role: 'student' },
      { name: 'John Smith', email: 'jsmith@university.edu', password, role: 'student' },
      { name: 'Priya Patel', email: 'priya.p@university.edu', password, role: 'student' }
    ]);
    
    // Get rooms
    const rooms = await Room.find();
    if (rooms.length === 0) {
      console.log('No rooms found. Please run seed.js first.');
      process.exit(1);
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Create bookings
    await Booking.insertMany([
      { user: students[0]._id, room: rooms[0 % rooms.length]._id, date: today, slot: '10:00', status: 'completed' },
      { user: students[1]._id, room: rooms[1 % rooms.length]._id, date: today, slot: '14:00', status: 'upcoming' },
      { user: students[2]._id, room: rooms[3 % rooms.length]._id, date: tomorrow, slot: '09:00', status: 'upcoming' },
      { user: students[3]._id, room: rooms[4 % rooms.length]._id, date: tomorrow, slot: '15:00', status: 'cancelled' },
      { user: students[0]._id, room: rooms[2 % rooms.length]._id, date: tomorrow, slot: '11:00', status: 'upcoming' }
    ]);

    console.log('Successfully seeded students and their bookings!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedStudentsAndBookings();
