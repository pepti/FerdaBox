// ShopFilters — search, category chips, price range, in-stock toggle, sort.
// Fully client-side: receives the full product list, emits a filtered +
// sorted result via applyFilters.  State survives currency flips (price
// placeholders repaint on the currencychange event).
import * as currency from '../services/currency.js';
import { t } from '../i18n/index.js';

// Keep in sync with VALID_CATEGORIES on the server (validate.js).
const CATEGORIES = [
  { id: 'all',          labelKey: 'products.allProducts' },
  { id: 'roof_boxes',   labelKey: 'products.roofBoxes' },
  { id: 'roof_racks',   labelKey: 'products.roofRacks' },
  { id: 'accessories',  labelKey: 'products.accessories' },
  { id: 'bundles',      labelKey: 'products.bundles' },
];

const SORTS = [
  { id: 'featured',   label: 'Featured' },
  { id: 'price-asc',  label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'newest',     label: 'Newest first' },
  { id: 'name',       label: 'Name A–Z' },
];

const DEFAULT_STATE = {
  q: '',
  category: 'all',
  priceMin: '',
  priceMax: '',
  inStockOnly: false,
  sort: 'featured',
};

// Public helper: apply a filter state to a product list.  Reads the user's
// current currency via productPrice so price ranges compare in whatever the
// user has selected (EUR inputs compare against price_eur, ISK against price).
export function applyFilters(products, state) {
  let out = products.slice();

  if (state.q) {
    const q = state.q.toLowerCase().trim();
    out = out.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }

  if (state.category && state.category !== 'all') {
    out = out.filter(p => p.category === state.category);
  }

  // Price range is expressed in the user's currently-selected currency.
  // Products without price_eur fall back to their ISK price via
  // currency.productPrice so the filter still works when the user is in EUR.
  if (state.priceMin !== '' || state.priceMax !== '') {
    const min = state.priceMin === '' ? -Infinity : Number(state.priceMin);
    const max = state.priceMax === '' ?  Infinity : Number(state.priceMax);
    out = out.filter(p => {
      const { amount } = currency.productPrice(p);
      return amount >= min && amount <= max;
    });
  }

  if (state.inStockOnly) {
    out = out.filter(p => Number(p.stock_quantity) > 0);
  }

  switch (state.sort) {
    case 'price-asc':
      out.sort((a, b) => currency.productPrice(a).amount - currency.productPrice(b).amount);
      break;
    case 'price-desc':
      out.sort((a, b) => currency.productPrice(b).amount - currency.productPrice(a).amount);
      break;
    case 'newest':
      out.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'name':
      out.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
    case 'featured':
    default:
      // Featured items first, then preserve server order.
      out.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
  }

  return out;
}

export class ShopFilters {
  constructor({ initialState = {}, onChange } = {}) {
    this._state = { ...DEFAULT_STATE, ...initialState };
    this._onChange = onChange || (() => {});
    this._el = null;
    this._searchDebounce = null;
    this._unsubCurrency = null;
  }

  getState() { return { ...this._state }; }

  setState(patch) {
    this._state = { ...this._state, ...patch };
    this._paint();
    this._onChange(this.getState());
  }

  resetState() {
    this._state = { ...DEFAULT_STATE };
    this._paint();
    this._onChange(this.getState());
  }

  render() {
    const el = document.createElement('div');
    el.className = 'shop-filters';
    this._el = el;
    this._paint();
    // Repaint price placeholders when the user flips ISK↔EUR elsewhere.
    this._unsubCurrency = currency.subscribe(() => this._paint());
    return el;
  }

  _activeCount() {
    const s = this._state;
    return (s.category !== 'all' ? 1 : 0) +
           ((s.priceMin || s.priceMax) ? 1 : 0) +
           (s.inStockOnly ? 1 : 0) +
           (s.q ? 1 : 0);
  }

  _paint() {
    if (!this._el) return;
    const s = this._state;
    const cur = currency.getCurrency();
    const pricePlaceholder = cur === 'ISK' ? 'kr.' : '€';

    this._el.innerHTML = `
      <div class="shop-filters__top">
        <div class="shop-filters__search">
          <svg class="shop-filters__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="search" id="sf-q" class="shop-filters__input"
                 placeholder="Search products" value="${_esc(s.q)}"
                 autocomplete="off" data-testid="shop-search"/>
          ${s.q ? `<button type="button" class="shop-filters__clear-search" id="sf-clear-q"
                    aria-label="Clear search">✕</button>` : ''}
        </div>
        <label class="shop-filters__sort">
          <span class="shop-filters__sort-label">Sort</span>
          <select id="sf-sort" data-testid="shop-sort">
            ${SORTS.map(o => `<option value="${o.id}" ${o.id === s.sort ? 'selected' : ''}>${_esc(o.label)}</option>`).join('')}
          </select>
        </label>
      </div>

      <div class="shop-filters__row">
        <span class="shop-filters__row-label">Category</span>
        <div class="shop-filters__chips" role="group" aria-label="Filter by category">
          ${CATEGORIES.map(c => `
            <button type="button" class="shop-filters__chip ${c.id === s.category ? 'active' : ''}"
                    data-cat="${c.id}" data-testid="cat-${c.id}">${_esc(t(c.labelKey))}</button>
          `).join('')}
        </div>
      </div>

      <div class="shop-filters__row shop-filters__row--wrap">
        <span class="shop-filters__row-label">Price (${cur})</span>
        <div class="shop-filters__price">
          <input type="number" inputmode="numeric" min="0" step="any"
                 class="shop-filters__price-input" id="sf-min"
                 placeholder="Min ${pricePlaceholder}" value="${_esc(s.priceMin)}"
                 aria-label="Minimum price"/>
          <span class="shop-filters__price-sep">—</span>
          <input type="number" inputmode="numeric" min="0" step="any"
                 class="shop-filters__price-input" id="sf-max"
                 placeholder="Max ${pricePlaceholder}" value="${_esc(s.priceMax)}"
                 aria-label="Maximum price"/>
        </div>

        <label class="shop-filters__toggle">
          <input type="checkbox" id="sf-stock" ${s.inStockOnly ? 'checked' : ''}/>
          <span>In stock only</span>
        </label>

        ${this._activeCount() > 0 || s.sort !== 'featured'
          ? `<button type="button" class="shop-filters__reset" id="sf-reset"
                     data-testid="shop-filters-reset">Clear all</button>`
          : ''}
      </div>
    `;

    this._bind();
  }

  _bind() {
    const root = this._el;

    const q = root.querySelector('#sf-q');
    q?.addEventListener('input', (e) => {
      const v = e.target.value;
      clearTimeout(this._searchDebounce);
      this._searchDebounce = setTimeout(() => {
        this._state.q = v;
        this._onChange(this.getState());
        // Minor tweak: add/remove the clear button without a full re-paint
        // unless the presence actually changed.
        const hadBtn = !!root.querySelector('#sf-clear-q');
        if ((!!v) !== hadBtn) this._paint();
      }, 150);
    });

    root.querySelector('#sf-clear-q')?.addEventListener('click', () => {
      this.setState({ q: '' });
    });

    root.querySelector('#sf-sort')?.addEventListener('change', (e) => {
      this.setState({ sort: e.target.value });
    });

    root.querySelectorAll('[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setState({ category: btn.dataset.cat });
      });
    });

    // Price min/max commit on change (blur/Enter) so typing doesn't repaint
    // on every keystroke and drop focus.
    const commit = (field, input) => {
      const v = input.value.trim();
      if (v !== this._state[field]) this.setState({ [field]: v });
    };
    const minEl = root.querySelector('#sf-min');
    const maxEl = root.querySelector('#sf-max');
    minEl?.addEventListener('change', () => commit('priceMin', minEl));
    maxEl?.addEventListener('change', () => commit('priceMax', maxEl));
    minEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); minEl.blur(); } });
    maxEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); maxEl.blur(); } });

    root.querySelector('#sf-stock')?.addEventListener('change', (e) => {
      this.setState({ inStockOnly: e.target.checked });
    });

    root.querySelector('#sf-reset')?.addEventListener('click', () => {
      this.resetState();
    });
  }

  destroy() {
    if (this._unsubCurrency) this._unsubCurrency();
    clearTimeout(this._searchDebounce);
  }
}

function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
