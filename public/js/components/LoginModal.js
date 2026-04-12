import { login }      from '../services/auth.js';
import { showToast }  from './Toast.js';
import { t } from '../i18n/index.js';

export class LoginModal {
  constructor() {
    this._overlay = null;
  }

  mount() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay login-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'login-title');
    overlay.innerHTML = `
      <div class="modal login-modal">
        <button class="modal__close" aria-label="${t('common.close')}">&times;</button>
        <p class="login-modal__eyebrow">${t('auth.welcomeBack')}</p>
        <h2 class="modal__title" id="login-title">${t('auth.signIn')}</h2>
        <form class="login-form" novalidate data-testid="login-form">
          <div class="form-group">
            <label class="form-label" for="login-username">${t('auth.username')}</label>
            <input class="form-input" id="login-username" name="username"
              type="text" autocomplete="username" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="login-password">${t('auth.password')}</label>
            <input class="form-input" id="login-password" name="password"
              type="password" autocomplete="current-password" required />
          </div>
          <p class="form-error" aria-live="polite"></p>
          <button class="btn btn--primary btn--full" type="submit" data-testid="login-submit">${t('auth.signIn')}</button>
          <div class="login-modal__footer">
            <a href="#/forgot-password" class="login-modal__link" data-route="/forgot-password"
               id="login-forgot-link">${t('auth.forgotPassword')}</a>
            <span class="login-modal__sep">·</span>
            <a href="#/signup" class="login-modal__link" data-route="/signup"
               id="login-signup-link">${t('auth.createAccount')}</a>
          </div>
        </form>
      </div>
    `;

    overlay.querySelector('.modal__close').addEventListener('click', () => this.close());
    overlay.addEventListener('click', e => { if (e.target === overlay) this.close(); });
    overlay.querySelector('.login-form').addEventListener('submit', e => this._onSubmit(e));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    // Close modal when navigating via footer links
    overlay.querySelector('#login-forgot-link').addEventListener('click', () => this.close());
    overlay.querySelector('#login-signup-link').addEventListener('click', () => this.close());

    document.body.appendChild(overlay);
    this._overlay = overlay;
  }

  open() {
    if (!this._overlay) this.mount();
    requestAnimationFrame(() => this._overlay.classList.add('open'));
    this._overlay.querySelector('#login-username').focus();
  }

  close() {
    if (!this._overlay) return;
    this._overlay.classList.remove('open');
    const errEl = this._overlay.querySelector('.form-error');
    if (errEl) errEl.textContent = '';
    this._overlay.querySelector('.login-form')?.reset();
  }

  async _onSubmit(e) {
    e.preventDefault();
    const form     = e.currentTarget;
    const errEl    = form.querySelector('.form-error');
    const btn      = form.querySelector('[type=submit]');
    const username = form.username.value.trim();
    const password = form.password.value;

    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = t('auth.signIn') + '...';

    try {
      await login(username, password);
      this.close();
      showToast('Signed in', 'success');
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = t('auth.signIn');
    }
  }
}
