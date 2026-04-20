const Order = require('../models/Order');
const Cart  = require('../models/Cart');
const { isConfigured: stripeIsConfigured } = require('../config/stripe');
const stripeService = require('../services/stripeService');
const { sendOrderReceipt } = require('../services/emailService');
const { SHIPPING_METHODS, getShippingPrice } = require('../config/shipping');
const { validateShippingAddress } = require('../middleware/validate');

const orderController = {
  async checkout(req, res, next) {
    try {
      const {
        name, email, phone, notes,
        shipping_method: shippingMethod = 'flat_rate',
        shipping_address: shippingAddress = null,
        // Legacy free-text address kept for backward compat: if a client still
        // sends `address` we'll store it alongside the structured JSON.
        address: legacyAddress = '',
      } = req.body;

      const errors = [];
      if (!name?.trim())  errors.push('name is required');
      if (!email?.trim()) errors.push('email is required');
      if (!SHIPPING_METHODS[shippingMethod]) {
        errors.push('shipping_method must be flat_rate or local_pickup');
      }

      const method = SHIPPING_METHODS[shippingMethod];
      if (method?.requiresAddress) {
        const addrErrors = validateShippingAddress(shippingAddress);
        errors.push(...addrErrors);
      }
      if (errors.length) return res.status(400).json({ error: errors.join('; '), code: 400 });

      const cartItems = await Cart.getByUser(req.user.id);
      if (!cartItems.length) {
        return res.status(400).json({ error: 'Cart is empty', code: 400 });
      }

      // This legacy endpoint charges ISK only (it doesn't touch Stripe).
      const shippingAmount = getShippingPrice(shippingMethod, 'ISK');
      // Derive a legacy-format address string for the existing shipping_address
      // column from the structured fields, falling back to the caller-supplied
      // free-text address when the method is local_pickup (no structured addr).
      const legacyAddrText = shippingAddress
        ? [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.postal, shippingAddress.country]
            .filter(Boolean).join('\n')
        : legacyAddress.trim() || '—';

      const order = await Order.create(
        req.user.id, cartItems,
        { name, email, phone, address: legacyAddrText, notes },
        { shippingMethod, shippingAmount, shippingAddressJson: method.requiresAddress ? shippingAddress : null },
      );
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

  // POST /api/v1/orders/stripe-checkout
  // Creates a pending order (no stock decrement yet) and a Stripe Checkout
  // Session.  Stock is decremented atomically by the webhook handler when
  // payment completes.  Returns 503 until STRIPE_SECRET_KEY is configured.
  async stripeCheckout(req, res, next) {
    try {
      if (!stripeIsConfigured()) {
        return res.status(503).json({ error: 'Stripe checkout is not configured', code: 503 });
      }

      const {
        name, email, phone, notes, currency = 'ISK',
        shipping_method: shippingMethod = 'flat_rate',
        shipping_address: shippingAddress = null,
        address: legacyAddress = '',
      } = req.body;

      const errors = [];
      if (!name?.trim())  errors.push('name is required');
      if (!email?.trim()) errors.push('email is required');
      if (!['ISK', 'EUR'].includes(currency)) errors.push('currency must be ISK or EUR');
      if (!SHIPPING_METHODS[shippingMethod]) {
        errors.push('shipping_method must be flat_rate or local_pickup');
      }
      const method = SHIPPING_METHODS[shippingMethod];
      if (method?.requiresAddress) {
        errors.push(...validateShippingAddress(shippingAddress));
      }
      if (errors.length) return res.status(400).json({ error: errors.join('; '), code: 400 });

      const cartItems = await Cart.getByUser(req.user.id);
      if (!cartItems.length) {
        return res.status(400).json({ error: 'Cart is empty', code: 400 });
      }

      const shippingAmount = getShippingPrice(shippingMethod, currency);
      const legacyAddrText = shippingAddress
        ? [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.postal, shippingAddress.country]
            .filter(Boolean).join('\n')
        : legacyAddress.trim() || '—';

      // createPending picks price (ISK) or price_eur (EUR) per item, rejects
      // EUR orders that include products without a price_eur, and stores the
      // currency on the order row so receipts/order-history render correctly.
      const order = await Order.createPending(
        req.user.id, cartItems,
        { name, email, phone, address: legacyAddrText, notes },
        {
          currency, shippingMethod, shippingAmount,
          shippingAddressJson: method.requiresAddress ? shippingAddress : null,
        },
      );

      const session = await stripeService.createCheckoutSession({
        items: order.items.map(it => ({
          productId: it.project_id,
          name: it.product_title,
          priceStripe: stripeService.toStripeAmount(it.unit_price, currency),
          quantity: it.quantity,
        })),
        currency,
        shippingAmount: stripeService.toStripeAmount(shippingAmount, currency),
        shippingMethodLabel: method.label,
        customerEmail: email,
        orderId: order.id,
      });

      await Order.setStripeSession(order.id, session.id);

      return res.status(201).json({ url: session.url, orderId: order.id, sessionId: session.id });
    } catch (err) {
      if (err.code === 'STRIPE_NOT_CONFIGURED') {
        return res.status(503).json({ error: 'Stripe checkout is not configured', code: 503 });
      }
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message, code: err.statusCode });
      next(err);
    }
  },

  // POST /api/v1/orders/stripe-webhook
  // Mounted in app.js with express.raw() BEFORE express.json() so the raw
  // body bytes are available for HMAC signature verification.  Stripe can't
  // produce a CSRF token, so this route is intentionally NOT CSRF-protected.
  async handleStripeWebhook(req, res) {
    if (!stripeIsConfigured()) {
      return res.status(503).send('Stripe webhook is not configured');
    }
    const sig = req.headers['stripe-signature'];
    if (!sig) return res.status(400).send('Missing stripe-signature header');
    if (!Buffer.isBuffer(req.body)) {
      console.error('[stripeWebhook] req.body is not a Buffer — raw body parser missing');
      return res.status(500).send('Webhook misconfigured: raw body required');
    }

    let event;
    try {
      event = stripeService.verifyWebhook(req.body, sig);
    } catch (err) {
      console.warn(`[stripeWebhook] Invalid signature: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const isNew = await Order.recordWebhookEvent(event.id);
    if (!isNew) return res.status(200).send('Already processed');

    try {
      if (event.type === 'checkout.session.completed') {
        await _handleCheckoutCompleted(event.data.object);
      }
      return res.status(200).send('OK');
    } catch (err) {
      console.error(`[stripeWebhook] Processing ${event.type} failed:`, err);
      // Return 200 so Stripe doesn't retry endlessly — we already recorded the
      // event.  The failure is logged for operator follow-up.
      return res.status(200).send('Processed with errors');
    }
  },
};

async function _handleCheckoutCompleted(session) {
  const order = await Order.findByStripeSessionId(session.id);
  if (!order) {
    console.warn(`[stripeWebhook] checkout.session.completed: order not found for session ${session.id}`);
    return;
  }
  if (order.status !== 'pending') return; // idempotent

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;

  const { transitioned, stockLost } = await Order.markPaidWithStock(order.id, paymentIntentId);

  if (stockLost) {
    console.warn(`[stripeWebhook] Stock race lost on order ${order.id}; refunding`);
    await Order.updateStatus(order.id, 'cancelled');
    if (paymentIntentId) {
      try { await stripeService.createRefund(paymentIntentId); }
      catch (refundErr) { console.error(`[stripeWebhook] Refund failed for order ${order.id}:`, refundErr); }
    }
    return;
  }

  if (transitioned) {
    const items = await Order.listItems(order.id);
    try { await sendOrderReceipt({ ...order, status: 'confirmed' }, items); }
    catch (emailErr) { console.error(`[stripeWebhook] Receipt email failed for order ${order.id}:`, emailErr); }
  }
}

module.exports = orderController;
