const jwt = require('jsonwebtoken');
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');

/**
 * Verify JWT token middleware
 */
exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Check if user is a merchant
 */
exports.isMerchant = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id || req.user.type !== 'merchant') {
      return res.status(403).json({ success: false, message: 'Access denied. Merchant authorization required' });
    }
    
    const merchant = await Merchant.findById(req.user.id);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    if (!merchant.active) {
      return res.status(403).json({ success: false, message: 'Merchant account is inactive' });
    }
    
    req.merchant = merchant;
    next();
  } catch (error) {
    console.error('Error in merchant authorization:', error);
    return res.status(500).json({ success: false, message: 'Authorization error', error: error.message });
  }
};

/**
 * Check if user is a customer
 */
exports.isCustomer = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id || req.user.type !== 'customer') {
      return res.status(403).json({ success: false, message: 'Access denied. Customer authorization required' });
    }
    
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    if (!customer.active) {
      return res.status(403).json({ success: false, message: 'Customer account is inactive' });
    }
    
    req.customer = customer;
    next();
  } catch (error) {
    console.error('Error in customer authorization:', error);
    return res.status(500).json({ success: false, message: 'Authorization error', error: error.message });
  }
};

/**
 * Check if user is a merchant admin
 */
exports.isMerchantAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id || req.user.type !== 'merchant') {
      return res.status(403).json({ success: false, message: 'Access denied. Merchant admin authorization required' });
    }
    
    const merchant = await Merchant.findById(req.user.id);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    if (!merchant.active) {
      return res.status(403).json({ success: false, message: 'Merchant account is inactive' });
    }
    
    if (merchant.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required' });
    }
    
    req.merchant = merchant;
    next();
  } catch (error) {
    console.error('Error in merchant admin authorization:', error);
    return res.status(500).json({ success: false, message: 'Authorization error', error: error.message });
  }
};
