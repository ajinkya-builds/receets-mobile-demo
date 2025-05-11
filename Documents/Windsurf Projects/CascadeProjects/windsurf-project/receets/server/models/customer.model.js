const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentMethodSchema = new Schema({
  type: {
    type: String,
    enum: ['card', 'bank_account'],
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  cardBrand: String,
  last4: String,
  expiryMonth: Number,
  expiryYear: Number,
  stripePaymentMethodId: String
}, { timestamps: true });

const customerSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
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
  customerCode: {
    type: String,
    unique: true
  },
  stripeCustomerId: {
    type: String
  },
  paymentMethods: [paymentMethodSchema],
  preferences: {
    receiveReceipts: {
      type: Boolean,
      default: true
    },
    receivePromotions: {
      type: Boolean,
      default: false
    },
    defaultPaymentMethod: {
      type: Schema.Types.ObjectId,
      ref: 'paymentMethods'
    }
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Add index for faster queries
customerSchema.index({ email: 1 });
customerSchema.index({ customerCode: 1 });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
