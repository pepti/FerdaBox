// ContactView — /contact page for Ferda Box
// Hero + contact-info cards + inquiry form. Admin/moderator can toggle an
// in-page edit mode that makes hero text + contact info editable inline
// and persists to the site_content JSONB store (key: 'contact_page').

import { t } from '../i18n/index.js';
import { getUser, getCSRFToken } from '../services/auth.js';
import { escHtml } from '../utils/escHtml.js';
import { showToast } from '../components/Toast.js';

const CONTENT_KEY = 'contact_page';

// Bot-proof email display: splits an "x@y.z" address into stylised parts
// ("x [at] y [dot] z") so the raw mailto string never appears in the static
// HTML source.  The real mailto href is assembled lazily from the parts on
// first user interaction (hover/focus/touch/click) — naive scrapers that
// don't simulate interaction get only the obfuscated text.
function obfuscateEmail(raw) {
  if (typeof raw !== 'string' || !raw.includes('@')) return { display: raw || '', parts: null };
  const [local, domainFull] = raw.split('@');
  const parts = domainFull.split('.');
  const display = `${local} [at] ${parts[0]} [dot] ${parts.slice(1).join('.')}`;
  return { display, parts: { local, domain: parts[0], tld: parts.slice(1).join('.') } };
}
function assembleEmail(parts) {
  if (!parts) return '';
  return `${parts.local}@${parts.domain}.${parts.tld}`;
}

// Default content mirrors the previous t()-based copy so first-time loads
// before the admin edits anything look identical to the old page.
function defaultContent() {
  return {
    hero_eyebrow:  t('contact.subheading'),
    hero_title:    t('contact.heading'),
    hero_subtitle: t('contact.description'),
    card_email_label:    t('contact.emailLabel'),
    card_email_value:    t('contact.emailValue'),
    card_phone_label:    t('contact.phoneLabel'),
    card_phone_value:    t('contact.phoneValue'),
    card_location_label: t('contact.locationLabel'),
    card_location_value: t('contact.locationValue'),
    card_reply_time:     t('contact.replyTime'),
    form_title:          t('contact.subheading'),
  };
}

export class ContactView {
  constructor() {
    this._content   = defaultContent();
    this._editMode  = false;
    this._view      = null;
  }

  async render() {
    const view = document.createElement('div');
    view.className = 'view contact-view';
    this._view = view;

    // Fetch saved content; on any error we silently fall back to defaults.
    try {
      const res = await fetch(`/api/v1/content/${CONTENT_KEY}`, { credentials: 'include' });
      if (res.ok) {
        const stored = await res.json();
        this._content = { ...this._content, ...stored };
      }
    } catch { /* keep defaults */ }

    this._paint();
    return view;
  }

  _canEdit() {
    const u = getUser();
    return u && (u.role === 'admin' || u.role === 'moderator');
  }

  _field(key, { tag = 'span', extraClass = '' } = {}) {
    // Render a single editable-field slot.  In edit mode the attribute
    // `contenteditable=true` lets the admin type inline; otherwise the
    // value is just a static node.  escHtml'd on both paths.
    const attrs = [
      `data-field="${escHtml(key)}"`,
      extraClass ? `class="${escHtml(extraClass)}"` : '',
      this._editMode ? 'contenteditable="true"' : '',
    ].filter(Boolean).join(' ');
    return `<${tag} ${attrs}>${escHtml(this._content[key] ?? '')}</${tag}>`;
  }

  _editToggleButton() {
    if (!this._canEdit()) return '';
    return `
      <div class="contact-edit-bar">
        <button type="button" class="btn btn--sm ${this._editMode ? 'btn--primary' : 'btn--outline'}"
                id="contact-edit-toggle">
          ${this._editMode ? 'Save' : 'Edit page'}
        </button>
        ${this._editMode
          ? `<button type="button" class="btn btn--sm btn--ghost" id="contact-edit-cancel">Cancel</button>`
          : ''}
      </div>`;
  }

  _paint() {
    this._view.innerHTML = `
      <main class="main" id="main-content">
        ${this._editToggleButton()}

        <section class="contact-hero" aria-label="${t('contact.heading')}">
          <div class="contact-hero__bg" aria-hidden="true"></div>
          <div class="contact-hero__inner">
            <p class="contact-hero__eyebrow">${this._field('hero_eyebrow')}</p>
            <h1 class="contact-hero__title">${this._field('hero_title')}</h1>
            <p class="contact-hero__subtitle">${this._field('hero_subtitle')}</p>
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
                  <div class="contact-card__label">${this._field('card_email_label')}</div>
                  ${this._emailSlot()}
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
                  <div class="contact-card__label">${this._field('card_phone_label')}</div>
                  <div class="contact-card__value">${this._field('card_phone_value')}</div>
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
                  <div class="contact-card__label">${this._field('card_location_label')}</div>
                  <div class="contact-card__value">${this._field('card_location_value')}</div>
                  <div class="contact-card__meta">${this._field('card_reply_time')}</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section class="contact-form-section" id="contact-form-section" aria-label="${t('contact.heading')}">
          <div class="contact-form-section__inner">
            <h2 class="contact-form-section__title">${this._field('form_title', { tag: 'span' })}</h2>

            <form class="contact-form contact-form--page" id="contact-page-form" novalidate
                  aria-label="${t('contact.heading')}">
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

    this._initForm(this._view);
    this._bindEditToggle();
    this._bindEmailReveal();

    // In edit mode: block the submit button accidentally firing while the
    // admin is clicking around contenteditable spans.
    if (this._editMode) {
      const submit = this._view.querySelector('#contact-page-submit');
      if (submit) submit.disabled = true;
    }
  }

  // Render the email "card" value.  In edit mode we keep the same
  // data-field=card_email_value contenteditable slot so admins can type a
  // real email.  In view mode we show the obfuscated text only — the raw
  // mailto link is built in _bindEmailReveal() after user interaction.
  _emailSlot() {
    if (this._editMode) {
      return `<div class="contact-card__value">${this._field('card_email_value')}</div>`;
    }
    const { display, parts } = obfuscateEmail(this._content.card_email_value);
    const dataParts = parts
      ? `data-email-local="${escHtml(parts.local)}" data-email-domain="${escHtml(parts.domain)}" data-email-tld="${escHtml(parts.tld)}"`
      : '';
    return `
      <div class="contact-card__value" id="contact-email-slot" ${dataParts}>
        <span data-field="card_email_value" class="contact-email-display">${escHtml(display)}</span>
      </div>`;
  }

  _bindEmailReveal() {
    if (this._editMode) return;
    const slot = this._view.querySelector('#contact-email-slot');
    if (!slot) return;
    const parts = {
      local:  slot.dataset.emailLocal,
      domain: slot.dataset.emailDomain,
      tld:    slot.dataset.emailTld,
    };
    if (!parts.local) return;
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      const addr = assembleEmail(parts);
      // Replace the span with a real <a mailto:> — raw string now in DOM
      // but only after user interaction, not in the static source.
      slot.innerHTML = `<a href="mailto:${encodeURIComponent(addr).replace(/%40/g, '@')}" class="contact-email-link">${escHtml(addr)}</a>`;
    };
    ['mouseenter', 'focusin', 'touchstart', 'click'].forEach(ev =>
      slot.addEventListener(ev, reveal, { once: true, passive: true })
    );
  }

  _bindEditToggle() {
    const toggle = this._view.querySelector('#contact-edit-toggle');
    const cancel = this._view.querySelector('#contact-edit-cancel');
    if (toggle) {
      toggle.addEventListener('click', async () => {
        if (!this._editMode) {
          this._editMode = true;
          this._paint();
          return;
        }
        // Save: read all data-field spans
        const updated = { ...this._content };
        this._view.querySelectorAll('[data-field]').forEach(el => {
          const key = el.dataset.field;
          if (key) updated[key] = el.innerText.trim();
        });
        try {
          const token = await getCSRFToken();
          const res = await fetch(`/api/v1/content/${CONTENT_KEY}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'X-CSRF-Token': token } : {}),
            },
            body: JSON.stringify(updated),
          });
          if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
          this._content = await res.json();
          this._editMode = false;
          this._paint();
          showToast('Contact page saved', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
    if (cancel) {
      cancel.addEventListener('click', () => {
        this._editMode = false;
        this._paint();
      });
    }
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
