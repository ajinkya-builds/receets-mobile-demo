const Sale = require('../models/sale.model');
const Customer = require('../models/customer.model');
const Merchant = require('../models/merchant.model');

/**
 * Get all sales for a merchant
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getMerchantSales = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      type, 
      status, 
      locationId,
      customerId,
      customerCode,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = { merchantId };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (locationId) {
      query.locationId = locationId;
    }
    
    if (customerId) {
      query.customerId = customerId;
    }
    
    if (customerCode) {
      query.customerCode = customerCode;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get sales
    const sales = await Sale.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customerId', 'firstName lastName email customerCode');
    
    // Get total count
    const totalSales = await Sale.countDocuments(query);
    
    res.status(200).json({
      success: true,
      sales,
      pagination: {
        total: totalSales,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalSales / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting merchant sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get merchant sales',
      error: error.message
    });
  }
};

/**
 * Get a specific sale
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    
    const sale = await Sale.findById(saleId)
      .populate('customerId', 'firstName lastName email customerCode')
      .populate('merchantId', 'businessName email');
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if user has permission to view this sale
    if (req.user.type === 'merchant' && sale.merchantId._id.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this sale' });
    }
    
    if (req.user.type === 'customer' && (!sale.customerId || sale.customerId._id.toString() !== req.customer._id.toString())) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this sale' });
    }
    
    res.status(200).json({
      success: true,
      sale
    });
  } catch (error) {
    console.error('Error getting sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sale',
      error: error.message
    });
  }
};

/**
 * Get all sales for a customer
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getCustomerSales = async (req, res) => {
  try {
    const customerId = req.customer._id;
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate, 
      type, 
      status,
      merchantId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query
    const query = { customerId };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (merchantId) {
      query.merchantId = merchantId;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Get sales
    const sales = await Sale.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('merchantId', 'businessName');
    
    // Get total count
    const totalSales = await Sale.countDocuments(query);
    
    res.status(200).json({
      success: true,
      sales,
      pagination: {
        total: totalSales,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalSales / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting customer sales:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer sales',
      error: error.message
    });
  }
};

/**
 * Generate receipt for a sale
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.generateReceipt = async (req, res) => {
  try {
    const { saleId } = req.params;
    
    const sale = await Sale.findById(saleId)
      .populate('customerId', 'firstName lastName email customerCode')
      .populate('merchantId', 'businessName email locations');
    
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if user has permission to view this sale
    if (req.user.type === 'merchant' && sale.merchantId._id.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this sale' });
    }
    
    if (req.user.type === 'customer' && (!sale.customerId || sale.customerId._id.toString() !== req.customer._id.toString())) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this sale' });
    }
    
    // Find location
    const location = sale.merchantId.locations.find(loc => loc._id.toString() === sale.locationId.toString());
    
    // Generate receipt data
    const receipt = {
      saleNumber: sale.saleNumber,
      date: sale.createdAt,
      merchant: {
        name: sale.merchantId.businessName,
        email: sale.merchantId.email,
        location: location ? {
          name: location.name,
          address: location.address
        } : null
      },
      customer: sale.customerId ? {
        name: `${sale.customerId.firstName} ${sale.customerId.lastName}`,
        email: sale.customerId.email,
        customerCode: sale.customerId.customerCode
      } : null,
      type: sale.type,
      lineItems: sale.lineItems,
      subtotal: sale.subtotal,
      taxTotal: sale.taxTotal,
      discountTotal: sale.discountTotal,
      total: sale.total,
      payments: sale.payments,
      promoCode: sale.promoCode,
      cashier: {
        id: sale.cashierId,
        name: sale.cashierName
      }
    };
    
    // Update receipt URL if not already set
    if (!sale.receiptUrl) {
      // In a real implementation, this would generate a PDF and store it
      // For now, we'll just update a placeholder URL
      sale.receiptUrl = `/receipts/${sale._id}`;
      await sale.save();
    }
    
    res.status(200).json({
      success: true,
      receipt,
      receiptUrl: sale.receiptUrl
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate receipt',
      error: error.message
    });
  }
};

/**
 * Void a sale
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.voidSale = async (req, res) => {
  try {
    const { saleId } = req.params;
    const { reason } = req.body;
    
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    
    // Check if user has permission to void this sale
    if (req.user.type === 'merchant' && sale.merchantId.toString() !== req.merchant._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to void this sale' });
    }
    
    // Check if sale can be voided
    if (sale.status === 'completed' && sale.payments.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot void a completed sale with payments. Process a return instead.' 
      });
    }
    
    // Void the sale
    sale.status = 'voided';
    sale.notes = sale.notes ? `${sale.notes}\nVoided: ${reason}` : `Voided: ${reason}`;
    
    await sale.save();
    
    res.status(200).json({
      success: true,
      message: 'Sale voided successfully',
      sale
    });
  } catch (error) {
    console.error('Error voiding sale:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to void sale',
      error: error.message
    });
  }
};
