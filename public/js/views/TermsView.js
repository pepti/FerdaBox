import { t } from '../i18n/index.js';

export class TermsView {
  async render() {
    const view = document.createElement('div');
    view.className = 'view';
    view.innerHTML = `
      <main class="main legal-page" id="main-content">
        <article class="legal-article">
          <header class="legal-header">
            <h1 class="legal-title">${t('terms.title')}</h1>
            <p class="legal-meta">${t('terms.lastUpdated')}</p>
          </header>

          <section class="legal-section">
            <p>${t('terms.intro')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('terms.section1Title')}</h2>
            <p>${t('terms.section1Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('terms.section2Title')}</h2>
            <p>${t('terms.section2Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('terms.section3Title')}</h2>
            <p>${t('terms.section3Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('terms.section4Title')}</h2>
            <p>${t('terms.section4Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('terms.section5Title')}</h2>
            <p>${t('terms.section5Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('terms.section6Title')}</h2>
            <p>${t('terms.section6Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('terms.section7Title')}</h2>
            <p>${t('terms.section7Text')}</p>
          </section>

          <section class="legal-section">
            <h2>${t('terms.section8Title')}</h2>
            <p>${t('terms.section8Text')}</p>
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
