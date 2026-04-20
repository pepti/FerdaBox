import { projectApi } from '../api/projectApi.js';
import { ProjectCard } from '../components/ProjectCard.js';
import { ShopFilters, applyFilters } from '../components/ShopFilters.js';
import * as currency from '../services/currency.js';
import { t } from '../i18n/index.js';

export class ProjectsView {
  constructor() {
    this.allProjects = [];
    this.grid = null;
    this._filters = null;
    this._unsubCurrency = null;
  }

  async render() {
    const view = document.createElement('div');
    view.className = 'view';

    const main = document.createElement('main');
    main.className = 'main';

    this._filters = new ShopFilters({
      onChange: () => this._applyAndRender(),
    });

    const section = document.createElement('section');
    section.className = 'section';
    section.innerHTML = `
      <div class="section__header">
        <h2 class="section__title">${t('products.heading')}</h2>
        <span class="section__count" id="projects-count"></span>
      </div>
    `;
    section.insertBefore(this._filters.render(), section.querySelector('.section__header').nextSibling);

    this.grid = document.createElement('div');
    this.grid.className = 'project-grid';
    this.grid.innerHTML = skeletonCards(6);
    section.appendChild(this.grid);

    main.appendChild(section);
    view.appendChild(main);

    // Re-render the grid when the user flips currency so price-sort and
    // price-range filters pick the right currency field.
    this._unsubCurrency = currency.subscribe(() => this._applyAndRender());

    this._loadProjects(view);
    return view;
  }

  async _loadProjects(view) {
    try {
      this.allProjects = await projectApi.getAll({ limit: 100 });
      this._applyAndRender(view);
    } catch (err) {
      this.grid.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚠️</div>${t('products.loadError')}</div>`;
    }
  }

  _applyAndRender(view) {
    const state = this._filters ? this._filters.getState() : {};
    const filtered = applyFilters(this.allProjects, state);
    this._renderGrid(filtered, view);
  }

  _renderGrid(projects, view) {
    const countEl = (view || document).querySelector('#projects-count');
    if (countEl) countEl.textContent = t('products.count', { count: projects.length });

    this.grid.innerHTML = '';
    if (!projects.length) {
      this.grid.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📂</div>${t('products.noProducts')}</div>`;
      return;
    }
    projects.forEach(p => {
      this.grid.appendChild(
        new ProjectCard(p, (proj) => {
          window.location.hash = `#/projects/${proj.id}`;
        }).render()
      );
    });
  }

  destroy() {
    if (this._filters) this._filters.destroy();
    if (this._unsubCurrency) this._unsubCurrency();
  }
}

function skeletonCards(n) {
  return Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-line" style="width:60%"></div>
      <div class="skeleton skeleton-line" style="width:100%"></div>
      <div class="skeleton skeleton-line" style="width:80%"></div>
    </div>
  `).join('');
}
