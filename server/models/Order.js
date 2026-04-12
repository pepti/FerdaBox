const db = require('../config/database');

const ORDER_COLUMNS = 'id, user_id, status, total_price, customer_name, customer_email, customer_phone, shipping_address, notes, created_at, updated_at';
const ITEM_COLUMNS  = 'id, order_id, project_id, quantity, unit_price, product_title';

class Order {
  // Atomic checkout: create order + items + decrement stock, all in one transaction
  static async create(userId, cartItems, shippingInfo) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Verify stock and lock rows
      for (const item of cartItems) {
        const { rows } = await client.query(
          `SELECT id, title, price, stock_quantity, status
             FROM projects WHERE id = $1 FOR UPDATE`,
          [item.project_id]
        );
        const product = rows[0];
        if (!product) throw Object.assign(new Error(`Product ${item.project_id} not found`), { statusCode: 404 });
        if (product.status !== 'active') throw Object.assign(new Error(`${product.title} is not available`), { statusCode: 400 });
        if (product.stock_quantity < item.quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${product.title} (available: ${product.stock_quantity})`), { statusCode: 400 });
        }
        item._price = product.price;
        item._title = product.title;
      }

      const totalPrice = cartItems.reduce((sum, i) => sum + Number(i._price) * i.quantity, 0);

      // Create order
      const { rows: orderRows } = await client.query(
        `INSERT INTO orders (user_id, total_price, customer_name, customer_email, customer_phone, shipping_address, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING ${ORDER_COLUMNS}`,
        [userId, totalPrice, shippingInfo.name, shippingInfo.email, shippingInfo.phone || null,
         shippingInfo.address, shippingInfo.notes || null]
      );
      const order = orderRows[0];

      // Create order items + decrement stock
      for (const item of cartItems) {
        await client.query(
          `INSERT INTO order_items (order_id, project_id, quantity, unit_price, product_title)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.project_id, item.quantity, item._price, item._title]
        );
        await client.query(
          `UPDATE projects SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
          [item.quantity, item.project_id]
        );
      }

      // Clear user's cart
      await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

      await client.query('COMMIT');

      // Fetch order items to return
      const { rows: items } = await client.query(
        `SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_id = $1 ORDER BY id`,
        [order.id]
      );
      order.items = items;
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async findByUser(userId) {
    const { rows } = await db.query(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async findById(orderId, userId) {
    const { rows } = await db.query(
      `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1 AND user_id = $2`,
      [Number(orderId), userId]
    );
    if (!rows[0]) return null;
    const order = rows[0];
    const { rows: items } = await db.query(
      `SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_id = $1 ORDER BY id`,
      [order.id]
    );
    order.items = items;
    return order;
  }

  static async updateStatus(orderId, status) {
    const { rows } = await db.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING ${ORDER_COLUMNS}`,
      [status, Number(orderId)]
    );
    return rows[0] || null;
  }

  static async findAll(filters = {}) {
    const { status, limit = 50, offset = 0 } = filters;
    const conditions = [];
    const params = [];
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(Number(limit));
    params.push(Number(offset));
    const { rows } = await db.query(
      `SELECT ${ORDER_COLUMNS} FROM orders ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows;
  }
}

module.exports = Order;
