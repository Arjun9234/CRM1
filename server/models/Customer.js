const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    // unique: true, // Consider if email must be unique across all customers
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'is invalid']
  },
  avatarUrl: {
    type: String,
  },
  company: {
    type: String,
  },
  totalSpend: {
    type: Number,
    min: 0,
    default: 0,
  },
  lastContact: {
    type: Date,
    required: [true, "Last contact date is required"],
  },
  status: {
    type: String,
    enum: ['Active', 'Lead', 'Inactive', 'New', 'Archived'],
    required: true,
  },
  acquisitionSource: {
    type: String,
  },
  tags: {
    type: [String],
  },
  lastSeenOnline: {
    type: Date,
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

CustomerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

CustomerSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Customer', CustomerSchema);
