const Order = require('../models/Order');
const Cart  = require('../models/Cart');

const orderController = {
  async checkout(req, res, next) {
    try {
      const { name, email, phone, address, notes } = req.body;
      const errors = [];
      if (!name?.trim())    errors.push('name is required');
      if (!email?.trim())   errors.push('email is required');
      if (!address?.trim()) errors.push('shipping address is required');
      if (errors.length) return res.status(400).json({ error: errors.join('; '), code: 400 });

      const cartItems = await Cart.getByUser(req.user.id);
      if (!cartItems.length) {
        return res.status(400).json({ error: 'Cart is empty', code: 400 });
      }

      const order = await Order.create(req.user.id, cartItems, { name, email, phone, address, notes });
      res.status(201).json(order);
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.statusCode });
      next(err);
    }
  },

  async getOrders(req, res, next) {
    try {
      const orders = await Order.findByUser(req.user.id);
      res.json(orders);
    } catch (err) { next(err); }
  },

  async getOrder(req, res, next) {
    try {
      const order = await Order.findById(req.params.id, req.user.id);
      if (!order) return res.status(404).json({ error: 'Order not found', code: 404 });
      res.json(order);
    } catch (err) { next(err); }
  },

  // Admin: list all orders
  async getAllOrders(req, res, next) {
    try {
      const { status, limit, offset } = req.query;
      const orders = await Order.findAll({ status, limit, offset });
      res.json(orders);
    } catch (err) { next(err); }
  },

  // Admin: update order status
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const valid = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!valid.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}`, code: 400 });
      }
      const order = await Order.updateStatus(req.params.id, status);
      if (!order) return res.status(404).json({ error: 'Order not found', code: 404 });
      res.json(order);
    } catch (err) { next(err); }
  },
};

module.exports = orderController;
