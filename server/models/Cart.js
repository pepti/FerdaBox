const db = require('../config/database');

class Cart {
  static async getByUser(userId) {
    const { rows } = await db.query(
      `SELECT ci.id, ci.project_id, ci.quantity, ci.created_at,
              p.title, p.price, p.stock_quantity, p.image_url, p.status
         FROM cart_items ci
         JOIN projects p ON p.id = ci.project_id
        WHERE ci.user_id = $1
        ORDER BY ci.created_at ASC`,
      [userId]
    );
    return rows;
  }

  static async addItem(userId, projectId, quantity = 1) {
    const { rows } = await db.query(
      `INSERT INTO cart_items (user_id, project_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, project_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING id, project_id, quantity, created_at`,
      [userId, Number(projectId), Number(quantity)]
    );
    return rows[0];
  }

  static async updateQuantity(userId, itemId, quantity) {
    const { rows } = await db.query(
      `UPDATE cart_items SET quantity = $1
       WHERE id = $2 AND user_id = $3
       RETURNING id, project_id, quantity, created_at`,
      [Number(quantity), Number(itemId), userId]
    );
    return rows[0] || null;
  }

  static async removeItem(userId, itemId) {
    const { rowCount } = await db.query(
      `DELETE FROM cart_items WHERE id = $1 AND user_id = $2`,
      [Number(itemId), userId]
    );
    return rowCount > 0;
  }

  static async clear(userId) {
    await db.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
  }

  static async count(userId) {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(quantity), 0)::int AS count FROM cart_items WHERE user_id = $1`,
      [userId]
    );
    return rows[0].count;
  }
}

module.exports = Cart;
