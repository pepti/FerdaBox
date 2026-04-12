import { t } from '../i18n/index.js';

export class NotFoundView {
  async render() {
    const view = document.createElement('div');
    view.className = 'view';
    view.innerHTML = `
      <main class="main not-found" id="main-content">
        <div class="not-found__inner">
          <p class="not-found__code">${t('notFound.code')}</p>
          <h1 class="not-found__title">${t('notFound.title')}</h1>
          <p class="not-found__desc">
            ${t('notFound.message')}
          </p>
          <a href="#/" class="btn btn--primary">${t('notFound.backHome')}</a>
        </div>
      </main>
    `;
    return view;
  }
}
