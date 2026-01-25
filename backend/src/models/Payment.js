const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  stripePaymentId: {
    type: String,
    required: [true, 'Stripe payment ID is required'],
  },
  
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Payer is required'],
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
  },
  
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  
  platformCommission: Number,
  tutorPayout: Number,
  
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  
  paymentMethod: String,
  receiptUrl: String,
  
  payoutStatus: {
    isPaidOut: {
      type: Boolean,
      default: false,
    },
    paidOutAt: Date,
    payoutId: String,
  },
}, {
  timestamps: true,
});

// Indexes
PaymentSchema.index({ payer: 1 });
PaymentSchema.index({ course: 1 });
PaymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
