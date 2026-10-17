const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/export', reportController.exportFinancialReport);
router.get('/', reportController.getFinancialReport);

module.exports = router;