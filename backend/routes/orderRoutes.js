const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Rute /layanan 
router.get('/layanan', orderController.getLayanan);

// Rute utama /api/orders untuk GET riwayat & POST pesanan baru
router.get('/', orderController.getOrderHistory);
router.post('/', orderController.createOrder);

// PATCH /api/orders/:id/status - Update Status Cucian
router.patch('/:id/status', orderController.updateLaundryStatus);

module.exports = router;