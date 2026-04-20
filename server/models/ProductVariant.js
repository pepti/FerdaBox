// Repository for product_variants — per-SKU stock + optional price override.
// Parameterised queries throughout (A03: prevents SQL injection).
const db = require('../config/database');

const COLUMNS = 'id, project_id, sku, attributes, price, price_eur, stock_quantity, active, sort_order, created_at, updated_at';

class ProductVariant {
  // ── READ ───────────────────────────────────────────────────────────────────

  static async listForProject(projectId, { activeOnly = false } = {}) {
    const where = activeOnly ? 'AND active = TRUE' : '';
    const { rows } = await db.query(
      `SELECT ${COLUMNS} FROM product_variants
        WHERE project_id = $1 ${where}
        ORDER BY sort_order ASC, id ASC`,
      [Number(projectId)]
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await db.query(
      `SELECT ${COLUMNS} FROM product_variants WHERE id = $1`,
      [Number(id)]
    );
    return rows[0] || null;
  }

  static async findByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const { rows } = await db.query(
      `SELECT ${COLUMNS} FROM product_variants WHERE id = ANY($1::int[])`,
      [ids.map(Number)]
    );
    return rows;
  }

  // ── WRITE ──────────────────────────────────────────────────────────────────

  static async create(data) {
    const {
      project_id, sku, attributes,
      price = null, price_eur = null,
      stock_quantity = 0, active = true, sort_order = 0,
    } = data;
    const attrsJson = typeof attributes === 'string' ? attributes : JSON.stringify(attributes);
    const { rows } = await db.query(
      `INSERT INTO product_variants
         (project_id, sku, attributes, price, price_eur, stock_quantity, active, sort_order)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)
       RETURNING ${COLUMNS}`,
      [
        Number(project_id), String(sku), attrsJson,
        price === null || price === undefined || price === '' ? null : Number(price),
        price_eur === null || price_eur === undefined || price_eur === '' ? null : Number(price_eur),
        Number(stock_quantity), Boolean(active), Number(sort_order),
      ]
    );
    return rows[0];
  }

  static async update(id, data) {
    const allowed = ['sku', 'attributes', 'price', 'price_eur', 'stock_quantity', 'active', 'sort_order'];
    const numeric = new Set(['price', 'price_eur', 'stock_quantity', 'sort_order']);
    const bool    = new Set(['active']);

    const sets = [];
    const params = [];
    for (const f of allowed) {
      if (data[f] === undefined) continue;
      let v = data[f];
      if (f === 'attributes' && typeof v !== 'string') v = JSON.stringify(v);
      if (numeric.has(f)) v = v === null || v === '' ? null : Number(v);
      if (bool.has(f))    v = Boolean(v);
      params.push(v);
      // attributes needs an explicit ::jsonb cast
      sets.push(f === 'attributes' ? `${f} = $${params.length}::jsonb` : `${f} = $${params.length}`);
    }
    if (sets.length === 0) return ProductVariant.findById(id);
    params.push(Number(id));
    const { rows } = await db.query(
      `UPDATE product_variants SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING ${COLUMNS}`,
      params
    );
    return rows[0] || null;
  }

  static async remove(id) {
    const { rowCount } = await db.query(
      `DELETE FROM product_variants WHERE id = $1`,
      [Number(id)]
    );
    return rowCount > 0;
  }

  // Atomic stock decrement — mirrors the Project-level contract used during
  // checkout.  Returns new stock on success, null when the guard failed
  // (insufficient stock → caller refunds or fails the order).
  static async decrementStockAtomic(client, variantId, qty) {
    const { rows } = await client.query(
      `UPDATE product_variants SET stock_quantity = stock_quantity - $1
        WHERE id = $2 AND stock_quantity >= $1
        RETURNING stock_quantity`,
      [Number(qty), Number(variantId)]
    );
    return rows[0]?.stock_quantity ?? null;
  }

  // Sum of active variant stock for a product.  Useful for driving aggregate
  // "in stock / out of stock" badges on grid tiles when a product uses
  // variants (the parent's own stock_quantity is then denormalised or zero).
  static async totalStockForProject(projectId) {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(stock_quantity), 0)::int AS total
         FROM product_variants
        WHERE project_id = $1 AND active = TRUE`,
      [Number(projectId)]
    );
    return rows[0].total;
  }
}

module.exports = ProductVariant;
