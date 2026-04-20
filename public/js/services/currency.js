// Currency preference (ISK/EUR) stored in localStorage, with a subscription
// so components can re-render when it changes.  ISK is the default; EUR is
// available per-product only when the product has a price_eur set — callers
// should fall back to ISK when a product lacks EUR pricing.

const KEY = 'ferdabox.currency';
const _listeners = new Set();

function _emit() {
  for (const fn of _listeners) {
    try { fn(); } catch (err) { console.error('[currency] listener error', err); }
  }
  window.dispatchEvent(new CustomEvent('currencychange'));
}

export function getCurrency() {
  const c = localStorage.getItem(KEY);
  return c === 'EUR' ? 'EUR' : 'ISK';
}

export function setCurrency(currency) {
  if (currency !== 'ISK' && currency !== 'EUR') return;
  if (getCurrency() === currency) return;
  localStorage.setItem(KEY, currency);
  _emit();
}

export function subscribe(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// Cross-tab sync
window.addEventListener('storage', (e) => {
  if (e.key === KEY) _emit();
});

// Formats a monetary amount in the chosen currency.  ISK is whole krónur
// (localised thousands separator + " kr."); EUR is two decimals with the €
// symbol.  The amount argument is always in the chosen currency — callers
// must pick the correct price_isk / price_eur field before invoking this.
export function formatMoney(amount, currency = getCurrency()) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '';
  if (currency === 'EUR') {
    return `€${n.toFixed(2)}`;
  }
  return `${n.toLocaleString('is-IS')} kr.`;
}

// Picks the price field matching the selected currency, falling back to ISK
// when the product has no price_eur (or when currency is explicitly ISK).
// Returns { amount, currency } — the currency may differ from the requested
// one if the product doesn't support it.
export function productPrice(product, requested = getCurrency()) {
  if (requested === 'EUR' && product.price_eur != null && product.price_eur !== '') {
    return { amount: Number(product.price_eur), currency: 'EUR' };
  }
  return { amount: Number(product.price), currency: 'ISK' };
}
