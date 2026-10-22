// backend/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.get('/', employeeController.getEmployees);
router.put('/:id/approve', employeeController.approveEmployee);
router.delete('/:id/reject', employeeController.rejectEmployee);
router.put('/:id/toggle-status', employeeController.toggleEmployeeStatus);

module.exports = router;