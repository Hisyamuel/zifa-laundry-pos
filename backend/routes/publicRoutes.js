const express = require('express');
const router = express.Router();
const { getServices } = require('../controllers/serviceController');
const { trackingLimiter, trackOrder } = require('../controllers/trackingController');

// Rute Publik: Mengambil Katalog Layanan 
router.get('/services', getServices);

// Rute Publik Terlindungi: Melacak Pesanan
router.get('/tracking/:resi', trackingLimiter, trackOrder);

module.exports = router;