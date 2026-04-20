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

      // Default shipping cost — read from server /api/v1/shop/config if we
      // had that endpoint; for now we use the documented defaults (flat_rate
      // 2500 ISK / 19.00 EUR, local_pickup free).
      const SHIPPING_DEFAULTS = {
        flat_rate:    { ISK: 2500, EUR: 19.00 },
        local_pickup: { ISK: 0,    EUR: 0 },
      };
      const selectedMethod = 'flat_rate';
      const shippingCost = SHIPPING_DEFAULTS[selectedMethod][cur] || 0;
      const grandTotal = summaryTotal + shippingCost;

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

              <h2 style="margin-top:1.5rem">${t('checkout.shippingMethod') === 'checkout.shippingMethod' ? 'Shipping method' : t('checkout.shippingMethod')}</h2>
              <div class="form-group checkout-ship-methods">
                <label class="checkout-ship-method">
                  <input type="radio" name="shipping_method" value="flat_rate" checked>
                  <div>
                    <strong>Shipping</strong>
                    <span class="checkout-ship-method__price" id="co-ship-price-flat">${currency.formatMoney(SHIPPING_DEFAULTS.flat_rate[cur], cur)}</span>
                  </div>
                </label>
                <label class="checkout-ship-method">
                  <input type="radio" name="shipping_method" value="local_pickup">
                  <div>
                    <strong>Local pickup</strong>
                    <span class="checkout-ship-method__price">Free</span>
                  </div>
                </label>
              </div>

              <div class="form-group" id="co-address-fields">
                <div class="form-row">
                  <div class="form-group" style="flex:2">
                    <label class="form-label" for="co-line1">Address line 1 <span class="req">*</span></label>
                    <input class="form-input" id="co-line1" name="line1" type="text" required />
                  </div>
                  <div class="form-group" style="flex:1">
                    <label class="form-label" for="co-line2">Line 2</label>
                    <input class="form-input" id="co-line2" name="line2" type="text" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group" style="flex:2">
                    <label class="form-label" for="co-city">City <span class="req">*</span></label>
                    <input class="form-input" id="co-city" name="city" type="text" required />
                  </div>
                  <div class="form-group" style="flex:1">
                    <label class="form-label" for="co-postal">Postal code <span class="req">*</span></label>
                    <input class="form-input" id="co-postal" name="postal" type="text" required />
                  </div>
                  <div class="form-group" style="flex:1">
                    <label class="form-label" for="co-country">Country <span class="req">*</span></label>
                    <input class="form-input" id="co-country" name="country" type="text" maxlength="2" value="IS" placeholder="IS" required />
                  </div>
                </div>
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
              <div class="checkout-item"><span>Subtotal</span><span>${currency.formatMoney(summaryTotal, cur)}</span></div>
              <div class="checkout-item"><span>Shipping</span><span id="co-ship-display">${currency.formatMoney(shippingCost, cur)}</span></div>
              <hr>
              <div class="checkout-total">
                <span>${t('cart.total')}</span>
                <strong id="co-total-display">${currency.formatMoney(grandTotal, cur)}</strong>
              </div>
            </div>
          </div>
        </div>`;

      this._shippingDefaults = SHIPPING_DEFAULTS;
      this._summaryTotal = summaryTotal;
      this._currency = cur;
      this._bindShippingToggle(view);
      this._bindSubmit(view);
    } catch (err) {
      view.innerHTML = `<div class="checkout-view__inner"><h1>${t('checkout.heading')}</h1><p>${t('checkout.error')} ${escHtml(err.message)}</p></div>`;
    }

    return view;
  }

  _bindShippingToggle(view) {
    const radios = view.querySelectorAll('input[name="shipping_method"]');
    const addressFields = view.querySelector('#co-address-fields');
    const shipDisplay = view.querySelector('#co-ship-display');
    const totalDisplay = view.querySelector('#co-total-display');
    const update = () => {
      const selected = view.querySelector('input[name="shipping_method"]:checked')?.value || 'flat_rate';
      const cost = this._shippingDefaults[selected][this._currency] || 0;
      addressFields.style.display = selected === 'local_pickup' ? 'none' : '';
      const requiredFields = ['line1', 'city', 'postal', 'country'];
      requiredFields.forEach(n => {
        const el = view.querySelector(`#co-${n}`);
        if (el) el.required = selected !== 'local_pickup';
      });
      shipDisplay.textContent = currency.formatMoney(cost, this._currency);
      totalDisplay.textContent = currency.formatMoney(this._summaryTotal + cost, this._currency);
    };
    radios.forEach(r => r.addEventListener('change', update));
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

      const shippingMethod = form.shipping_method.value;
      const requiresAddress = shippingMethod !== 'local_pickup';
      const shippingAddress = requiresAddress ? {
        line1:   form.line1.value.trim(),
        line2:   form.line2.value.trim() || null,
        city:    form.city.value.trim(),
        postal:  form.postal.value.trim(),
        country: (form.country.value || '').trim().toUpperCase(),
        phone:   form.phone.value.trim() || null,
      } : null;

      try {
        const order = await orderApi.checkout({
          name:    form.name.value.trim(),
          email:   form.email.value.trim(),
          phone:   form.phone.value.trim(),
          notes:   form.notes.value.trim(),
          shipping_method:  shippingMethod,
          shipping_address: shippingAddress,
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
