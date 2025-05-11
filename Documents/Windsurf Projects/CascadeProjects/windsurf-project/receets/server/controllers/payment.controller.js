const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Sale = require('../models/sale.model');
const Customer = require('../models/customer.model');
const Merchant = require('../models/merchant.model');

/**
 * Process a payment with Stripe
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.processStripePayment = async (req, res) => {
  try {
    const { saleId, paymentMethodId, customerId } = req.body;
    
    // Find the sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if sale can be paid
    if (sale.status === 'completed' || sale.status === 'voided') {
      return res.status(400).json({ success: false, message: 'Cannot process payment for a completed or voided sale' });
    }
    
    // Find the merchant
    const merchant = await Merchant.findById(sale.merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Ensure customer has a Stripe customer ID
    let stripeCustomerId = customer.stripeCustomerId;
    if (!stripeCustomerId) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone
      });
      
      stripeCustomerId = stripeCustomer.id;
      customer.stripeCustomerId = stripeCustomerId;
      await customer.save();
    }
    
    // Calculate amount in cents
    const amount = Math.round(sale.total * 100);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      description: `Payment for sale ${sale.saleNumber}`,
      metadata: {
        saleId: sale._id.toString(),
        merchantId: sale.merchantId.toString(),
        customerCode: customer.customerCode
      },
      transfer_data: merchant.stripeAccountId ? {
        destination: merchant.stripeAccountId
      } : undefined
    });
    
    // Add payment to sale
    const payment = {
      method: 'receets_pay',
      amount: sale.total,
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      transactionId: paymentIntent.id
    };
    
    if (paymentIntent.payment_method_details?.card) {
      payment.cardBrand = paymentIntent.payment_method_details.card.brand;
      payment.last4 = paymentIntent.payment_method_details.card.last4;
    }
    
    sale.payments.push(payment);
    
    // Update sale status
    if (paymentIntent.status === 'succeeded') {
      sale.status = 'completed';
    } else {
      sale.status = 'in_progress';
    }
    
    await sale.save();
    
    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      payment: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        receipt_url: paymentIntent.charges.data[0]?.receipt_url
      },
      sale
    });
  } catch (error) {
    console.error('Error processing Stripe payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Process a cash payment
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.processCashPayment = async (req, res) => {
  try {
    const { saleId, amount, amountTendered } = req.body;
    
    // Find the sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if sale can be paid
    if (sale.status === 'completed' || sale.status === 'voided') {
      return res.status(400).json({ success: false, message: 'Cannot process payment for a completed or voided sale' });
    }
    
    // Add payment to sale
    const payment = {
      method: 'cash',
      amount,
      status: 'completed',
      transactionId: `CASH-${Date.now()}`
    };
    
    sale.payments.push(payment);
    
    // Calculate total paid
    const totalPaid = sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Update sale status
    if (totalPaid >= sale.total) {
      sale.status = 'completed';
    } else {
      sale.status = 'in_progress';
    }
    
    await sale.save();
    
    res.status(200).json({
      success: true,
      message: 'Cash payment processed successfully',
      payment: {
        method: 'cash',
        amount,
        amountTendered,
        change: amountTendered - amount
      },
      sale
    });
  } catch (error) {
    console.error('Error processing cash payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process cash payment',
      error: error.message
    });
  }
};

/**
 * Process a manual card payment
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.processManualCardPayment = async (req, res) => {
  try {
    const { saleId, amount, cardBrand, last4, transactionId } = req.body;
    
    // Find the sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if sale can be paid
    if (sale.status === 'completed' || sale.status === 'voided') {
      return res.status(400).json({ success: false, message: 'Cannot process payment for a completed or voided sale' });
    }
    
    // Add payment to sale
    const payment = {
      method: 'card',
      amount,
      status: 'completed',
      transactionId: transactionId || `CARD-${Date.now()}`,
      cardBrand,
      last4
    };
    
    sale.payments.push(payment);
    
    // Calculate total paid
    const totalPaid = sale.payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Update sale status
    if (totalPaid >= sale.total) {
      sale.status = 'completed';
    } else {
      sale.status = 'in_progress';
    }
    
    await sale.save();
    
    res.status(200).json({
      success: true,
      message: 'Card payment processed successfully',
      payment: {
        method: 'card',
        amount,
        cardBrand,
        last4
      },
      sale
    });
  } catch (error) {
    console.error('Error processing manual card payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process card payment',
      error: error.message
    });
  }
};

/**
 * Process a refund
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.processRefund = async (req, res) => {
  try {
    const { saleId, amount, reason } = req.body;
    
    // Find the sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if sale is a return
    if (sale.type !== 'return') {
      return res.status(400).json({ success: false, message: 'Can only process refunds for return sales' });
    }
    
    // Check if sale can be refunded
    if (sale.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only refund completed sales' });
    }
    
    // Find the original sale
    const originalSale = await Sale.findById(sale.originalSaleId);
    
    // If original sale has a Stripe payment, process Stripe refund
    const stripePayment = originalSale?.payments.find(p => p.method === 'receets_pay' && p.transactionId);
    
    if (stripePayment) {
      // Calculate amount in cents
      const refundAmount = Math.round(amount * 100);
      
      // Process Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: stripePayment.transactionId,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
          saleId: sale._id.toString(),
          originalSaleId: originalSale._id.toString(),
          reason
        }
      });
      
      // Update payment in original sale
      stripePayment.refundAmount = (stripePayment.refundAmount || 0) + amount;
      stripePayment.refundReason = reason;
      stripePayment.refundDate = new Date();
      
      if (stripePayment.refundAmount >= stripePayment.amount) {
        stripePayment.status = 'refunded';
      } else {
        stripePayment.status = 'partially_refunded';
      }
      
      await originalSale.save();
      
      // Add payment to return sale
      const payment = {
        method: 'receets_pay',
        amount: -amount, // Negative amount for refund
        status: 'completed',
        transactionId: refund.id,
        cardBrand: stripePayment.cardBrand,
        last4: stripePayment.last4
      };
      
      sale.payments.push(payment);
      await sale.save();
      
      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        },
        sale
      });
    } else {
      // Process manual refund
      const payment = {
        method: 'cash', // Default to cash refund
        amount: -amount, // Negative amount for refund
        status: 'completed',
        transactionId: `REFUND-${Date.now()}`
      };
      
      sale.payments.push(payment);
      await sale.save();
      
      res.status(200).json({
        success: true,
        message: 'Manual refund processed successfully',
        refund: {
          amount,
          method: 'cash',
          reason
        },
        sale
      });
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
};
