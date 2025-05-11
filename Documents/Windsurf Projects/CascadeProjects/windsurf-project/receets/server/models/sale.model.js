const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const lineItemSchema = new Schema({
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  }
});

const paymentSchema = new Schema({
  method: {
    type: String,
    enum: ['receets_pay', 'apple_pay', 'google_pay', 'cash', 'card', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  transactionId: String,
  cardBrand: String,
  last4: String,
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  refundDate: Date
}, { timestamps: true });

const saleSchema = new Schema({
  saleNumber: {
    type: String,
    required: true,
    unique: true
  },
  merchantId: {
    type: Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  locationId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  customerCode: {
    type: String
  },
  type: {
    type: String,
    enum: ['purchase', 'return', 'exchange'],
    default: 'purchase'
  },
  status: {
    type: String,
    enum: ['draft', 'in_progress', 'completed', 'voided', 'refunded', 'partially_refunded'],
    default: 'draft'
  },
  lineItems: [lineItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  taxTotal: {
    type: Number,
    default: 0
  },
  discountTotal: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  payments: [paymentSchema],
  promoCode: {
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  notes: String,
  originalSaleId: {
    type: Schema.Types.ObjectId,
    ref: 'Sale'
  },
  receiptUrl: String,
  cashierId: String,
  cashierName: String
}, { timestamps: true });

// Add indexes for faster queries
saleSchema.index({ saleNumber: 1 });
saleSchema.index({ merchantId: 1 });
saleSchema.index({ customerId: 1 });
saleSchema.index({ customerCode: 1 });
saleSchema.index({ createdAt: 1 });
saleSchema.index({ status: 1 });
saleSchema.index({ type: 1 });

const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;
