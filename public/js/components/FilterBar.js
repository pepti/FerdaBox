import { t } from '../i18n/index.js';

export class FilterBar {
  constructor(onChange) {
    this.onChange = onChange;
    this.active = 'all';
  }

  render() {
    const bar = document.createElement('div');
    bar.className = 'filter-bar';

    const filters = [
      { key: 'all',         label: t('products.allProducts') },
      { key: 'roof_boxes',  label: t('products.roofBoxes') },
      { key: 'roof_racks',  label: t('products.roofRacks') },
      { key: 'accessories', label: t('products.accessories') },
      { key: 'bundles',     label: t('products.bundles') },
    ];

    filters.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.className = `filter-btn${this.active === key ? ' active' : ''}`;
      btn.dataset.category = key;
      btn.textContent = label;
      btn.addEventListener('click', () => {
        this.active = key;
        bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onChange(key);
      });
      bar.appendChild(btn);
    });

    return bar;
  }
}
