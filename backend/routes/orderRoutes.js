// backend/routes/orderRoutes.js (Versi Tanpa Middleware)
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// 1. Rute /layanan WAJIB ditaruh paling atas agar tidak tertimpa rute '/'
router.get('/layanan', orderController.getLayanan);

// 2. Rute utama /api/orders untuk GET riwayat & POST pesanan baru
router.get('/', orderController.getOrderHistory);
router.post('/', orderController.createOrder);

// PATCH /api/orders/:id/status - Update Status Cucian
router.patch('/:id/status', orderController.updateLaundryStatus);

module.exports = router;