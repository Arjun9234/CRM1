const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
// const authMiddleware = require('../middleware/authMiddleware'); // TODO: Add auth middleware

// @route   GET api/campaigns
// @desc    Get all campaigns
// @access  Private (TODO: Add auth middleware)
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/campaigns
// @desc    Create a campaign
// @access  Private (TODO: Add auth middleware)
router.post('/', async (req, res) => {
  const { name, segmentName, rules, ruleLogic, message, status, audienceSize } = req.body;
  try {
    const newCampaign = new Campaign({
      name,
      segmentName,
      rules,
      ruleLogic,
      message,
      status,
      audienceSize,
      // sentCount and failedCount will be handled by pre-save hook if status is 'Sent'
    });
    const campaign = await newCampaign.save();
    res.status(201).json(campaign);
  } catch (err) {
    console.error('Create campaign error:', err.message);
     if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/campaigns/:id
// @desc    Get a campaign by ID
// @access  Private (TODO: Add auth middleware)
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Campaign not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/campaigns/:id
// @desc    Update a campaign
// @access  Private (TODO: Add auth middleware)
router.put('/:id', async (req, res) => {
  const { name, segmentName, rules, ruleLogic, message, status, audienceSize, sentCount, failedCount } = req.body;
  
  const campaignFields = {};
  if (name !== undefined) campaignFields.name = name;
  if (segmentName !== undefined) campaignFields.segmentName = segmentName;
  if (rules !== undefined) campaignFields.rules = rules;
  if (ruleLogic !== undefined) campaignFields.ruleLogic = ruleLogic;
  if (message !== undefined) campaignFields.message = message;
  if (status !== undefined) campaignFields.status = status;
  if (audienceSize !== undefined) campaignFields.audienceSize = audienceSize;
  if (sentCount !== undefined) campaignFields.sentCount = sentCount;
  if (failedCount !== undefined) campaignFields.failedCount = failedCount;
  campaignFields.updatedAt = Date.now();

  try {
    let campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // If status is changing to 'Sent' and counts are not explicitly provided, pre-update hook will handle.
    // Or, if they ARE provided, they'll be used.
    // This logic is now primarily in the pre('findOneAndUpdate') hook in the model.

    campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: campaignFields },
      { new: true, runValidators: true } // new: true returns the modified document
    );
    res.json(campaign);
  } catch (err) {
    console.error('Update campaign error:', err.message);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: err.errors });
    }
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Campaign not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/campaigns/:id
// @desc    Delete a campaign
// @access  Private (TODO: Add auth middleware)
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign removed' });
  } catch (err) {
    console.error(err.message);
     if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Campaign not found (invalid ID format)' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
