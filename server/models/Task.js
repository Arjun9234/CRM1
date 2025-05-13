const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: String,
  },
  dueDate: {
    type: Date,
    required: [true, "Due date is required"],
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Completed', 'Blocked', 'Archived'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
  },
  assignedTo: {
    type: String, // Could be a user ID or name
  },
  project: {
    type: String,
  },
  tags: {
    type: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

TaskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

TaskSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Task', TaskSchema);
