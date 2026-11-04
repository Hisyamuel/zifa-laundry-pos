const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

router.get('/', serviceController.getServices);          // READ
router.post('/', serviceController.createService);       // CREATE
router.put('/:id', serviceController.updateService);     // UPDATE
router.delete('/:id', serviceController.deleteService);  // DELETE

module.exports = router;