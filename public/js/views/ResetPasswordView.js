import { resetPassword } from '../services/auth.js';
import { t } from '../i18n/index.js';

export class ResetPasswordView {
  constructor(queryString = '') {
    this._queryString = queryString;
  }

  async render() {
    const params = new URLSearchParams(this._queryString);
    const token  = params.get('token');

    const el = document.createElement('div');
    el.className = 'main auth-page';

    if (!token) {
      el.innerHTML = `
        <div class="auth-container">
          <div class="auth-card">
            <div class="auth-card__icon auth-card__icon--error">✗</div>
            <h1 class="auth-card__title">${t('auth.invalidLink')}</h1>
            <p class="auth-card__text">${t('auth.invalidLinkDesc')}</p>
            <a href="#/forgot-password" class="btn btn--primary" data-route="/forgot-password">${t('auth.requestNewLink')}</a>
          </div>
        </div>`;
      return el;
    }

    el.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-card__eyebrow">${t('auth.accountRecovery')}</div>
          <h1 class="auth-card__title">${t('auth.resetPassword')}</h1>
          <p class="auth-card__text">${t('auth.resetDesc')}</p>

          <form class="auth-form" id="reset-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="reset-password">${t('auth.newPassword')} <span class="req">*</span></label>
              <input class="form-input" id="reset-password" name="password" type="password"
                     autocomplete="new-password" required/>
              <div class="password-strength" id="reset-pw-strength" aria-live="polite"></div>
              <ul class="pw-requirements">
                <li id="reset-req-length">${t('auth.passwordMinChars')}</li>
                <li id="reset-req-letter">${t('auth.passwordMinLetter')}</li>
                <li id="reset-req-number">${t('auth.passwordMinNumber')}</li>
              </ul>
            </div>
            <div class="form-group">
              <label class="form-label" for="reset-confirm">${t('auth.confirmPassword')} <span class="req">*</span></label>
              <input class="form-input" id="reset-confirm" name="confirm" type="password"
                     autocomplete="new-password" required/>
              <p class="form-field-status" id="reset-confirm-status"></p>
            </div>
            <p class="form-error" id="reset-error" aria-live="polite"></p>
            <button class="btn btn--primary btn--full" type="submit" id="reset-btn">${t('auth.setNewPassword')}</button>
          </form>

          <div class="auth-success" id="reset-success" hidden>
            <div class="auth-success__icon">✓</div>
            <p class="auth-success__text">${t('auth.resetSuccess')}</p>
            <a href="#/login" class="btn btn--primary" data-route="/login">${t('auth.signIn')}</a>
          </div>
        </div>
      </div>
    `;

    const pwInput      = el.querySelector('#reset-password');
    const confirmInput = el.querySelector('#reset-confirm');

    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      const score = [val.length >= 8, /[A-Za-z]/.test(val), /\d/.test(val)].filter(Boolean).length;
      const pct   = score * 33;
      const cls   = score <= 1 ? 'weak' : score === 2 ? 'fair' : 'strong';
      el.querySelector('#reset-pw-strength').innerHTML = `
        <div class="pw-strength__bar">
          <div class="pw-strength__fill pw-strength__fill--${cls}" style="width:${pct}%"></div>
        </div>`;
      el.querySelector('#reset-req-length').classList.toggle('req--met', val.length >= 8);
      el.querySelector('#reset-req-letter').classList.toggle('req--met', /[A-Za-z]/.test(val));
      el.querySelector('#reset-req-number').classList.toggle('req--met', /\d/.test(val));
    });

    confirmInput.addEventListener('input', () => {
      const statusEl = el.querySelector('#reset-confirm-status');
      if (!confirmInput.value) { statusEl.textContent = ''; return; }
      const match = confirmInput.value === pwInput.value;
      statusEl.textContent = match ? '✓ Passwords match' : '✗ Do not match';
      statusEl.className   = 'form-field-status ' + (match ? 'status--ok' : 'status--err');
    });

    el.querySelector('#reset-form').addEventListener('submit', async e => {
      e.preventDefault();
      const form   = e.currentTarget;
      const errEl  = el.querySelector('#reset-error');
      const btn    = el.querySelector('#reset-btn');
      const pw     = form.password.value;
      const conf   = form.confirm.value;

      errEl.textContent = '';
      if (pw.length < 8)         { errEl.textContent = t('auth.passwordMinChars'); return; }
      if (!/[A-Za-z]/.test(pw))  { errEl.textContent = t('auth.passwordMinLetter'); return; }
      if (!/\d/.test(pw))        { errEl.textContent = t('auth.passwordMinNumber'); return; }
      if (pw !== conf)            { errEl.textContent = 'Passwords do not match.'; return; }

      btn.disabled = true;
      btn.textContent = t('common.loading');

      try {
        await resetPassword(token, pw);
        form.hidden = true;
        el.querySelector('#reset-success').hidden = false;
      } catch (err) {
        errEl.textContent = err.message;
        btn.disabled = false;
        btn.textContent = t('auth.setNewPassword');
      }
    });

    return el;
  }
}
