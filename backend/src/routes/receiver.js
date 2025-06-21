const express = require('express');
const router = express.Router();
const receiverController = require('../controllers/receiverController');
const auth = require('../middleware/auth');

router.get('/', auth, receiverController.getReceivers);
router.post('/', auth, receiverController.addReceiver);
router.put('/:id', auth, receiverController.updateReceiver);
router.delete('/:id', auth, receiverController.deleteReceiver);

module.exports = router; 