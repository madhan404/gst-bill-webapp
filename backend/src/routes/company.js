const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const auth = require('../middleware/auth');

router.get('/', auth, companyController.getCompany);
router.post('/', auth, companyController.createOrUpdateCompany);

module.exports = router; 