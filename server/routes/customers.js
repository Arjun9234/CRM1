const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
// const authMiddleware = require('../middleware/authMiddleware');

// @route   GET api/customers
// @desc    Get all customers
// @access  Private (TODO: Add auth)
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/customers
// @desc    Create a customer
// @access  Private (TODO: Add auth)
router.post('/', async (req, res) => {
  const { name, email, avatarUrl, company, totalSpend, lastContact, status, acquisitionSource, tags, lastSeenOnline } = req.body;
  try {
    // Basic validation for required fields server-side, although Mongoose schema also handles it.
    if (!name || !email || !lastContact || !status) {
        return res.status(400).json({ message: "Missing required fields: name, email, lastContact, status" });
    }

    const newCustomer = new Customer({
      name,
      email,
      avatarUrl: avatarUrl || `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`,
      company,
      totalSpend,
      lastContact, // Expecting ISO date string
      status,
      acquisitionSource,
      tags,
      lastSeenOnline, // Expecting ISO date string or undefined
    });
    const customer = await newCustomer.save();
    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (err) {
    console.error('Create customer error:', err.message);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/customers/:id
// @desc    Get a customer by ID
// @access  Private (TODO: Add auth)
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/customers/:id
// @desc    Update a customer
// @access  Private (TODO: Add auth)
router.put('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json(customer);
    } catch (err) {
        console.error('Update customer error:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: err.errors });
        }
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/customers/:id
// @desc    Delete a customer
// @access  Private (TODO: Add auth)
router.delete('/:id', async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.json({ message: 'Customer removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Customer not found (invalid ID format)' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
