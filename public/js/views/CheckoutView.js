import { cartApi, orderApi } from '../api/projectApi.js';
import { escHtml }  from '../utils/escHtml.js';
import { isAuthenticated, getUser } from '../services/auth.js';
import { t } from '../i18n/index.js';
import * as currency from '../services/currency.js';

// Picks the per-item price in the current currency with ISK fallback when the
// product has no price_eur.
function itemPrice(item, cur) {
  if (cur === 'EUR' && item.price_eur != null && item.price_eur !== '') {
    return { amount: Number(item.price_eur), currency: 'EUR' };
  }
  return { amount: Number(item.price), currency: 'ISK' };
}

export class CheckoutView {
  async render() {
    const view = document.createElement('div');
    view.className = 'view checkout-view';

    if (!isAuthenticated()) {
      view.innerHTML = `<div class="checkout-view__inner"><h1>${t('checkout.heading')}</h1><p>${t('checkout.signInRequired')}</p></div>`;
      return view;
    }

    try {
      const { items } = await cartApi.getCart();
      if (!items.length) {
        view.innerHTML = `<div class="checkout-view__inner"><h1>${t('checkout.heading')}</h1><p>${t('checkout.emptyCart')} <a href="#/projects">${t('cart.browseProducts')}</a></p></div>`;
        return view;
      }

      const user = getUser();
      const cur = currency.getCurrency();
      let summaryTotal = 0;
      const itemRows = items.map(i => {
        const { amount, currency: lineCur } = itemPrice(i, cur);
        const sub = amount * Number(i.quantity);
        if (lineCur === cur) summaryTotal += sub;
        return `
          <div class="checkout-item">
            <span>${escHtml(i.title)} x${i.quantity}</span>
            <span>${currency.formatMoney(sub, lineCur)}</span>
          </div>`;
      }).join('');

      view.innerHTML = `
        <div class="checkout-view__inner">
          <h1>${t('checkout.heading')}</h1>
          <div class="checkout-layout">
            <form class="checkout-form" id="checkout-form" novalidate>
              <h2>${t('checkout.shippingInfo')}</h2>
              <div class="form-group">
                <label class="form-label" for="co-name">${t('checkout.fullName')} <span class="req">*</span></label>
                <input class="form-input" id="co-name" name="name" type="text" required
                       value="${escHtml(user?.displayName || user?.username || '')}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="co-email">${t('checkout.email')} <span class="req">*</span></label>
                <input class="form-input" id="co-email" name="email" type="email" required
                       value="${escHtml(user?.email || '')}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="co-phone">${t('checkout.phone')}</label>
                <input class="form-input" id="co-phone" name="phone" type="tel"
                       value="${escHtml(user?.phone || '')}" />
              </div>
              <div class="form-group">
                <label class="form-label" for="co-address">${t('checkout.address')} <span class="req">*</span></label>
                <textarea class="form-input form-textarea" id="co-address" name="address" rows="3" required></textarea>
              </div>
              <div class="form-group">
                <label class="form-label" for="co-notes">${t('checkout.notes')}</label>
                <textarea class="form-input form-textarea" id="co-notes" name="notes" rows="2"></textarea>
              </div>
              <p class="form-error" id="checkout-error" aria-live="polite"></p>
              <button type="submit" class="btn btn--primary btn--lg" id="checkout-submit">${t('checkout.placeOrder')}</button>
            </form>

            <div class="checkout-summary">
              <h2>${t('checkout.orderSummary')}</h2>
              <div class="checkout-items">${itemRows}</div>
              <hr>
              <div class="checkout-total">
                <span>${t('cart.total')}</span>
                <strong>${currency.formatMoney(summaryTotal, cur)}</strong>
              </div>
            </div>
          </div>
        </div>`;

      this._bindSubmit(view);
    } catch (err) {
      view.innerHTML = `<div class="checkout-view__inner"><h1>${t('checkout.heading')}</h1><p>${t('checkout.error')} ${escHtml(err.message)}</p></div>`;
    }

    return view;
  }

  _bindSubmit(view) {
    const form = view.querySelector('#checkout-form');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = view.querySelector('#checkout-error');
      const btn   = view.querySelector('#checkout-submit');
      errEl.textContent = '';
      btn.disabled = true;
      btn.textContent = t('checkout.placingOrder');

      try {
        const order = await orderApi.checkout({
          name:    form.name.value.trim(),
          email:   form.email.value.trim(),
          phone:   form.phone.value.trim(),
          address: form.address.value.trim(),
          notes:   form.notes.value.trim(),
        });
        window.location.hash = `#/orders/${order.id}`;
      } catch (err) {
        errEl.textContent = err.message;
        btn.disabled = false;
        btn.textContent = t('checkout.placeOrder');
      }
    });
  }
}
