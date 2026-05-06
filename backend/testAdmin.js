const mongoose = require('mongoose');
const User = require('./models/User');
const Room = require('./models/Room');
const Booking = require('./models/Booking');

const run = async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/studyspace');
  const bookings = await Booking.find().populate('user').populate('room');
  console.log("Bookings count:", bookings.length);
  if (bookings.length > 0) {
     console.log("First booking user:", bookings[0].user?.name);
     console.log("First booking room:", bookings[0].room?.name);
  } else {
     console.log("No bookings found in database.");
  }
  process.exit(0);
}
run();
