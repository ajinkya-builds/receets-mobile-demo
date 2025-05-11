const Merchant = require('../models/merchant.model');
const Sale = require('../models/sale.model');
const bcrypt = require('bcrypt');

/**
 * Get merchant profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getMerchantProfile = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    
    const merchant = await Merchant.findById(merchantId).select('-password');
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    res.status(200).json({
      success: true,
      merchant
    });
  } catch (error) {
    console.error('Error getting merchant profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get merchant profile',
      error: error.message
    });
  }
};

/**
 * Update merchant profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateMerchantProfile = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const {
      businessName,
      phone,
      businessType,
      taxId,
      returnPeriod,
      settings
    } = req.body;
    
    const updateData = {};
    
    if (businessName) updateData.businessName = businessName;
    if (phone) updateData.phone = phone;
    if (businessType) updateData.businessType = businessType;
    if (taxId) updateData.taxId = taxId;
    if (returnPeriod) updateData.returnPeriod = returnPeriod;
    if (settings) updateData.settings = settings;
    
    const merchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Merchant profile updated successfully',
      merchant
    });
  } catch (error) {
    console.error('Error updating merchant profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update merchant profile',
      error: error.message
    });
  }
};

/**
 * Change merchant password
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.changePassword = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { currentPassword, newPassword } = req.body;
    
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    // Validate current password
    const isPasswordValid = await bcrypt.compare(currentPassword, merchant.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    merchant.password = hashedPassword;
    await merchant.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * Add a new location
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.addLocation = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { name, address } = req.body;
    
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    // Add new location
    merchant.locations.push({
      name,
      address,
      active: true
    });
    
    await merchant.save();
    
    res.status(201).json({
      success: true,
      message: 'Location added successfully',
      location: merchant.locations[merchant.locations.length - 1]
    });
  } catch (error) {
    console.error('Error adding location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add location',
      error: error.message
    });
  }
};

/**
 * Update a location
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateLocation = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { locationId } = req.params;
    const { name, address, active } = req.body;
    
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    // Find location
    const location = merchant.locations.id(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    // Update location
    if (name) location.name = name;
    if (address) location.address = address;
    if (active !== undefined) location.active = active;
    
    await merchant.save();
    
    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      location
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

/**
 * Delete a location
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.deleteLocation = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { locationId } = req.params;
    
    // Check if there are any sales for this location
    const salesCount = await Sale.countDocuments({ locationId });
    if (salesCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete location with existing sales. Consider deactivating it instead.'
      });
    }
    
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    // Find location
    const location = merchant.locations.id(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    // Remove location
    merchant.locations.pull(locationId);
    await merchant.save();
    
    res.status(200).json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message
    });
  }
};

/**
 * Get sales analytics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getSalesAnalytics = async (req, res) => {
  try {
    const merchantId = req.merchant._id;
    const { startDate, endDate, locationId } = req.query;
    
    // Build query
    const query = { merchantId };
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (locationId) {
      query.locationId = locationId;
    }
    
    // Get sales data
    const sales = await Sale.find(query);
    
    // Calculate analytics
    const totalSales = sales.filter(sale => sale.type === 'purchase').length;
    const totalReturns = sales.filter(sale => sale.type === 'return').length;
    
    const salesRevenue = sales
      .filter(sale => sale.type === 'purchase' && sale.status === 'completed')
      .reduce((sum, sale) => sum + sale.total, 0);
    
    const returnsAmount = sales
      .filter(sale => sale.type === 'return' && sale.status === 'completed')
      .reduce((sum, sale) => sum + Math.abs(sale.total), 0);
    
    const netRevenue = salesRevenue - returnsAmount;
    
    // Get payment method breakdown
    const paymentMethods = {};
    sales.forEach(sale => {
      sale.payments.forEach(payment => {
        if (!paymentMethods[payment.method]) {
          paymentMethods[payment.method] = 0;
        }
        paymentMethods[payment.method] += payment.amount;
      });
    });
    
    res.status(200).json({
      success: true,
      analytics: {
        totalSales,
        totalReturns,
        salesRevenue,
        returnsAmount,
        netRevenue,
        paymentMethods
      }
    });
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sales analytics',
      error: error.message
    });
  }
};
