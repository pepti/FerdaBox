import { cartApi } from '../api/projectApi.js';
import { escHtml }  from '../utils/escHtml.js';
import { isAuthenticated } from '../services/auth.js';
import { t } from '../i18n/index.js';
import * as currency from '../services/currency.js';
import { CurrencySelector } from '../components/CurrencySelector.js';

// Pick per-item price based on the selected currency with ISK fallback when
// price_eur is not set on a product.
function itemPrice(item, cur) {
  if (cur === 'EUR' && item.price_eur != null && item.price_eur !== '') {
    return { amount: Number(item.price_eur), currency: 'EUR' };
  }
  return { amount: Number(item.price), currency: 'ISK' };
}

export class CartView {
  constructor() {
    this._currencySelector = null;
    this._unsubCurrency = null;
  }

  async render() {
    const view = document.createElement('div');
    view.className = 'view cart-view';

    if (!isAuthenticated()) {
      view.innerHTML = `
        <div class="cart-view__empty">
          <h1>${t('cart.heading')}</h1>
          <p>${t('cart.signInToView')}</p>
        </div>`;
      return view;
    }

    try {
      const { items } = await cartApi.getCart();

      if (!items.length) {
        view.innerHTML = `
          <div class="cart-view__empty">
            <h1>${t('cart.heading')}</h1>
            <p>${t('cart.empty')}</p>
            <a href="#/projects" class="btn btn--primary">${t('cart.browseProducts')}</a>
          </div>`;
        return view;
      }

      this._items = items;
      this._bindActions(view); // delegated listener, survives innerHTML rewrites
      this._renderInner(view);

      // Re-render in place when the user flips the currency toggle.
      this._unsubCurrency = currency.subscribe(() => this._renderInner(view));
    } catch (err) {
      view.innerHTML = `<div class="cart-view__empty"><h1>${t('cart.heading')}</h1><p>${t('cart.loadError')} ${escHtml(err.message)}</p></div>`;
    }

    return view;
  }

  _renderInner(view) {
    const cur = currency.getCurrency();
    let computedTotal = 0;

    const rows = this._items.map(item => {
      const { amount, currency: lineCur } = itemPrice(item, cur);
      const lineSubtotal = amount * Number(item.quantity);
      // Only add to total when the line's currency matches the selected one —
      // lines with no EUR price fall back to ISK and are summed separately below.
      if (lineCur === cur) computedTotal += lineSubtotal;
      return `
        <div class="cart-item" data-item-id="${item.id}">
          <img class="cart-item__img" src="${escHtml(item.image_url || 'https://placehold.co/100x100/1a1a2e/c9a84c?text=Product')}"
               alt="${escHtml(item.title)}" width="100" height="100">
          <div class="cart-item__info">
            <h3 class="cart-item__title">${escHtml(item.title)}</h3>
            <p class="cart-item__price">${currency.formatMoney(amount, lineCur)}</p>
          </div>
          <div class="cart-item__qty">
            <button class="cart-item__qty-btn" data-action="decrease" aria-label="${t('cart.decrease')}">-</button>
            <span class="cart-item__qty-val">${item.quantity}</span>
            <button class="cart-item__qty-btn" data-action="increase" aria-label="${t('cart.increase')}">+</button>
          </div>
          <div class="cart-item__subtotal">${currency.formatMoney(lineSubtotal, lineCur)}</div>
          <button class="cart-item__remove" data-action="remove" aria-label="${t('cart.remove')}">&times;</button>
        </div>`;
    }).join('');

    view.innerHTML = `
      <div class="cart-view__inner">
        <div class="cart-view__header">
          <h1>${t('cart.heading')}</h1>
          <div class="cart-view__currency" id="cart-currency"></div>
        </div>
        <div class="cart-items">${rows}</div>
        <div class="cart-summary">
          <div class="cart-summary__total">
            <span>${t('cart.total')}</span>
            <strong>${currency.formatMoney(computedTotal, cur)}</strong>
          </div>
          <a href="#/checkout" class="btn btn--primary btn--lg">${t('cart.checkout')}</a>
          <a href="#/projects" class="btn btn--ghost">${t('cart.continueShopping')}</a>
        </div>
      </div>`;

    // Remount the currency selector (innerHTML replace drops the previous one)
    if (this._currencySelector) this._currencySelector.destroy();
    this._currencySelector = new CurrencySelector();
    const mount = view.querySelector('#cart-currency');
    if (mount) mount.appendChild(this._currencySelector.render());
  }

  destroy() {
    if (this._currencySelector) this._currencySelector.destroy();
    if (this._unsubCurrency) this._unsubCurrency();
  }

  _bindActions(view) {
    view.addEventListener('click', async e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const itemEl = btn.closest('.cart-item');
      const itemId = itemEl?.dataset.itemId;
      if (!itemId) return;

      const action = btn.dataset.action;
      const qtyEl  = itemEl.querySelector('.cart-item__qty-val');
      let qty = parseInt(qtyEl?.textContent || '1', 10);

      try {
        if (action === 'increase') {
          await cartApi.updateItem(itemId, qty + 1);
        } else if (action === 'decrease' && qty > 1) {
          await cartApi.updateItem(itemId, qty - 1);
        } else if (action === 'decrease' && qty <= 1) {
          await cartApi.removeItem(itemId);
        } else if (action === 'remove') {
          await cartApi.removeItem(itemId);
        }
        // Re-render the page
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } catch (err) {
        alert(err.message);
      }
    });
  }
}
