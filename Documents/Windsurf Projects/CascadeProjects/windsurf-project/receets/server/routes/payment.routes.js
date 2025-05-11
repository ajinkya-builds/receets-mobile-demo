const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Process Stripe payment
router.post('/stripe', authMiddleware.verifyToken, paymentController.processStripePayment);

// Process cash payment
router.post('/cash', authMiddleware.verifyToken, paymentController.processCashPayment);

// Process manual card payment
router.post('/card', authMiddleware.verifyToken, paymentController.processManualCardPayment);

// Process refund
router.post('/refund', authMiddleware.verifyToken, paymentController.processRefund);

module.exports = router;
