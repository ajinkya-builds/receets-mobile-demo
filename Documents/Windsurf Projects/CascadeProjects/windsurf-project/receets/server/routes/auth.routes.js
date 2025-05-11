const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Merchant authentication routes
router.post('/merchants/register', authController.registerMerchant);
router.post('/merchants/login', authController.loginMerchant);

// Customer authentication routes
router.post('/customers/register', authController.registerCustomer);
router.post('/customers/login', authController.loginCustomer);

module.exports = router;
