const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Merchant routes
router.get('/merchant', authMiddleware.verifyToken, authMiddleware.isMerchant, salesController.getMerchantSales);

// Customer routes
router.get('/customer', authMiddleware.verifyToken, authMiddleware.isCustomer, salesController.getCustomerSales);

// Common routes
router.get('/:saleId', authMiddleware.verifyToken, salesController.getSale);
router.get('/:saleId/receipt', authMiddleware.verifyToken, salesController.generateReceipt);
router.put('/:saleId/void', authMiddleware.verifyToken, authMiddleware.isMerchant, salesController.voidSale);

module.exports = router;
