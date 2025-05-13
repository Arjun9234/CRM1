const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
// const authMiddleware = require('../middleware/authMiddleware');

// @route   GET api/tasks
// @desc    Get all tasks
// @access  Private (TODO: Add auth)
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tasks
// @desc    Create a task
// @access  Private (TODO: Add auth)
router.post('/', async (req, res) => {
  const { title, description, dueDate, status, priority, assignedTo, project, tags } = req.body;
  try {
    if (!title || !dueDate || !status || !priority) {
        return res.status(400).json({ message: "Missing required fields: title, dueDate, status, priority" });
    }

    const newTask = new Task({
      title,
      description,
      dueDate, // Expecting ISO date string
      status,
      priority,
      assignedTo,
      project,
      tags,
    });
    const task = await newTask.save();
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    console.error('Create task error:', err.message);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/tasks/:id
// @desc    Get a task by ID
// @access  Private (TODO: Add auth)
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Task not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/tasks/:id
// @desc    Update a task
// @access  Private (TODO: Add auth)
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        console.error('Update task error:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: err.errors });
        }
         if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Task not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/tasks/:id
// @desc    Delete a task
// @access  Private (TODO: Add auth)
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json({ message: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Task not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
