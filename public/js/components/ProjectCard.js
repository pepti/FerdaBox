const CATEGORY_IMAGES = {
  roof_boxes:   '/assets/products/titan/5.jpg',
  roof_racks:   '/assets/products/titan/5.jpg',
  accessories:  '/assets/products/titan/5.jpg',
  bundles:      '/assets/products/titan/5.jpg',
  tech:         '/assets/products/titan/5.jpg',
  carpentry:    '/assets/products/titan/5.jpg',
};

import { escHtml } from '../utils/escHtml.js';
import { t } from '../i18n/index.js';

export class ProjectCard {
  constructor(project, onClick) {
    this.project = project;
    this.onClick  = onClick;
  }

  render() {
    const { title, description, category, featured, image_url, price, compare_at_price, stock_quantity } = this.project;

    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.category = category;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', t('products.viewProduct', { title }));

    const bgImg = image_url || CATEGORY_IMAGES[category] || CATEGORY_IMAGES.roof_boxes;
    const catLabel = (category || '').replace(/_/g, ' ');
    const fmtPrice = (p) => Number(p).toLocaleString('is-IS') + ' kr.';
    const hasPrice = price && Number(price) > 0;
    const onSale = hasPrice && compare_at_price && Number(compare_at_price) > Number(price);
    const inStock = stock_quantity > 0;

    card.innerHTML = `
      <div class="project-card__image">
        <img class="project-card__image-bg"
             src="${escHtml(bgImg)}" alt="${escHtml(title)}" loading="lazy">
        <div class="project-card__image-overlay"></div>
        <span class="project-card__category project-card__category--${escHtml(category)}">${escHtml(catLabel)}</span>
        ${hasPrice ? `<span class="project-card__price">${onSale ? `<s class="project-card__price--was">${fmtPrice(compare_at_price)}</s> ` : ''}${fmtPrice(price)}</span>` : ''}
        ${featured ? '<span class="project-card__featured-star" title="Featured">★</span>' : ''}
      </div>
      <div class="project-card__body">
        <h3 class="project-card__title">${escHtml(title)}</h3>
        <p class="project-card__desc">${escHtml(description)}</p>
        ${hasPrice ? `<div class="project-card__footer">
          <span class="project-card__stock ${inStock ? 'project-card__stock--in' : 'project-card__stock--out'}">${inStock ? t('products.inStock') : t('products.outOfStock')}</span>
        </div>` : ''}
      </div>
    `;

    const handler = () => this.onClick(this.project);
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });

    return card;
  }
}
