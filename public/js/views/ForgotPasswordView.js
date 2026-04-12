import { forgotPassword } from '../services/auth.js';
import { t } from '../i18n/index.js';

export class ForgotPasswordView {
  async render() {
    const el = document.createElement('div');
    el.className = 'main auth-page';
    el.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-card__eyebrow">${t('auth.accountRecovery')}</div>
          <h1 class="auth-card__title">${t('auth.forgotPasswordTitle')}</h1>
          <p class="auth-card__text">${t('auth.forgotPasswordDesc')}</p>

          <form class="auth-form" id="forgot-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="forgot-email">${t('auth.emailAddress')}</label>
              <input class="form-input" id="forgot-email" name="email" type="email"
                     autocomplete="email" required placeholder="${t('auth.emailPlaceholder')}"/>
            </div>
            <p class="form-error" id="forgot-error" aria-live="polite"></p>
            <button class="btn btn--primary btn--full" type="submit" id="forgot-btn">${t('auth.sendResetLink')}</button>
          </form>

          <div class="auth-success" id="forgot-success" hidden>
            <div class="auth-success__icon">✉</div>
            <p class="auth-success__text">${t('auth.resetSent')}</p>
          </div>

          <p class="auth-footer-links">
            ${t('auth.rememberPassword')} <a href="#/login" class="signup-link" data-route="/login">${t('auth.signIn')}</a>
          </p>
        </div>
      </div>
    `;

    el.querySelector('#forgot-form').addEventListener('submit', async e => {
      e.preventDefault();
      const form   = e.currentTarget;
      const errEl  = el.querySelector('#forgot-error');
      const btn    = el.querySelector('#forgot-btn');
      const email  = form.email.value.trim();

      errEl.textContent = '';
      if (!email) { errEl.textContent = t('contact.fillRequired'); return; }

      btn.disabled = true;
      btn.textContent = t('contact.sending');

      try {
        await forgotPassword(email);
        form.hidden = true;
        el.querySelector('#forgot-success').hidden = false;
      } catch {
        // Always show the same message to prevent email enumeration
        form.hidden = true;
        el.querySelector('#forgot-success').hidden = false;
      }
    });

    return el;
  }
}
