const express = require('express');
const router = express.Router();
const posController = require('../controllers/pos.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Initiate a new sale from POS
router.post('/sales', authMiddleware.verifyToken, posController.initiateSale);

// Update an existing sale
router.put('/sales/:saleId', authMiddleware.verifyToken, posController.updateSale);

// Process payment for a sale
router.post('/sales/:saleId/payment', authMiddleware.verifyToken, posController.processPayment);

// Get eligible returns for a customer
router.get('/returns/eligible', authMiddleware.verifyToken, posController.getEligibleReturns);

// Process a return
router.post('/returns', authMiddleware.verifyToken, posController.processReturn);

module.exports = router;
