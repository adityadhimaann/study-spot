require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5001',
  'https://main.dgxs91r156db5.amplifyapp.com',
  'https://du89a4pg5di5u.cloudfront.net',
];
// Also allow any origin set via environment variable
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/storage', require('./routes/storage'));
app.use('/api/collaboration', require('./routes/collaboration'));
app.use('/api/ambient', require('./routes/ambient'));

// Test route
app.get('/', (req, res) => {
  res.send('StudySpace API is running');
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyspace';
const SoundTrack = require('./models/SoundTrack');

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    // Seed SoundTracks collection if it is empty
    try {
      const count = await SoundTrack.countDocuments();
      if (count === 0) {
        console.log('Seeding Ambient SoundTracks to MongoDB...');
        const tracks = [
          { id: "lofi", name: "Chill Lofi Beats", icon: "Music", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", color: "from-purple-500/20 to-purple-600/5", defaultVolume: 0.5 },
          { id: "rain", name: "Cozy Rain", icon: "CloudRain", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", color: "from-blue-500/20 to-blue-600/5", defaultVolume: 0.4 },
          { id: "cafe", name: "Bustling Cafe", icon: "Coffee", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", color: "from-amber-500/20 to-amber-600/5", defaultVolume: 0.3 },
          { id: "forest", name: "Whispering Forest", icon: "Trees", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", color: "from-emerald-500/20 to-emerald-600/5", defaultVolume: 0.2 },
          { id: "fire", name: "Crackling Fireplace", icon: "Flame", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", color: "from-rose-500/20 to-rose-600/5", defaultVolume: 0.3 },
          { id: "waves", name: "Ocean Waves", icon: "Waves", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", color: "from-cyan-500/20 to-cyan-600/5", defaultVolume: 0.4 }
        ];
        await SoundTrack.insertMany(tracks);
        console.log('Successfully seeded 6 Ambient SoundTracks!');
      }
    } catch (e) {
      console.error('Error seeding SoundTracks:', e);
    }

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
