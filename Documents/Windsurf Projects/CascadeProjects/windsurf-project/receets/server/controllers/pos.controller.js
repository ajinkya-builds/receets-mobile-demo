const Sale = require('../models/sale.model');
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const { v4: uuidv4 } = require('uuid');

/**
 * Initiate a new sale from POS
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.initiateSale = async (req, res) => {
  try {
    const {
      merchantId,
      locationId,
      customerId,
      customerCode,
      type,
      lineItems,
      cashierId,
      cashierName
    } = req.body;
    
    // Validate merchant and location
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    const location = merchant.locations.id(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    // Validate customer if provided
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
    } else if (customerCode) {
      customer = await Customer.findOne({ customerCode });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
    }
    
    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    
    const processedLineItems = lineItems.map(item => {
      const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
      subtotal += itemTotal;
      taxTotal += item.tax || 0;
      discountTotal += item.discount || 0;
      
      return {
        ...item,
        total: itemTotal
      };
    });
    
    // Generate unique sale number
    const saleNumber = `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create new sale
    const newSale = new Sale({
      saleNumber,
      merchantId,
      locationId,
      customerId: customer ? customer._id : null,
      customerCode: customer ? customer.customerCode : customerCode,
      type: type || 'purchase',
      lineItems: processedLineItems,
      subtotal,
      taxTotal,
      discountTotal,
      total: subtotal + taxTotal - discountTotal,
      status: 'draft',
      cashierId,
      cashierName
    });
    
    await newSale.save();
    
    res.status(201).json({
      success: true,
      message: 'Sale initiated successfully',
      sale: newSale
    });
  } catch (error) {
    console.error('Error initiating sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate sale',
      error: error.message
    });
  }
};

/**
 * Update an existing sale
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const {
      lineItems,
      promoCode,
      notes,
      status
    } = req.body;
    
    // Find the sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if sale can be updated
    if (sale.status === 'completed' || sale.status === 'voided') {
      return res.status(400).json({ success: false, message: 'Cannot update a completed or voided sale' });
    }
    
    // Update line items if provided
    if (lineItems) {
      let subtotal = 0;
      let taxTotal = 0;
      let discountTotal = 0;
      
      const processedLineItems = lineItems.map(item => {
        const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
        subtotal += itemTotal;
        taxTotal += item.tax || 0;
        discountTotal += item.discount || 0;
        
        return {
          ...item,
          total: itemTotal
        };
      });
      
      sale.lineItems = processedLineItems;
      sale.subtotal = subtotal;
      sale.taxTotal = taxTotal;
      sale.discountTotal = discountTotal;
      sale.total = subtotal + taxTotal - discountTotal;
    }
    
    // Update promo code if provided
    if (promoCode) {
      sale.promoCode = promoCode;
      
      // Recalculate total with promo code
      if (promoCode.type === 'percentage') {
        const promoDiscount = (sale.subtotal * promoCode.discount) / 100;
        sale.discountTotal += promoDiscount;
        sale.total = sale.subtotal + sale.taxTotal - sale.discountTotal;
      } else if (promoCode.type === 'fixed') {
        sale.discountTotal += promoCode.discount;
        sale.total = sale.subtotal + sale.taxTotal - sale.discountTotal;
      }
    }
    
    // Update notes if provided
    if (notes) {
      sale.notes = notes;
    }
    
    // Update status if provided
    if (status) {
      sale.status = status;
    }
    
    await sale.save();
    
    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      sale
    });
  } catch (error) {
    console.error('Error updating sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sale',
      error: error.message
    });
  }
};

/**
 * Process payment for a sale
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.processPayment = async (req, res) => {
  try {
    const { saleId } = req.params;
    const {
      method,
      amount,
      transactionId,
      cardBrand,
      last4
    } = req.body;
    
    // Find the sale
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if sale can be paid
    if (sale.status === 'completed' || sale.status === 'voided') {
      return res.status(400).json({ success: false, message: 'Cannot process payment for a completed or voided sale' });
    }
    
    // Create payment object
    const payment = {
      method,
      amount,
      status: 'completed',
      transactionId,
      cardBrand,
      last4
    };
    
    // Add payment to sale
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
      message: 'Payment processed successfully',
      sale
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Get eligible returns for a customer
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getEligibleReturns = async (req, res) => {
  try {
    const { merchantId, customerId, customerCode } = req.query;
    
    // Validate merchant
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    // Calculate return window
    const returnPeriod = merchant.returnPeriod || 7; // Default to 7 days if not set
    const returnWindow = new Date();
    returnWindow.setDate(returnWindow.getDate() - returnPeriod);
    
    // Build query
    const query = {
      merchantId,
      status: 'completed',
      createdAt: { $gte: returnWindow },
      type: 'purchase' // Only purchases can be returned
    };
    
    // Add customer filter
    if (customerId) {
      query.customerId = customerId;
    } else if (customerCode) {
      query.customerCode = customerCode;
    } else {
      return res.status(400).json({ success: false, message: 'Customer ID or code is required' });
    }
    
    // Find eligible sales
    const eligibleSales = await Sale.find(query);
    
    res.status(200).json({
      success: true,
      returnPeriod,
      eligibleSales
    });
  } catch (error) {
    console.error('Error getting eligible returns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get eligible returns',
      error: error.message
    });
  }
};

/**
 * Process a return
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.processReturn = async (req, res) => {
  try {
    const {
      originalSaleId,
      merchantId,
      locationId,
      customerId,
      customerCode,
      lineItems,
      cashierId,
      cashierName
    } = req.body;
    
    // Validate original sale
    const originalSale = await Sale.findById(originalSaleId);
    if (!originalSale) {
      return res.status(404).json({ success: false, message: 'Original sale not found' });
    }
    
    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;
    
    const processedLineItems = lineItems.map(item => {
      // For returns, quantities should be negative
      const quantity = Math.abs(item.quantity) * -1;
      const itemTotal = quantity * item.unitPrice - (item.discount || 0);
      subtotal += itemTotal;
      taxTotal += (item.tax || 0) * -1;
      discountTotal += (item.discount || 0) * -1;
      
      return {
        ...item,
        quantity,
        total: itemTotal
      };
    });
    
    // Generate unique sale number for the return
    const saleNumber = `RET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create new return sale
    const returnSale = new Sale({
      saleNumber,
      merchantId,
      locationId,
      customerId,
      customerCode,
      type: 'return',
      lineItems: processedLineItems,
      subtotal,
      taxTotal,
      discountTotal,
      total: subtotal + taxTotal - discountTotal,
      status: 'draft',
      originalSaleId,
      cashierId,
      cashierName
    });
    
    await returnSale.save();
    
    res.status(201).json({
      success: true,
      message: 'Return initiated successfully',
      sale: returnSale
    });
  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process return',
      error: error.message
    });
  }
};
