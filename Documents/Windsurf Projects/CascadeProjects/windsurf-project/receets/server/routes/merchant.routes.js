const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchant.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get merchant profile
router.get('/profile', authMiddleware.verifyToken, authMiddleware.isMerchant, merchantController.getMerchantProfile);

// Update merchant profile
router.put('/profile', authMiddleware.verifyToken, authMiddleware.isMerchant, merchantController.updateMerchantProfile);

// Change merchant password
router.put('/password', authMiddleware.verifyToken, authMiddleware.isMerchant, merchantController.changePassword);

// Location management
router.post('/locations', authMiddleware.verifyToken, authMiddleware.isMerchant, merchantController.addLocation);
router.put('/locations/:locationId', authMiddleware.verifyToken, authMiddleware.isMerchant, merchantController.updateLocation);
router.delete('/locations/:locationId', authMiddleware.verifyToken, authMiddleware.isMerchant, merchantController.deleteLocation);

// Analytics
router.get('/analytics', authMiddleware.verifyToken, authMiddleware.isMerchant, merchantController.getSalesAnalytics);

module.exports = router;
