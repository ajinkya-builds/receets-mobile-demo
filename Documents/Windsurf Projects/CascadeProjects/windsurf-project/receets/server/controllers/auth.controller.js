const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Merchant = require('../models/merchant.model');
const Customer = require('../models/customer.model');
const { v4: uuidv4 } = require('uuid');

/**
 * Register a new merchant
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.registerMerchant = async (req, res) => {
  try {
    const {
      businessName,
      email,
      password,
      phone,
      businessType,
      taxId,
      location
    } = req.body;
    
    // Check if merchant already exists
    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new merchant with initial location
    const newMerchant = new Merchant({
      businessName,
      email,
      password: hashedPassword,
      phone,
      businessType,
      taxId,
      locations: location ? [{
        name: location.name,
        address: location.address
      }] : []
    });
    
    await newMerchant.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newMerchant._id, type: 'merchant' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Merchant registered successfully',
      token,
      merchant: {
        id: newMerchant._id,
        businessName: newMerchant.businessName,
        email: newMerchant.email,
        businessType: newMerchant.businessType,
        locations: newMerchant.locations
      }
    });
  } catch (error) {
    console.error('Error registering merchant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register merchant',
      error: error.message
    });
  }
};

/**
 * Login merchant
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.loginMerchant = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if merchant exists
    const merchant = await Merchant.findOne({ email });
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }
    
    // Check if merchant is active
    if (!merchant.active) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, merchant.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: merchant._id, type: 'merchant' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      merchant: {
        id: merchant._id,
        businessName: merchant.businessName,
        email: merchant.email,
        businessType: merchant.businessType,
        locations: merchant.locations,
        role: merchant.role
      }
    });
  } catch (error) {
    console.error('Error logging in merchant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};

/**
 * Register a new customer
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.registerCustomer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone
    } = req.body;
    
    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate unique customer code
    const customerCode = uuidv4().substring(0, 8).toUpperCase();
    
    // Create new customer
    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      customerCode
    });
    
    await newCustomer.save();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newCustomer._id, type: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      token,
      customer: {
        id: newCustomer._id,
        firstName: newCustomer.firstName,
        lastName: newCustomer.lastName,
        email: newCustomer.email,
        customerCode: newCustomer.customerCode
      }
    });
  } catch (error) {
    console.error('Error registering customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register customer',
      error: error.message
    });
  }
};

/**
 * Login customer
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if customer exists
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Check if customer is active
    if (!customer.active) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }
    
    // Validate password
    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: customer._id, type: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      customer: {
        id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        customerCode: customer.customerCode
      }
    });
  } catch (error) {
    console.error('Error logging in customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};
