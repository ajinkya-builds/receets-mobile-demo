# Receets

A POS-integrated checkout and returns system for merchants with real-time synchronization to the Receets mobile app.

## Project Structure

- `server/` - Backend API and POS integration
- `client/` - Customer-facing mobile app (React Native)
- `admin/` - Merchant admin portal (React)
- `pos-module/` - POS integration module

## Features

- [x] QR Code Generation System
  - Unique QR codes per merchant account + location
  - Trigger correct POS workflow (purchase/return) when scanned

- [x] POS Integration
  - Fetch historical sales from merchant database
  - Display returns eligible within configurable window
  - API-driven sale initiation/parking
  - Real-time updates to Receets app

- [x] Return Workflow
  - Physical or digital item scanning
  - Support for negative quantities in sales orders
  - Real-time sync with Receets

- [x] Payment Gateway
  - Multiple payment methods (Receets Pay, Apple/Google Pay, cash, manual card)
  - Receipt generation post-payment

- [x] Customer Interaction
  - Review/edit sales (quantity, promo codes)
  - Cashier approval for changes

- [x] Admin Portal
  - Merchant configuration (return periods, QR codes, system settings)
  - Role-based access
  - Data management options

- [x] Real-Time Synchronization
  - Partial updates during transactions
  - Full sync upon completion

## Setup

1. Clone the repository
2. Install all dependencies:
   ```bash
   npm run install:all
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```
4. Start all development servers:
   ```bash
   npm run dev:all
   ```

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Frontend**: React, React Native
- **Authentication**: JWT, bcrypt
- **Payment Processing**: Stripe
- **Real-time Communication**: Socket.io
- **QR Code**: qrcode

## API Documentation

API documentation is available at `/api-docs` when the server is running.

## Testing

Run tests with:
```bash
npm test
```
