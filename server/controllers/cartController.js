const Cart = require('../models/Cart');

const cartController = {
  async getCart(req, res, next) {
    try {
      const items = await Cart.getByUser(req.user.id);
      const count = items.reduce((sum, i) => sum + i.quantity, 0);
      const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
      res.json({ items, count, total });
    } catch (err) { next(err); }
  },

  async addItem(req, res, next) {
    try {
      const { project_id, quantity = 1 } = req.body;
      if (!project_id) return res.status(400).json({ error: 'project_id is required', code: 400 });
      if (!Number.isInteger(Number(quantity)) || quantity < 1) {
        return res.status(400).json({ error: 'quantity must be a positive integer', code: 400 });
      }
      const item = await Cart.addItem(req.user.id, project_id, quantity);
      res.status(201).json(item);
    } catch (err) { next(err); }
  },

  async updateItem(req, res, next) {
    try {
      const { quantity } = req.body;
      if (!Number.isInteger(Number(quantity)) || quantity < 1) {
        return res.status(400).json({ error: 'quantity must be a positive integer', code: 400 });
      }
      const item = await Cart.updateQuantity(req.user.id, req.params.itemId, quantity);
      if (!item) return res.status(404).json({ error: 'Cart item not found', code: 404 });
      res.json(item);
    } catch (err) { next(err); }
  },

  async removeItem(req, res, next) {
    try {
      const removed = await Cart.removeItem(req.user.id, req.params.itemId);
      if (!removed) return res.status(404).json({ error: 'Cart item not found', code: 404 });
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async clearCart(req, res, next) {
    try {
      await Cart.clear(req.user.id);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async getCount(req, res, next) {
    try {
      const count = await Cart.count(req.user.id);
      res.json({ count });
    } catch (err) { next(err); }
  },
};

module.exports = cartController;
