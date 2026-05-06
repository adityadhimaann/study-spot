const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { auth } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'studyspace',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage: storage });

// Upload single image
router.post('/upload', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
      url: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// Get all images (using Cloudinary Search API or similar)
router.get('/images', auth, async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression('folder:studyspace')
      .sort_by('created_at', 'desc')
      .max_results(30)
      .execute();
    
    res.json(result.resources);
  } catch (error) {
    console.error('Fetch images error:', error);
    res.status(500).json({ message: 'Error fetching images' });
  }
});

// Delete image
router.delete('/:public_id', auth, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.public_id);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

module.exports = router;
