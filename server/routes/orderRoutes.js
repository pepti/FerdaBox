const express = require('express');
const router  = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth }  = require('../auth/middleware');
const { requireRole }  = require('../auth/roles');
const { csrfProtect }  = require('../middleware/csrf');

// User routes (authenticated)
router.post('/',                 requireAuth, csrfProtect, orderController.checkout);
router.post('/stripe-checkout',  requireAuth, csrfProtect, orderController.stripeCheckout);
router.get('/',                  requireAuth, orderController.getOrders);
router.get('/:id',               requireAuth, orderController.getOrder);

// Admin routes
router.get('/admin/all',      requireAuth, requireRole('admin'), orderController.getAllOrders);
router.patch('/admin/:id',    requireAuth, requireRole('admin'), csrfProtect, orderController.updateStatus);

module.exports = router;
