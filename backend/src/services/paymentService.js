const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Course = require('../models/Course');

/**
 * Create payment intent for course enrollment
 */
exports.createPaymentIntent = async (candidateId, courseId) => {
  const course = await Course.findById(courseId);

  if (!course) {
    throw new Error('Course not found');
  }

  if (!course.settings.isPublished) {
    throw new Error('Course is not available for enrollment');
  }

  const amount = course.pricing.amount;
  const currency = course.pricing.currency.toLowerCase();

  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        candidateId: candidateId.toString(),
        courseId: courseId.toString(),
      },
    });

    // Create payment record
    const payment = new Payment({
      stripePaymentId: paymentIntent.id,
      payer: candidateId,
      course: courseId,
      amount,
      currency: currency.toUpperCase(),
      platformCommission: (amount * course.pricing.commissionRate) / 100,
      tutorPayout: amount - (amount * course.pricing.commissionRate) / 100,
      status: 'pending',
    });

    await payment.save();

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      amount,
      currency: currency.toUpperCase(),
    };
  } catch (error) {
    throw new Error(`Payment intent creation failed: ${error.message}`);
  }
};

/**
 * Confirm payment after successful charge
 */
exports.confirmPayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const payment = await Payment.findOne({ stripePaymentId: paymentIntentId });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (paymentIntent.status === 'succeeded') {
      payment.status = 'completed';
      payment.paymentMethod = paymentIntent.payment_method;
      await payment.save();

      return {
        success: true,
        payment,
      };
    } else {
      payment.status = 'failed';
      await payment.save();

      return {
        success: false,
        reason: 'Payment not successful',
      };
    }
  } catch (error) {
    throw new Error(`Payment confirmation failed: ${error.message}`);
  }
};

/**
 * Handle Stripe webhook events
 */
exports.handleWebhook = async (event) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await this.confirmPayment(event.data.object.id);
      break;

    case 'payment_intent.payment_failed':
      const payment = await Payment.findOne({ stripePaymentId: event.data.object.id });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

/**
 * Process refund (admin only)
 */
exports.processRefund = async (paymentId, reason) => {
  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.status !== 'completed') {
    throw new Error('Only completed payments can be refunded');
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      reason: reason === 'duplicate' || reason === 'fraudulent' || reason === 'requested_by_customer' 
        ? reason 
        : 'requested_by_customer',
    });

    payment.status = 'refunded';
    await payment.save();

    return {
      success: true,
      refundId: refund.id,
      payment,
    };
  } catch (error) {
    throw new Error(`Refund failed: ${error.message}`);
  }
};

/**
 * Get payment history for a user
 */
exports.getPaymentHistory = async (userId) => {
  const payments = await Payment.find({ payer: userId })
    .populate('course', 'title thumbnail')
    .sort({ createdAt: -1 });

  return payments;
};

module.exports = exports;
