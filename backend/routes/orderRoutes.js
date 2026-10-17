// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
// const requireRole = require('../middlewares/roleMiddleware'); // Opsional jika Anda sudah membuat middleware auth

// GET /api/orders
// Anda bisa menambahkan middleware di sini nanti: router.get('/', requireRole(['Owner', 'Employee']), orderController.getOrderHistory);
router.get('/', orderController.getOrderHistory);

module.exports = router;