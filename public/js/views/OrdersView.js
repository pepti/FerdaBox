import { orderApi } from '../api/projectApi.js';
import { escHtml }  from '../utils/escHtml.js';
import { isAuthenticated } from '../services/auth.js';
import { t } from '../i18n/index.js';

const fmtPrice = (p) => Number(p).toLocaleString('is-IS') + ' kr.';
const fmtDate  = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const statusLabel = (status) => {
  const key = `orders.${status}`;
  const val = t(key);
  return val !== key ? val : status;
};

export class OrdersView {
  async render() {
    const view = document.createElement('div');
    view.className = 'view orders-view';

    if (!isAuthenticated()) {
      view.innerHTML = `<div class="orders-view__inner"><h1>${t('orders.heading')}</h1><p>${t('orders.signInRequired')}</p></div>`;
      return view;
    }

    try {
      const orders = await orderApi.getOrders();

      if (!orders.length) {
        view.innerHTML = `<div class="orders-view__inner"><h1>${t('orders.heading')}</h1><p>${t('orders.noOrders')} <a href="#/projects">${t('orders.browseProducts')}</a></p></div>`;
        return view;
      }

      const rows = orders.map(o => `
        <a href="#/orders/${o.id}" class="order-row">
          <span class="order-row__id">#${o.id}</span>
          <span class="order-row__date">${fmtDate(o.created_at)}</span>
          <span class="order-row__status order-row__status--${o.status}">${statusLabel(o.status)}</span>
          <span class="order-row__total">${fmtPrice(o.total_price)}</span>
        </a>
      `).join('');

      view.innerHTML = `
        <div class="orders-view__inner">
          <h1>${t('orders.heading')}</h1>
          <div class="orders-list">${rows}</div>
        </div>`;
    } catch (err) {
      view.innerHTML = `<div class="orders-view__inner"><h1>${t('orders.heading')}</h1><p>${t('orders.error')}: ${escHtml(err.message)}</p></div>`;
    }
    return view;
  }
}

export class OrderDetailView {
  constructor(id) { this.id = id; }

  async render() {
    const view = document.createElement('div');
    view.className = 'view order-detail-view';

    if (!isAuthenticated()) {
      view.innerHTML = `<div class="order-detail__inner"><h1>${t('orders.heading')}</h1><p>${t('orders.signInRequired')}</p></div>`;
      return view;
    }

    try {
      const order = await orderApi.getOrder(this.id);
      if (!order) {
        view.innerHTML = `<div class="order-detail__inner"><h1>${t('products.notFound')}</h1></div>`;
        return view;
      }

      const itemRows = (order.items || []).map(i => `
        <div class="order-item">
          <span>${escHtml(i.product_title)} x${i.quantity}</span>
          <span>${fmtPrice(i.unit_price * i.quantity)}</span>
        </div>
      `).join('');

      view.innerHTML = `
        <div class="order-detail__inner">
          <h1>${t('orders.orderNum', { id: order.id })}</h1>
          <div class="order-detail__meta">
            <span class="order-row__status order-row__status--${order.status}">${statusLabel(order.status)}</span>
            <span>${fmtDate(order.created_at)}</span>
          </div>
          <div class="order-detail__shipping">
            <h3>${t('orders.shipping')}</h3>
            <p>${escHtml(order.customer_name)}<br>
               ${escHtml(order.customer_email)}<br>
               ${order.customer_phone ? escHtml(order.customer_phone) + '<br>' : ''}
               ${escHtml(order.shipping_address).replace(/\n/g, '<br>')}</p>
            ${order.notes ? `<p><em>${escHtml(order.notes)}</em></p>` : ''}
          </div>
          <div class="order-detail__items">
            <h3>${t('orders.items')}</h3>
            ${itemRows}
            <hr>
            <div class="order-detail__total">
              <span>${t('orders.total')}</span>
              <strong>${fmtPrice(order.total_price)}</strong>
            </div>
          </div>
          <a href="#/orders" class="btn btn--ghost">${t('orders.backToOrders')}</a>
        </div>`;
    } catch (err) {
      view.innerHTML = `<div class="order-detail__inner"><h1>${t('orders.error')}</h1><p>${escHtml(err.message)}</p></div>`;
    }
    return view;
  }
}
