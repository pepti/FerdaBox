// ISK/EUR toggle backed by the currency service.  Re-paints itself when the
// user flips the toggle in another tab (via the storage event → subscribe).
import * as currency from '../services/currency.js';

export class CurrencySelector {
  constructor({ onChange } = {}) {
    this._onChange = onChange || (() => {});
    this._el = null;
    this._unsub = null;
  }

  render() {
    const wrap = document.createElement('div');
    wrap.className = 'currency-selector';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Currency selector');
    wrap.innerHTML = `
      <button type="button" class="currency-selector__btn" data-cur="ISK" data-testid="currency-isk">ISK</button>
      <button type="button" class="currency-selector__btn" data-cur="EUR" data-testid="currency-eur">EUR</button>
    `;
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cur]');
      if (!btn) return;
      currency.setCurrency(btn.dataset.cur);
      this._onChange(currency.getCurrency());
    });

    this._el = wrap;
    this._paint();
    this._unsub = currency.subscribe(() => this._paint());
    return wrap;
  }

  _paint() {
    if (!this._el) return;
    const cur = currency.getCurrency();
    for (const btn of this._el.querySelectorAll('[data-cur]')) {
      const active = btn.dataset.cur === cur;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  destroy() {
    if (this._unsub) this._unsub();
    this._unsub = null;
  }
}
