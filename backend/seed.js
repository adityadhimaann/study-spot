require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyspace';

const seedRooms = [
  // ── FLOOR 1 ──
  { name: "Quiet Zone A1", type: "quiet", capacity: 1, status: "available", floor: "1st Floor", amenities: ["Wi-Fi", "Power"], rating: 4.8 },
  { name: "Quiet Zone A2", type: "quiet", capacity: 1, status: "available", floor: "1st Floor", amenities: ["Wi-Fi", "Power", "Lamp"], rating: 4.5 },
  { name: "Quiet Zone A3", type: "quiet", capacity: 1, status: "booked", floor: "1st Floor", amenities: ["Wi-Fi"], rating: 4.9 },
  { name: "Quiet Zone A4", type: "quiet", capacity: 1, status: "available", floor: "1st Floor", amenities: ["Wi-Fi", "AC"], rating: 4.6 },
  { name: "Group Room A5", type: "group", capacity: 6, status: "available", floor: "1st Floor", amenities: ["Wi-Fi", "Whiteboard", "TV"], rating: 4.7 },

  // ── FLOOR 2 ──
  { name: "Group Room B1", type: "group", capacity: 6, status: "available", floor: "2nd Floor", amenities: ["Wi-Fi", "Whiteboard", "TV"], rating: 4.7 },
  { name: "Group Room B2", type: "group", capacity: 8, status: "almost-full", floor: "2nd Floor", amenities: ["Wi-Fi", "Whiteboard"], rating: 4.6 },
  { name: "Group Room B3", type: "group", capacity: 4, status: "available", floor: "2nd Floor", amenities: ["Wi-Fi", "Power"], rating: 4.3 },
  { name: "Quiet Zone B4", type: "quiet", capacity: 1, status: "available", floor: "2nd Floor", amenities: ["Wi-Fi", "Power"], rating: 4.5 },
  { name: "Quiet Zone B5", type: "quiet", capacity: 2, status: "available", floor: "2nd Floor", amenities: ["Wi-Fi", "Power", "Charger"], rating: 4.2 },

  // ── FLOOR 3 ──
  { name: "Quiet Zone C1", type: "quiet", capacity: 1, status: "available", floor: "3rd Floor", amenities: ["Wi-Fi", "Power"], rating: 4.4 },
  { name: "Group Room C2", type: "group", capacity: 10, status: "available", floor: "3rd Floor", amenities: ["Wi-Fi", "Whiteboard", "TV", "Projector"], rating: 4.9 },
  { name: "Quiet Zone C3", type: "quiet", capacity: 1, status: "booked", floor: "3rd Floor", amenities: ["Wi-Fi", "Quiet"], rating: 4.7 },
  { name: "Quiet Zone C4", type: "quiet", capacity: 1, status: "available", floor: "3rd Floor", amenities: ["Wi-Fi"], rating: 4.3 },
  { name: "Group Room C5", type: "group", capacity: 6, status: "available", floor: "3rd Floor", amenities: ["Wi-Fi", "Whiteboard"], rating: 4.5 },
];

const runSeeder = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for seeding');

    // Clear existing rooms
    await Room.deleteMany();
    console.log('Existing rooms cleared');

    // Insert new rooms
    await Room.insertMany(seedRooms);
    console.log('Rooms seeded successfully!');

    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

runSeeder();
