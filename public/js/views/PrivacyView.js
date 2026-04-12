import { t } from '../i18n/index.js';

export class PrivacyView {
  async render() {
    const view = document.createElement('div');
    view.className = 'view';
    view.innerHTML = `
      <main class="main legal-page" id="main-content">
        <article class="legal-article">
          <header class="legal-header">
            <h1 class="legal-title">${t('privacy.title')}</h1>
            <p class="legal-meta">${t('privacy.lastUpdated')}</p>
          </header>

          <section class="legal-section">
            <p>${t('privacy.intro')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('privacy.section1Title')}</h2>
            <p>${t('privacy.section1Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('privacy.section2Title')}</h2>
            <p>${t('privacy.section2Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('privacy.section3Title')}</h2>
            <p>${t('privacy.section3Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('privacy.section4Title')}</h2>
            <p>${t('privacy.section4Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('privacy.section5Title')}</h2>
            <p>${t('privacy.section5Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('privacy.section6Title')}</h2>
            <p>${t('privacy.section6Text')}</p>
          </section>

          <footer class="legal-footer-nav">
            <a href="#/" class="btn btn--outline">${t('common.back')}</a>
          </footer>
        </article>
      </main>
    `;
    return view;
  }
}
