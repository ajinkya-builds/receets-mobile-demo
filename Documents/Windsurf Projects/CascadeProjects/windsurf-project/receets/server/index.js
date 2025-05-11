const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const merchantRoutes = require('./routes/merchant.routes');
const posRoutes = require('./routes/pos.routes');
const authRoutes = require('./routes/auth.routes');
const qrCodeRoutes = require('./routes/qrcode.routes');
const paymentRoutes = require('./routes/payment.routes');
const salesRoutes = require('./routes/sales.routes');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle real-time sale updates
  socket.on('sale_update', (data) => {
    // Broadcast to all connected clients except sender
    socket.broadcast.emit('sale_updated', data);
  });
  
  // Handle payment status updates
  socket.on('payment_status', (data) => {
    socket.broadcast.emit('payment_updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/merchants', merchantRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/qrcodes', qrCodeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sales', salesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
