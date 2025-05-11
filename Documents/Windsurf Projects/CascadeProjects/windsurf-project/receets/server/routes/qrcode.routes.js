const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrcode.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Generate QR code for a merchant location
router.post('/generate/:merchantId/:locationId', authMiddleware.verifyToken, authMiddleware.isMerchant, qrCodeController.generateQRCode);

// Get QR code for a merchant location
router.get('/:merchantId/:locationId', authMiddleware.verifyToken, authMiddleware.isMerchant, qrCodeController.getQRCode);

// Validate QR code when scanned
router.post('/validate', qrCodeController.validateQRCode);

module.exports = router;
