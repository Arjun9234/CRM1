const mongoose = require('mongoose');

const SegmentRuleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  field: { type: String, required: true },
  operator: { type: String, required: true },
  value: { type: String, required: true },
}, {_id: false});

const CampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Campaign name is required"],
  },
  segmentName: {
    type: String,
  },
  rules: {
    type: [SegmentRuleSchema],
    required: true,
    validate: [val => val.length > 0, 'At least one segment rule is required']
  },
  ruleLogic: {
    type: String,
    enum: ['AND', 'OR'],
    required: true,
  },
  message: {
    type: String,
    required: [true, "Message is required"],
  },
  status: {
    type: String,
    enum: ['Draft', 'Scheduled', 'Sent', 'Failed', 'Archived', 'Cancelled'],
    required: true,
  },
  audienceSize: {
    type: Number,
    min: 0,
    required: true,
  },
  sentCount: {
    type: Number,
    min: 0,
    default: 0,
  },
  failedCount: {
    type: Number,
    min: 0,
    default: 0,
  },
  // createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: link to user who created it
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

CampaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // If status is 'Sent' and counts are not explicitly set, calculate them
  if (this.status === 'Sent' && this.audienceSize > 0 && (this.sentCount === 0 && this.failedCount === 0)) {
    const successRate = Math.random() * 0.20 + 0.75; // 75-95% success
    this.sentCount = Math.floor(this.audienceSize * successRate);
    this.failedCount = this.audienceSize - this.sentCount;
  } else if (this.status === 'Sent' && this.audienceSize === 0) {
    this.sentCount = 0;
    this.failedCount = 0;
  }
  next();
});

CampaignSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  // Handle status change to 'Sent' on update
  const update = this.getUpdate();
  if (update.status === 'Sent' && update.audienceSize !== undefined ) {
      const audience = update.audienceSize;
      if (audience > 0 && (update.sentCount === undefined || update.failedCount === undefined) ) {
          const successRate = Math.random() * 0.4 + 0.6;
          update.sentCount = Math.floor(audience * successRate);
          update.failedCount = audience - update.sentCount;
      } else if (audience === 0) {
          update.sentCount = 0;
          update.failedCount = 0;
      }
  }
  next();
});


module.exports = mongoose.model('Campaign', CampaignSchema);
