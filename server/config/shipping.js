// Shipping methods for the shop.  Simple MVP: two hard-coded options.
// Prices are stored as DECIMAL(10,2) on the order row; this module returns
// per-currency shipping cost in the same unit the front-end/Stripe expect:
//   ISK: whole krónur (no subunit)
//   EUR: euros with two decimals (e.g. 19.00)
// Override via env vars SHIPPING_FLAT_RATE_ISK / SHIPPING_FLAT_RATE_EUR.

function parseAmount(name, fallback) {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

const FLAT_ISK = parseAmount('SHIPPING_FLAT_RATE_ISK', 2500);
const FLAT_EUR = parseAmount('SHIPPING_FLAT_RATE_EUR', 19.00);

const SHIPPING_METHODS = {
  flat_rate: {
    id: 'flat_rate',
    label: 'Shipping',
    priceIsk: FLAT_ISK,
    priceEur: FLAT_EUR,
    requiresAddress: true,
  },
  local_pickup: {
    id: 'local_pickup',
    label: 'Local pickup',
    priceIsk: 0,
    priceEur: 0,
    requiresAddress: false,
  },
};

function getShippingPrice(method, currency) {
  const m = SHIPPING_METHODS[method];
  if (!m) throw new Error(`Unknown shipping method: ${method}`);
  if (currency === 'ISK') return m.priceIsk;
  if (currency === 'EUR') return m.priceEur;
  throw new Error(`Unknown currency: ${currency}`);
}

module.exports = { SHIPPING_METHODS, getShippingPrice };
