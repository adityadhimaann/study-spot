require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/studyspace';

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Check if admin exists
    let adminUser = await User.findOne({ email: 'admin@studyspace.com' });
    
    if (adminUser) {
      console.log('Admin user already exists!');
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      adminUser = new User({
        name: 'Super Admin',
        email: 'admin@studyspace.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created successfully!');
      console.log('Email: admin@studyspace.com');
      console.log('Password: admin123');
    }

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
