const express = require('express');
const router  = express.Router();
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../auth/middleware');
const { csrfProtect } = require('../middleware/csrf');

// All cart routes require authentication
router.use(requireAuth);

router.get('/',           cartController.getCart);
router.get('/count',      cartController.getCount);
router.post('/',          csrfProtect, cartController.addItem);
router.patch('/:itemId',  csrfProtect, cartController.updateItem);
router.delete('/:itemId', csrfProtect, cartController.removeItem);
router.delete('/',        csrfProtect, cartController.clearCart);

module.exports = router;
