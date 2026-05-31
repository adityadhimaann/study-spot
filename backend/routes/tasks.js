const express = require('express');
const { auth } = require('../middleware/auth');
const Task = require('../models/Task');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Retrieve all tasks for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user }).sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task for the authenticated user
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Task text is required' });
    }

    const task = new Task({
      user: req.user,
      text: text.trim(),
      completed: false
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating task' });
  }
});

// @route   PATCH /api/tasks/:id
// @desc    Toggle/update a task's completion status
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    const { completed } = req.body;
    if (completed === undefined) {
      return res.status(400).json({ message: 'Completed state is required' });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      { completed },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!task) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

// @route   POST /api/tasks/clear-completed
// @desc    Delete all completed tasks for the authenticated user
// @access  Private
router.post('/clear-completed', auth, async (req, res) => {
  try {
    await Task.deleteMany({ user: req.user, completed: true });
    res.json({ message: 'Completed tasks cleared successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while clearing tasks' });
  }
});

module.exports = router;
