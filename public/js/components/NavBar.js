import { isAuthenticated, isAdmin, getUser, logout } from '../services/auth.js';
import { LoginModal } from './LoginModal.js';
import { t, getLang, setLang } from '../i18n/index.js';

const avatarPathByName = name => `/assets/avatars/${name || 'avatar-01.svg'}`;

let _partyAccess = false;
async function _checkPartyAccess() {
  if (!isAuthenticated()) { _partyAccess = false; return; }
  try {
    const res  = await fetch('/api/v1/party/access', { credentials: 'include' });
    const data = await res.json();
    _partyAccess = !!data.hasAccess;
  } catch { _partyAccess = false; }
}

export class NavBar {
  constructor() {
    this._loginModal = new LoginModal();
  }

  render() {
    const nav = document.createElement('nav');
    nav.className = 'lol-nav';
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML = `
      <!-- Left: Brand -->
      <div class="lol-nav__brand">
        <a href="#/" class="lol-nav__logo" data-route="/" aria-label="${t('nav.home_aria')}">
          <div class="lol-nav__logo-icon" aria-hidden="true">F</div>
          <div class="lol-nav__logo-text">Ferða<br>Box</div>
        </a>
      </div>

      <!-- Center: Navigation links -->
      <div class="lol-nav__center" id="nav-menu">
        <a href="#/" class="lol-nav__link" data-route="/">${t('nav.home')}</a>
        <a href="#/projects" class="lol-nav__link" data-route="/projects">${t('nav.products')}</a>
        <a href="#/news" class="lol-nav__link" data-route="/news">${t('nav.news')}</a>
        <a href="#/about" class="lol-nav__link" data-route="/about">${t('nav.about')}</a>
        <a href="#/contact" class="lol-nav__link" data-route="/contact">${t('nav.contact')}</a>
        <a href="#/cart" class="lol-nav__link lol-nav__cart-link" data-route="/cart"
           id="nav-cart-link" aria-label="${t('nav.shoppingCart')}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span class="lol-nav__cart-count" id="nav-cart-count" style="display:none">0</span>
        </a>
        <a href="#/party" class="lol-nav__link lol-nav__party-link" data-route="/party"
           id="nav-party-link" style="display:none" aria-label="Party">Party</a>
        <div class="lol-nav__lang lol-nav__lang-mobile" id="nav-lang-mobile">
          <button class="lol-nav__lang-btn${getLang() === 'is' ? ' active' : ''}" data-lang="is">IS</button>
          <button class="lol-nav__lang-btn${getLang() === 'en' ? ' active' : ''}" data-lang="en">EN</button>
        </div>
      </div>

      <!-- Right: Language toggle + Hamburger + Auth -->
      <div class="lol-nav__right">
        <div class="lol-nav__lang" id="nav-lang">
          <button class="lol-nav__lang-btn${getLang() === 'is' ? ' active' : ''}" data-lang="is">IS</button>
          <button class="lol-nav__lang-btn${getLang() === 'en' ? ' active' : ''}" data-lang="en">EN</button>
        </div>
        <button class="lol-nav__hamburger" id="nav-hamburger"
                aria-label="${t('nav.openMenu')}" aria-expanded="false" aria-controls="nav-menu">
          <span></span><span></span><span></span>
        </button>
        <div class="lol-nav__auth" id="nav-auth"></div>
      </div>
    `;

    this._nav = nav;
    this._renderAuth();
    this._bindScrollLinks(nav);
    this._bindHomeLinks(nav);
    this._bindHamburger(nav);
    this._bindLangToggle(nav);

    window.addEventListener('authchange', () => {
      this._renderAuth();
      _checkPartyAccess().then(() => this._updatePartyLink());
    });

    _checkPartyAccess().then(() => this._updatePartyLink());

    return nav;
  }

  _updatePartyLink() {
    const link =
      document.getElementById('nav-party-link') ||
      this._nav?.querySelector('#nav-party-link');
    if (link) link.style.display = _partyAccess ? '' : 'none';
  }

  _renderAuth() {
    const container =
      document.getElementById('nav-auth') ||
      this._nav?.querySelector('#nav-auth');
    if (!container) return;
    container.innerHTML = '';

    if (isAuthenticated()) {
      const user = getUser();

      // Avatar + username dropdown trigger
      const userBtn = document.createElement('button');
      userBtn.className = 'lol-nav__user-btn';
      userBtn.setAttribute('aria-haspopup', 'true');
      userBtn.setAttribute('aria-expanded', 'false');
      userBtn.setAttribute('aria-label', 'User menu');
      userBtn.setAttribute('data-testid', 'nav-user-btn');
      userBtn.innerHTML = `
        <img class="lol-nav__user-avatar" src="${avatarPathByName(user?.avatar)}"
             alt="${user?.username || 'User'}" />
        <span class="lol-nav__user-name">${user?.displayName || user?.username || t('nav.account')}</span>
        <span class="lol-nav__user-caret" aria-hidden="true">▾</span>
      `;

      // Dropdown menu
      const dropdown = document.createElement('div');
      dropdown.className = 'lol-nav__dropdown';
      dropdown.setAttribute('role', 'menu');
      dropdown.innerHTML = `
        <a href="#/profile" class="lol-nav__dropdown-item" role="menuitem" data-route="/profile">
          ${t('nav.profile')}
        </a>
        ${isAdmin() ? `
        <a href="#/admin" class="lol-nav__dropdown-item" role="menuitem" data-route="/admin">
          ${t('nav.manageProducts')}
        </a>
        <a href="#/admin/users" class="lol-nav__dropdown-item" role="menuitem" data-route="/admin/users">
          ${t('nav.manageUsers')}
        </a>` : ''}
        <hr class="lol-nav__dropdown-divider"/>
        <button class="lol-nav__dropdown-item lol-nav__dropdown-item--danger" role="menuitem" id="nav-signout-btn" data-testid="nav-signout">
          ${t('nav.signOut')}
        </button>
      `;

      const wrapper = document.createElement('div');
      wrapper.className = 'lol-nav__user-wrap';
      wrapper.appendChild(userBtn);
      wrapper.appendChild(dropdown);

      // Toggle dropdown
      userBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = dropdown.classList.toggle('open');
        userBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      // Close on outside click
      document.addEventListener('click', () => {
        dropdown.classList.remove('open');
        userBtn.setAttribute('aria-expanded', 'false');
      });

      // Sign out
      dropdown.querySelector('#nav-signout-btn').addEventListener('click', async () => {
        await logout();
        window.location.hash = '#/';
      });

      container.appendChild(wrapper);

    } else {
      // Sign In button
      const signIn = document.createElement('button');
      signIn.className = 'lol-nav__cta lol-nav__cta--ghost';
      signIn.setAttribute('data-testid', 'nav-signin');
      signIn.textContent = t('nav.signIn');
      signIn.addEventListener('click', () => this._loginModal.open());

      // Sign Up button
      const signUp = document.createElement('a');
      signUp.className = 'lol-nav__cta lol-nav__cta--ghost';
      signUp.setAttribute('data-testid', 'nav-signup');
      signUp.href = '#/signup';
      signUp.dataset.route = '/signup';
      signUp.textContent = t('nav.signUp');

      container.appendChild(signIn);
      container.appendChild(signUp);
    }
  }

  _bindHomeLinks(nav) {
    nav.querySelectorAll('[data-route="/"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this._closeMenu();
        const onHome = window.location.hash === '#/' || window.location.hash === '';
        if (onHome) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.location.hash = '#/';
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }
      });
    });
  }

  _bindScrollLinks(nav) {
    nav.querySelectorAll('[data-scroll]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this._closeMenu();
        const id = link.dataset.scroll;
        if (window.location.hash !== '#/' && !window.location.hash.startsWith('#/?')) {
          window.location.hash = '#/';
          setTimeout(() => {
            const target = document.getElementById(id);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        } else {
          const target = document.getElementById(id);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  _bindHamburger(nav) {
    const hamburger = nav.querySelector('#nav-hamburger');
    const menu      = nav.querySelector('#nav-menu');
    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    });

    menu.querySelectorAll('.lol-nav__link').forEach(link => {
      link.addEventListener('click', () => this._closeMenu());
    });

    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) this._closeMenu();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this._closeMenu();
    });
  }

  _closeMenu() {
    const menu      = this._nav?.querySelector('#nav-menu');
    const hamburger = this._nav?.querySelector('#nav-hamburger');
    if (!menu) return;
    menu.classList.remove('open');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.setAttribute('aria-label', 'Open navigation menu');
    }
  }

  _bindLangToggle(nav) {
    const langBtns = nav.querySelectorAll('.lol-nav__lang-btn');
    langBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        setLang(lang);
        // Active state is updated on re-render via languagechange event
      });
    });
  }

  setActive(route) {
    document.querySelectorAll('.lol-nav__link[data-route]').forEach(a => {
      a.classList.toggle('active', a.dataset.route === route);
    });
  }
}
