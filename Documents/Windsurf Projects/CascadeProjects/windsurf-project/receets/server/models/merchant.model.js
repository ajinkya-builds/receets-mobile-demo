const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const locationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  qrCode: {
    type: String,
    unique: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const merchantSchema = new Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  businessType: {
    type: String,
    enum: ['retail', 'restaurant', 'service', 'other'],
    default: 'retail'
  },
  taxId: {
    type: String,
    trim: true
  },
  returnPeriod: {
    type: Number,
    default: 7, // Default return window in days
    min: 1,
    max: 90
  },
  locations: [locationSchema],
  settings: {
    allowPartialReturns: {
      type: Boolean,
      default: true
    },
    requireReceiptForReturns: {
      type: Boolean,
      default: true
    },
    allowCashRefunds: {
      type: Boolean,
      default: true
    },
    notifyCustomerOnSale: {
      type: Boolean,
      default: true
    }
  },
  stripeAccountId: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff'],
    default: 'admin'
  }
}, { timestamps: true });

// Add index for faster queries
merchantSchema.index({ email: 1 });
merchantSchema.index({ 'locations.qrCode': 1 });

const Merchant = mongoose.model('Merchant', merchantSchema);

module.exports = Merchant;
