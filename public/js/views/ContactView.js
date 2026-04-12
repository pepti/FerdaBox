// ContactView — /contact page for Ferda Box
// Sections: heading + description, contact info cards, inquiry form

import { t } from '../i18n/index.js';

export class ContactView {
  constructor() {}

  async render() {
    const view = document.createElement('div');
    view.className = 'view contact-view';

    view.innerHTML = `
      <main class="main" id="main-content">
        <section class="contact-hero" aria-label="${t('contact.heading')}">
          <div class="contact-hero__bg" aria-hidden="true"></div>
          <div class="contact-hero__inner">
            <p class="contact-hero__eyebrow">${t('contact.subheading')}</p>
            <h1 class="contact-hero__title">${t('contact.heading')}</h1>
            <p class="contact-hero__subtitle">${t('contact.description')}</p>
          </div>
        </section>

        <section class="contact-card-section" aria-label="${t('contact.heading')}">
          <div class="contact-card-section__inner">
            <div class="contact-card">

              <div class="contact-card__item contact-card__item--static">
                <div class="contact-card__icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <polyline points="2,4 12,13 22,4"/>
                  </svg>
                </div>
                <div class="contact-card__body">
                  <div class="contact-card__label">${t('contact.emailLabel')}</div>
                  <div class="contact-card__value">${t('contact.emailValue')}</div>
                </div>
              </div>

              <div class="contact-card__item contact-card__item--static">
                <div class="contact-card__icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07
                             19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72
                             12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45
                             12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </div>
                <div class="contact-card__body">
                  <div class="contact-card__label">${t('contact.phoneLabel')}</div>
                  <div class="contact-card__value">${t('contact.phoneValue')}</div>
                </div>
              </div>

              <div class="contact-card__item contact-card__item--static">
                <div class="contact-card__icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <div class="contact-card__body">
                  <div class="contact-card__label">${t('contact.locationLabel')}</div>
                  <div class="contact-card__value">${t('contact.locationValue')}</div>
                  <div class="contact-card__meta">${t('contact.replyTime')}</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section class="contact-form-section" id="contact-form-section" aria-label="${t('contact.heading')}">
          <div class="contact-form-section__inner">
            <h2 class="contact-form-section__title">${t('contact.subheading')}</h2>

            <form class="contact-form contact-form--page" id="contact-page-form" novalidate
                  aria-label="${t('contact.heading')}">
              <!-- Honeypot -->
              <input type="text" name="website" id="contact-page-honeypot"
                     tabindex="-1" autocomplete="off" aria-hidden="true"
                     style="position:absolute;left:-9999px;opacity:0;height:0;width:0;pointer-events:none;" />

              <div class="contact-form__row">
                <div class="contact-form__field">
                  <label for="contact-page-name" class="contact-form__label">
                    ${t('contact.name')} <span aria-hidden="true" class="required-mark">${t('contact.required')}</span>
                  </label>
                  <input type="text" id="contact-page-name" name="name" class="contact-form__input"
                         required autocomplete="name" placeholder="${t('contact.namePlaceholder')}" maxlength="100" />
                </div>
                <div class="contact-form__field">
                  <label for="contact-page-email" class="contact-form__label">
                    ${t('contact.email')} <span aria-hidden="true" class="required-mark">${t('contact.required')}</span>
                  </label>
                  <input type="email" id="contact-page-email" name="email" class="contact-form__input"
                         required autocomplete="email" placeholder="${t('contact.emailPlaceholder')}" maxlength="200" />
                </div>
              </div>

              <div class="contact-form__field">
                <label for="contact-page-message" class="contact-form__label">
                  ${t('contact.message')} <span aria-hidden="true" class="required-mark">${t('contact.required')}</span>
                </label>
                <textarea id="contact-page-message" name="message" class="contact-form__textarea"
                          required rows="6" placeholder="${t('contact.messagePlaceholder')}" maxlength="2000"></textarea>
              </div>

              <div aria-live="polite" id="contact-page-status" class="contact-form__status"></div>

              <button type="submit" class="lol-contact__btn contact-form__submit" id="contact-page-submit">
                ${t('contact.send')}
              </button>
            </form>
          </div>
        </section>
      </main>
    `;

    this._initForm(view);
    return view;
  }

  // ── Form submission ──────────────────────────────────────────────────
  _initForm(view) {
    const form   = view.querySelector('#contact-page-form');
    const status = view.querySelector('#contact-page-status');
    const submit = view.querySelector('#contact-page-submit');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const honeypot = form.querySelector('#contact-page-honeypot').value;
      const name     = form.querySelector('#contact-page-name').value.trim();
      const email    = form.querySelector('#contact-page-email').value.trim();
      const message  = form.querySelector('#contact-page-message').value.trim();

      if (!name || !email || !message) {
        status.className = 'contact-form__status contact-form__status--error';
        status.textContent = t('contact.fillRequired');
        return;
      }

      submit.disabled = true;
      submit.textContent = t('contact.sending');
      status.className = 'contact-form__status';
      status.textContent = '';

      try {
        const res = await fetch('/api/v1/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message, website: honeypot }),
        });

        if (res.ok) {
          status.className = 'contact-form__status contact-form__status--success';
          status.textContent = t('contact.sent');
          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data.errors?.[0] || data.error || t('contact.error');
          throw new Error(msg);
        }
      } catch (err) {
        status.className = 'contact-form__status contact-form__status--error';
        status.textContent = err.message;
      } finally {
        submit.disabled = false;
        submit.textContent = t('contact.send');
      }
    });
  }
}
