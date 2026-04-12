import { cartApi } from '../api/projectApi.js';
import { escHtml }  from '../utils/escHtml.js';
import { isAuthenticated } from '../services/auth.js';
import { t } from '../i18n/index.js';

const fmtPrice = (p) => Number(p).toLocaleString('is-IS') + ' kr.';

export class CartView {
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
      const { items, total } = await cartApi.getCart();

      if (!items.length) {
        view.innerHTML = `
          <div class="cart-view__empty">
            <h1>${t('cart.heading')}</h1>
            <p>${t('cart.empty')}</p>
            <a href="#/projects" class="btn btn--primary">${t('cart.browseProducts')}</a>
          </div>`;
        return view;
      }

      const rows = items.map(item => `
        <div class="cart-item" data-item-id="${item.id}">
          <img class="cart-item__img" src="${escHtml(item.image_url || 'https://placehold.co/100x100/1a1a2e/c9a84c?text=Product')}"
               alt="${escHtml(item.title)}" width="100" height="100">
          <div class="cart-item__info">
            <h3 class="cart-item__title">${escHtml(item.title)}</h3>
            <p class="cart-item__price">${fmtPrice(item.price)}</p>
          </div>
          <div class="cart-item__qty">
            <button class="cart-item__qty-btn" data-action="decrease" aria-label="${t('cart.decrease')}">-</button>
            <span class="cart-item__qty-val">${item.quantity}</span>
            <button class="cart-item__qty-btn" data-action="increase" aria-label="${t('cart.increase')}">+</button>
          </div>
          <div class="cart-item__subtotal">${fmtPrice(item.price * item.quantity)}</div>
          <button class="cart-item__remove" data-action="remove" aria-label="${t('cart.remove')}">&times;</button>
        </div>
      `).join('');

      view.innerHTML = `
        <div class="cart-view__inner">
          <h1>${t('cart.heading')}</h1>
          <div class="cart-items">${rows}</div>
          <div class="cart-summary">
            <div class="cart-summary__total">
              <span>${t('cart.total')}</span>
              <strong>${fmtPrice(total)}</strong>
            </div>
            <a href="#/checkout" class="btn btn--primary btn--lg">${t('cart.checkout')}</a>
            <a href="#/projects" class="btn btn--ghost">${t('cart.continueShopping')}</a>
          </div>
        </div>`;

      this._bindActions(view);
    } catch (err) {
      view.innerHTML = `<div class="cart-view__empty"><h1>${t('cart.heading')}</h1><p>${t('cart.loadError')} ${escHtml(err.message)}</p></div>`;
    }

    return view;
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
