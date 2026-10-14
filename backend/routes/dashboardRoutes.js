// backend/routes/dashboardRoutes.js (Express.js)
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Menghubungkan path URL '/' (relatif terhadap /api/dashboard) dengan fungsi getDashboardStats
router.get('/', dashboardController.getDashboardStats);

module.exports = router;