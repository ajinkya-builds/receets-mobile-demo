const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Merchant = require('../models/merchant.model');

/**
 * Generate a unique QR code for a merchant location
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.generateQRCode = async (req, res) => {
  try {
    const { merchantId, locationId } = req.params;
    const { type } = req.body; // 'purchase' or 'return'
    
    // Validate merchant and location
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    const location = merchant.locations.id(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    // Generate a unique identifier for this QR code
    const uniqueId = uuidv4();
    
    // Create QR code data with merchant, location, and workflow type
    const qrCodeData = JSON.stringify({
      merchantId,
      locationId,
      type: type || 'purchase', // Default to purchase if not specified
      code: uniqueId
    });
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData);
    
    // Update location with QR code
    location.qrCode = uniqueId;
    await merchant.save();
    
    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      qrCodeId: uniqueId,
      data: {
        merchantId,
        locationId,
        type: type || 'purchase'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message
    });
  }
};

/**
 * Get QR code for a merchant location
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getQRCode = async (req, res) => {
  try {
    const { merchantId, locationId } = req.params;
    
    // Validate merchant and location
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    const location = merchant.locations.id(locationId);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    if (!location.qrCode) {
      return res.status(404).json({ success: false, message: 'QR code not found for this location' });
    }
    
    // Create QR code data
    const qrCodeData = JSON.stringify({
      merchantId,
      locationId,
      code: location.qrCode
    });
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData);
    
    res.status(200).json({
      success: true,
      qrCode: qrCodeDataUrl,
      qrCodeId: location.qrCode
    });
  } catch (error) {
    console.error('Error retrieving QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve QR code',
      error: error.message
    });
  }
};

/**
 * Validate QR code when scanned
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.validateQRCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'QR code is required' });
    }
    
    // Find merchant location with this QR code
    const merchant = await Merchant.findOne({ 'locations.qrCode': code });
    
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Invalid QR code' });
    }
    
    // Find the specific location
    const location = merchant.locations.find(loc => loc.qrCode === code);
    
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    
    // Check if location is active
    if (!location.active) {
      return res.status(403).json({ success: false, message: 'This location is inactive' });
    }
    
    res.status(200).json({
      success: true,
      merchantId: merchant._id,
      merchantName: merchant.businessName,
      locationId: location._id,
      locationName: location.name
    });
  } catch (error) {
    console.error('Error validating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate QR code',
      error: error.message
    });
  }
};
