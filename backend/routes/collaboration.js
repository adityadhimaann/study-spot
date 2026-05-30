const express = require('express');
const { auth } = require('../middleware/auth');
const StudyGroup = require('../models/StudyGroup');
const User = require('../models/User');

const router = express.Router();

// @route   GET /api/collaboration/groups
// @desc    Retrieve all active public study groups
// @access  Private
router.get('/groups', auth, async (req, res) => {
  try {
    // Exclude messages array from the list response to keep payload size optimal
    const groups = await StudyGroup.find().select('-messages').sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching groups' });
  }
});

// @route   POST /api/collaboration/groups
// @desc    Create/Host a new public study group
// @access  Private
router.post('/groups', auth, async (req, res) => {
  try {
    const { topic, roomName, floor, slot, maxSeats } = req.body;
    
    if (!topic || !roomName || !floor || !slot) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newGroup = new StudyGroup({
      topic,
      roomName,
      floor,
      slot,
      host: user.name || 'Anonymous Student',
      participants: [user.name || 'Anonymous Student'],
      maxSeats: maxSeats || 6
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while hosting group' });
  }
});

// @route   POST /api/collaboration/groups/:id/join
// @desc    Join an active public study group
// @access  Private
router.post('/groups/:id/join', auth, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Study group not found' });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const studentName = user.name || 'Anonymous Student';

    if (group.participants.includes(studentName)) {
      return res.status(400).json({ message: 'You are already in this study group' });
    }

    if (group.participants.length >= group.maxSeats) {
      return res.status(400).json({ message: 'This study group is full' });
    }

    group.participants.push(studentName);
    await group.save();

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while joining group' });
  }
});

// @route   DELETE /api/collaboration/groups/:id
// @desc    Close/Delete a public study group
// @access  Private
router.delete('/groups/:id', auth, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Study group not found' });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate that the request comes from the group host
    if (group.host !== user.name) {
      return res.status(403).json({ message: 'Only the host student can close this study group' });
    }

    await StudyGroup.findByIdAndDelete(req.params.id);
    res.json({ id: req.params.id, message: 'Study group closed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while closing group' });
  }
});

// @route   POST /api/collaboration/groups/:id/leave
// @desc    Leave an active public study group
// @access  Private
router.post('/groups/:id/leave', auth, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Study group not found' });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const studentName = user.name || 'Anonymous Student';

    if (!group.participants.includes(studentName)) {
      return res.status(400).json({ message: 'You are not a participant in this study group' });
    }

    // Host cannot leave, they must close the group instead
    if (group.host === studentName) {
      return res.status(400).json({ message: 'As the host, you cannot leave. You must close the study group instead.' });
    }

    group.participants = group.participants.filter(p => p !== studentName);
    await group.save();

    res.json(group);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while leaving group' });
  }
});

// @route   GET /api/collaboration/groups/:id/messages
// @desc    Retrieve all messages in a study group
// @access  Private
router.get('/groups/:id/messages', auth, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Study group not found' });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const studentName = user.name || 'Anonymous Student';
    // Validate if user is authorized to read the chat history (must be host or participant)
    if (group.host !== studentName && !group.participants.includes(studentName)) {
      return res.status(403).json({ message: 'You must be a joined member of this study group to access its chat history.' });
    }

    res.json(group.messages || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching group messages' });
  }
});

// @route   POST /api/collaboration/groups/:id/messages
// @desc    Send a message (with optional base64 file/image attachment) to the study group
// @access  Private
router.post('/groups/:id/messages', auth, async (req, res) => {
  try {
    const { text, fileUrl, fileName, fileType, fileSize } = req.body;
    
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Study group not found' });

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const studentName = user.name || 'Anonymous Student';
    // Validate if user is authorized to post messages (must be host or participant)
    if (group.host !== studentName && !group.participants.includes(studentName)) {
      return res.status(403).json({ message: 'You must be a joined member of this study group to post messages.' });
    }

    const newMessage = {
      sender: studentName,
      senderId: user._id.toString(),
      text,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      timestamp: new Date()
    };

    group.messages.push(newMessage);
    await group.save();

    // Return the newly added message
    res.status(201).json(group.messages[group.messages.length - 1]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while posting message' });
  }
});

module.exports = router;
