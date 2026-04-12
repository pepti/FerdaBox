// HomeView — League of Legends inspired layout
// Sections: Hero → Splash → News → Projects → Skills → Stats → Contact → Footer

import { isAdmin, hasRole, getCSRFToken } from '../services/auth.js';
import { escHtml } from '../utils/escHtml.js';
import { t } from '../i18n/index.js';


// ── Product categories (built dynamically for i18n) ────────────────────
function getCategories() {
  return [
    {
      id: 'roof_boxes', label: t('home.catRoofBoxes'), type: t('home.catTypeRoofBoxes'),
      img: '/assets/products/category-roofbox.jpg',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
               <rect x="2" y="7" width="20" height="10" rx="2"/><line x1="6" y1="17" x2="6" y2="20"/><line x1="18" y1="17" x2="18" y2="20"/>
             </svg>`,
    },
    {
      id: 'roof_racks', label: t('home.catRoofRacks'), type: t('home.catTypeRoofRacks'),
      img: '/assets/products/category-roofrack.jpg',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
               <line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="16" x2="22" y2="16"/><line x1="6" y1="8" x2="6" y2="16"/><line x1="18" y1="8" x2="18" y2="16"/>
             </svg>`,
    },
    {
      id: 'accessories', label: t('home.catAccessories'), type: t('home.catTypeAccessories'),
      img: '/assets/products/cargo-net.jpg',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
               <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
             </svg>`,
    },
    {
      id: 'bundles', label: t('home.catBundles'), type: t('home.catTypeBundles'),
      img: '/assets/products/starter-bundle.jpg',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
               <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/>
             </svg>`,
    },
  ];
}

// ── Default skills content — used as fallback if API is unavailable ───────
function getDefaultSkillsContent() {
  return {
    eyebrow:     t('home.skillsEyebrow'),
    title:       t('home.skillsTitle'),
    description: t('home.skillsDesc'),
    items: [
      { label: t('home.skillCapacity'),    value: t('home.skillCapacityVal') },
      { label: t('home.skillMount'),       value: t('home.skillMountVal') },
      { label: t('home.skillMaterials'),   value: t('home.skillMaterialsVal') },
      { label: t('home.skillAero'),        value: t('home.skillAeroVal') },
      { label: t('home.skillSecurity'),    value: t('home.skillSecurityVal') },
      { label: t('home.skillWarranty'),    value: t('home.skillWarrantyVal') },
    ],
    image_url: '/assets/products/b1.JPG',
  };
}

// ── Stats (built dynamically for i18n) ───────────────────────────────────
function getStats() {
  return [
    { num: t('home.stat1'),  label: t('home.stat1Label') },
    { num: t('home.stat2'),  label: t('home.stat2Label') },
    { num: t('home.stat3'),  label: t('home.stat3Label') },
    { num: t('home.stat4'),  label: t('home.stat4Label') },
  ];
}

// ─────────────────────────────────────────────────────────────────────────
export class HomeView {
  constructor() {
    this._content = null; // loaded from API in render()
    this._newsArticles = [];
  }

  async render() {
    await Promise.all([this._loadContent(), this._loadNews()]);

    const view = document.createElement('div');
    view.className = 'view';

    view.innerHTML = `
      ${this._hero()}
      ${this._news()}
      ${this._projects()}
      ${this._skills()}
      ${this._stats()}
      ${this._contact()}
      ${this._footer()}
    `;

    this._initProjects(view);
    this._initContactForm(view);
    this._initHeroVideo(view);
    this._initSkillsEdit(view);
    this._initFooterLinks(view);
    return view;
  }

  // ── Load skills content — always use i18n translations ──────────────────
  async _loadContent() {
    // Use i18n-driven content so it responds to language switching.
    // The DB-stored content (site_content.home_skills) is ignored in favor
    // of the translation files which support IS/EN switching.
    this._content = { ...getDefaultSkillsContent() };
  }

  // ── SECTION 1: Hero ────────────────────────────────────────────────────
  _hero() {
    return `
    <section class="lol-hero" aria-label="Introduction">
      <video class="lol-hero__video" autoplay muted loop playsinline aria-hidden="true">
        <source src="/assets/videos/hero-bg.mp4" type="video/mp4">
      </video>
      <div class="lol-hero__overlay" aria-hidden="true"></div>

      <div class="lol-hero__content">
        <h1 class="lol-hero__title">
          <span>${t('home.heroTitle1')}</span>
          <span class="lol-hero__title-second">${t('home.heroTitle2')}</span>
        </h1>
        <p class="lol-hero__subtitle">
          ${t('home.heroSubtitle')}
        </p>
        <a href="#/projects" class="lol-hero__cta">${t('home.heroCta')}</a>
      </div>

      <div class="lol-hero__scroll" aria-hidden="true">
        <span>${t('home.scroll')}</span>
        <div class="lol-hero__scroll-line"></div>
      </div>
    </section>`;
  }

  // ── Load news articles from API ─────────────────────────────────────────
  async _loadNews() {
    try {
      const res = await fetch('/api/v1/news?limit=3');
      if (res.ok) {
        const data = await res.json();
        this._newsArticles = data.articles || [];
      }
    } catch { /* network error — show empty */ }
  }

  // ── SECTION 2: News ───────────────────────────────────────────────────
  _news() {
    if (this._newsArticles.length === 0) return '';

    const catClass = cat => ['carpentry', 'tech', 'announcement'].includes(cat) ? cat : 'news';
    const fmtDate = iso => {
      if (!iso) return '';
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    };

    const cards = this._newsArticles.map(a => {
      const imgHtml = a.cover_image
        ? `<img class="lol-news__card-img" src="${escHtml(a.cover_image)}" alt="${escHtml(a.title)}" loading="lazy" width="800" height="450">`
        : `<div class="lol-news__card-img lol-news__card-img--placeholder" aria-hidden="true"></div>`;

      return `
      <a href="#/news/${escHtml(a.slug)}" class="lol-news__card lol-news__card--link">
        ${imgHtml}
        <div class="lol-news__card-body">
          <div class="lol-news__card-meta">
            <span class="lol-news__card-tag lol-news__card-tag--${catClass(a.category)}">${escHtml((a.category || 'news').toUpperCase())}</span>
            <time class="lol-news__card-date" datetime="${escHtml(a.published_at || a.created_at)}">${fmtDate(a.published_at || a.created_at)}</time>
          </div>
          <h3 class="lol-news__card-title">${escHtml(a.title)}</h3>
          <p class="lol-news__card-desc">${escHtml(a.summary)}</p>
        </div>
      </a>`;
    }).join('');

    return `
    <section class="lol-news" id="news" aria-label="Latest news">
      <div class="lol-news__inner">
        <div class="lol-news__header">
          <a href="#/news" class="lol-news__heading-link"><h2 class="lol-news__heading">${t('home.newsHeading')}</h2></a>
          <a href="#/news" class="lol-news__view-all">
            ${t('home.newsViewAll')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>
        <div class="lol-news__grid">${cards}</div>
      </div>
    </section>`;
  }

  // ── SECTION 4: Projects — champion-selector style ──────────────────────
  _projects() {
    const categories = getCategories();
    const first = categories[0];

    const catIcons = categories.map((c, i) => `
      <div class="lol-projects__cat${i === 0 ? ' active' : ''}"
           data-cat="${c.id}" role="tab" tabindex="${i === 0 ? '0' : '-1'}"
           aria-selected="${i === 0 ? 'true' : 'false'}" aria-label="${c.label}">
        <div class="lol-projects__cat-icon">${c.icon}</div>
        <span class="lol-projects__cat-label">${c.label}</span>
      </div>
    `).join('');

    return `
    <section class="lol-projects" aria-label="Project categories">
      <div class="lol-projects__inner">

        <div class="lol-projects__left">
          <p class="lol-projects__eyebrow">${t('home.browseBy')}</p>
          <h2 class="lol-projects__heading">${t('home.category')}</h2>
          <p class="lol-projects__desc">
            ${t('home.categoryDesc')}
          </p>
          <div class="lol-projects__btns">
            <a href="#/projects" class="lol-btn--gold">${t('home.shopAll')}</a>
            <a href="#/" class="lol-btn--teal" id="contact-btn">${t('home.getInTouch')}</a>
          </div>
          <div class="lol-projects__categories" role="tablist" aria-label="Project disciplines">
            ${catIcons}
          </div>
        </div>

        <div class="lol-projects__right">
          <div class="lol-projects__circle">
            <img id="projects-preview-img"
                 class="lol-projects__preview-img"
                 src="${first.img}" alt="${first.label} projects preview"
                 width="800" height="800" loading="lazy">
          </div>
          <div class="lol-projects__preview-name">
            <p id="projects-preview-title" class="lol-projects__preview-title">${first.label}</p>
            <p id="projects-preview-type"  class="lol-projects__preview-type">${first.type}</p>
          </div>
        </div>

      </div>
    </section>`;
  }

  // ── SECTION 5: Skills ──────────────────────────────────────────────────
  _skills() {
    const c         = this._content;
    const titleHtml = escHtml(c.title).replace(/\n/g, '<br>');
    const items     = c.items.map((s, i) => `
      <div class="lol-skills__item" data-item-index="${i}" role="listitem">
        <div class="lol-skills__item-label" data-item="label">${escHtml(s.label)}</div>
        <div class="lol-skills__item-value" data-item="value">${escHtml(s.value)}</div>
      </div>
    `).join('');

    return `
    <section class="lol-skills" aria-label="Skills and expertise">
      <div class="lol-skills__bg" aria-hidden="true"></div>
      <div class="lol-skills__inner">

        <div>
          <p class="lol-skills__tag" data-field="eyebrow">${escHtml(c.eyebrow)}</p>
          <h2 class="lol-skills__title" data-field="title">${titleHtml}</h2>
          <p class="lol-skills__desc" data-field="desc">${escHtml(c.description)}</p>
          <div class="lol-skills__grid" role="list" aria-label="Skill areas">
            ${items}
          </div>
        </div>

        <div class="lol-skills__img-wrap">
          <img class="lol-skills__img"
               src="${escHtml(c.image_url)}"
               alt="Skills section image" loading="lazy"
               width="700" height="900">
        </div>

      </div>
    </section>`;
  }

  // ── SECTION 6: Stats ──────────────────────────────────────────────────
  _stats() {
    const stats = getStats();
    const items = stats.map(s => `
      <div class="lol-stats__item">
        <div class="lol-stats__num" aria-label="${s.num} ${s.label}">${s.num}</div>
        <div class="lol-stats__label" aria-hidden="true">${s.label}</div>
      </div>
    `).join('');

    return `
    <section class="lol-stats" aria-label="Key figures">
      <div class="lol-stats__inner">${items}</div>
    </section>`;
  }

  // ── SECTION 7: Contact CTA + Form ─────────────────────────────────────
  _contact() {
    return `
    <section class="lol-contact" id="contact" aria-label="Contact">
      <div class="lol-contact__bg" aria-hidden="true"></div>
      <div class="lol-contact__inner">
        <p class="lol-contact__eyebrow">${t('home.contactEyebrow')}</p>
        <h2 class="lol-contact__title">
          ${t('home.contactTitle').replace(/\n/g, '<br>')}
        </h2>
        <form class="contact-form" id="contact-form" novalidate aria-label="Contact form">
          <!-- Honeypot — hidden from real users, bots fill it in -->
          <input type="text" name="website" id="contact-honeypot"
                 tabindex="-1" autocomplete="off" aria-hidden="true"
                 style="position:absolute;left:-9999px;opacity:0;height:0;width:0;pointer-events:none;" />
          <div class="contact-form__row">
            <div class="contact-form__field">
              <label for="contact-name" class="contact-form__label">${t('contact.name')} <span aria-hidden="true" class="required-mark">${t('contact.required')}</span></label>
              <input type="text" id="contact-name" name="name" class="contact-form__input"
                     required autocomplete="name" placeholder="${t('contact.namePlaceholder')}" maxlength="100" />
            </div>
            <div class="contact-form__field">
              <label for="contact-email" class="contact-form__label">${t('contact.email')} <span aria-hidden="true" class="required-mark">${t('contact.required')}</span></label>
              <input type="email" id="contact-email" name="email" class="contact-form__input"
                     required autocomplete="email" placeholder="${t('contact.emailPlaceholder')}" maxlength="200" />
            </div>
          </div>
          <div class="contact-form__field">
            <label for="contact-message" class="contact-form__label">${t('contact.message')} <span aria-hidden="true" class="required-mark">${t('contact.required')}</span></label>
            <textarea id="contact-message" name="message" class="contact-form__textarea"
                      required rows="5" placeholder="${t('contact.messagePlaceholder')}" maxlength="2000"></textarea>
          </div>
          <div aria-live="polite" id="contact-status" class="contact-form__status"></div>
          <button type="submit" class="lol-contact__btn contact-form__submit" id="contact-submit">
            ${t('contact.send')}
          </button>
        </form>

      </div>
    </section>`;
  }

  // ── Footer ─────────────────────────────────────────────────────────────
  _footer() {
    return `
    <footer class="lol-footer">

      <nav class="lol-footer__top" aria-label="Footer navigation">
        <a href="#/projects" class="lol-footer__nav-link">${t('nav.products')}</a>
        <a href="#/news" class="lol-footer__nav-link">${t('nav.news')}</a>
        <a href="#/about" class="lol-footer__nav-link">${t('nav.about')}</a>
        <a href="#/contact" class="lol-footer__nav-link">${t('nav.contact')}</a>
      </nav>

      <div class="lol-footer__social">
        <a id="footer-email-icon" href="#contact"
           class="lol-footer__social-icon" aria-label="Send email">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <polyline points="2,4 12,13 22,4"/>
          </svg>
        </a>
      </div>

      <div class="lol-footer__brand">
        <div class="lol-footer__logo">${t('home.footerBrand')}</div>
        <p class="lol-footer__copy">
          &copy; ${new Date().getFullYear()} ${t('home.footerCopy')}
        </p>
        <nav class="lol-footer__legal" aria-label="Legal navigation">
          <a href="#/privacy" class="lol-footer__legal-link">${t('home.privacyPolicy')}</a>
          <a href="#/terms"   class="lol-footer__legal-link">${t('home.termsOfService')}</a>
        </nav>
      </div>

    </footer>`;
  }

  // ── Footer email icon ────────────────────────────────────────────────
  _initFooterLinks(view) {
    const icon = view.querySelector('#footer-email-icon');
    if (icon) icon.href = 'mailto:info@ferdabox.is';
  }

  // ── Hero — no video, just static ──────────────────────────────────────
  _initHeroVideo() { /* no-op — video removed */ }

  // ── Projects section — category switching logic ────────────────────────
  _initProjects(view) {
    const categories = getCategories();
    const cats    = view.querySelectorAll('.lol-projects__cat');
    const img     = view.querySelector('#projects-preview-img');
    const title   = view.querySelector('#projects-preview-title');
    const type    = view.querySelector('#projects-preview-type');
    const contact = view.querySelector('#contact-btn');

    if (contact) {
      contact.addEventListener('click', e => {
        e.preventDefault();
        const section = document.getElementById('contact');
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      });
    }

    cats.forEach(cat => {
      const activate = () => {
        const id   = cat.dataset.cat;
        const data = categories.find(c => c.id === id);
        if (!data) return;

        cats.forEach(c => {
          c.classList.toggle('active', c.dataset.cat === id);
          c.setAttribute('aria-selected', c.dataset.cat === id ? 'true' : 'false');
          c.setAttribute('tabindex', c.dataset.cat === id ? '0' : '-1');
        });

        img.style.opacity = '0';
        setTimeout(() => {
          img.src          = data.img;
          img.alt          = `${data.label} projects preview`;
          title.textContent = data.label;
          type.textContent  = data.type;
          img.style.opacity = '1';
        }, 350);
      };

      cat.addEventListener('click', activate);
      cat.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
      });
    });
  }

  // ── Skills section — inline edit for admin/moderator ──────────────────
  _initSkillsEdit(view) {
    if (!isAdmin() && !hasRole('moderator')) return;

    const section = view.querySelector('.lol-skills');
    if (!section) return;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className   = 'lol-skills__edit-btn';
    editBtn.id          = 'home-edit-btn';
    editBtn.type        = 'button';
    editBtn.setAttribute('aria-label', 'Edit skills section');
    editBtn.setAttribute('data-testid', 'edit-page-btn');
    editBtn.innerHTML   = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      ${t('common.editSection')}`;
    section.style.position = 'relative';
    section.appendChild(editBtn);

    // Save / cancel bar
    const controls = document.createElement('div');
    controls.className  = 'lol-skills__edit-controls lol-skills__edit-controls--hidden';
    controls.id         = 'home-edit-bar';
    controls.setAttribute('data-testid', 'edit-controls');
    controls.innerHTML  = `
      <button type="button" class="lol-skills__save-btn" id="home-edit-save" data-testid="edit-save-btn">${t('common.saveChanges')}</button>
      <button type="button" class="lol-skills__cancel-btn" id="home-edit-cancel" data-testid="edit-cancel-btn">${t('common.cancel')}</button>
      <span   class="lol-skills__edit-status" aria-live="polite"></span>`;
    section.appendChild(controls);

    let _snapshot = null; // saved copy for cancel

    editBtn.addEventListener('click', () => {
      _snapshot = JSON.parse(JSON.stringify(this._content));
      this._enterEdit(section, editBtn, controls);
    });

    controls.querySelector('.lol-skills__save-btn').addEventListener('click', () =>
      this._saveEdit(section, controls)
    );

    controls.querySelector('.lol-skills__cancel-btn').addEventListener('click', () => {
      this._exitEdit(section, editBtn, controls);
      if (_snapshot) this._restoreEdit(section, _snapshot);
    });
  }

  _enterEdit(section, editBtn, controls) {
    section.classList.add('lol-skills--editing');
    editBtn.classList.add('lol-skills__edit-btn--hidden');
    controls.classList.remove('lol-skills__edit-controls--hidden');

    // Make text fields editable
    section.querySelectorAll('[data-field], [data-item]').forEach(el => {
      el.contentEditable = 'true';
      el.spellcheck      = true;
    });

    // Image overlay
    const imgWrap = section.querySelector('.lol-skills__img-wrap');
    const overlay = document.createElement('div');
    overlay.className = 'lol-skills__img-overlay';
    overlay.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
      <span>${t('common.changeImage')}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp"
             class="lol-img-file-input" aria-label="Upload replacement image">`;
    imgWrap.appendChild(overlay);

    overlay.querySelector('.lol-img-file-input').addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this._uploadImage(file, section, controls);
    });
  }

  _exitEdit(section, editBtn, controls) {
    section.classList.remove('lol-skills--editing');
    editBtn.classList.remove('lol-skills__edit-btn--hidden');
    controls.classList.add('lol-skills__edit-controls--hidden');
    controls.querySelector('.lol-skills__edit-status').textContent = '';

    section.querySelectorAll('[data-field], [data-item]').forEach(el => {
      el.contentEditable = 'false';
      el.removeAttribute('contenteditable');
    });

    section.querySelector('.lol-skills__img-overlay')?.remove();
  }

  _restoreEdit(section, snapshot) {
    const titleHtml = escHtml(snapshot.title).replace(/\n/g, '<br>');
    section.querySelector('[data-field="eyebrow"]').innerHTML = escHtml(snapshot.eyebrow);
    section.querySelector('[data-field="title"]').innerHTML   = titleHtml;
    section.querySelector('[data-field="desc"]').innerHTML    = escHtml(snapshot.description);
    section.querySelector('.lol-skills__img').src             = snapshot.image_url;

    section.querySelectorAll('[data-item-index]').forEach(el => {
      const i = parseInt(el.dataset.itemIndex, 10);
      if (!snapshot.items[i]) return;
      el.querySelector('[data-item="label"]').innerHTML = escHtml(snapshot.items[i].label);
      el.querySelector('[data-item="value"]').innerHTML = escHtml(snapshot.items[i].value);
    });

    this._content = snapshot;
  }

  async _uploadImage(file, section, controls) {
    const status = controls.querySelector('.lol-skills__edit-status');
    status.textContent = t('common.uploading');

    try {
      const token = await getCSRFToken();
      const fd    = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/v1/content/home_skills/image', {
        method:      'POST',
        credentials: 'include',
        headers:     token ? { 'X-CSRF-Token': token } : {},
        body:        fd,
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');

      const { image_url } = await res.json();
      section.querySelector('.lol-skills__img').src = image_url;
      this._content = { ...this._content, image_url };
      status.textContent = t('common.imageUpdated');
    } catch (err) {
      status.textContent = `${t('common.uploadError')} ${err.message}`;
    }
  }

  async _saveEdit(section, controls) {
    const status = controls.querySelector('.lol-skills__edit-status');
    status.textContent = t('common.saving');

    // Collect text from DOM
    const eyebrow = section.querySelector('[data-field="eyebrow"]')?.innerText.trim() ?? this._content.eyebrow;
    const title   = section.querySelector('[data-field="title"]')?.innerText.trim()   ?? this._content.title;
    const desc    = section.querySelector('[data-field="desc"]')?.innerText.trim()    ?? this._content.description;

    const items = [];
    section.querySelectorAll('[data-item-index]').forEach(el => {
      items.push({
        label: el.querySelector('[data-item="label"]')?.innerText.trim() ?? '',
        value: el.querySelector('[data-item="value"]')?.innerText.trim() ?? '',
      });
    });

    const updated = { ...this._content, eyebrow, title, description: desc, items };

    try {
      const token = await getCSRFToken();
      const res   = await fetch('/api/v1/content/home_skills', {
        method:      'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-CSRF-Token': token } : {}),
        },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');

      this._content  = await res.json();
      status.textContent = t('common.saved');
      setTimeout(() => { status.textContent = ''; }, 2500);
    } catch (err) {
      status.textContent = `${t('common.error')}: ${err.message}`;
    }
  }

  // ── Contact form — fetch submission ───────────────────────────────────
  _initContactForm(view) {
    const form   = view.querySelector('#contact-form');
    const status = view.querySelector('#contact-status');
    const submit = view.querySelector('#contact-submit');
    if (!form) return;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const honeypot = form.querySelector('#contact-honeypot').value;
      const name    = form.querySelector('#contact-name').value.trim();
      const email   = form.querySelector('#contact-email').value.trim();
      const message = form.querySelector('#contact-message').value.trim();

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
          throw new Error(data.error || t('contact.error'));
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
