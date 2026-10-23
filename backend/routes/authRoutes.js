const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rute untuk POST /api/auth/login dan POST /api/auth/register
router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;