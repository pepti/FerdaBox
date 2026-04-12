// HalliView — About Us page for Ferda Box
// Full-screen sections, scroll animations, counter stats

import { t } from '../i18n/index.js';

// ── Wave SVG helper ────────────────────────────────────────────────────────
function wave(fromBg, toFill, flip = false) {
  const path = flip
    ? 'M0,40 C480,0 960,80 1440,40 L1440,80 L0,80 Z'
    : 'M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z';
  return `<div class="hb-wave" style="background:${fromBg}">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80"
         preserveAspectRatio="none" aria-hidden="true" height="80">
      <path d="${path}" fill="${toFill}"/>
    </svg>
  </div>`;
}

// ── HalliView class ────────────────────────────────────────────────────────
export class HalliView {
  constructor() {
    this._observer     = null;
    this._counterObs   = null;
    this._countersAnimated = false;
  }

  async render() {
    const view = document.createElement('div');
    view.className = 'view halli-bio';

    view.innerHTML = `
      ${this._hero()}
      ${wave('#000', '#040c1a')}
      ${this._chapterOne()}
      ${wave('#040c1a', '#060e1c', true)}
      ${this._chapterTwo()}
      ${wave('#060e1c', '#040c1a')}
      ${this._counters()}
      ${wave('#040c1a', '#080700', true)}
      ${this._chapterThree()}
      ${wave('#080700', '#040c1a')}
    `;

    this._initScrollReveal(view);
    this._initCounters(view);
    this._initVideo(view);

    return view;
  }

  destroy() {
    this._observer?.disconnect();
    this._counterObs?.disconnect();
  }

  // ── SECTION: Hero ─────────────────────────────────────────────────────────
  _hero() {
    return `
    <section class="hb-hero" aria-label="${t('nav.about')}">
      <video class="hb-hero__video" autoplay muted loop playsinline
             preload="auto" aria-hidden="true">
        <source src="/assets/videos/waterfall-bk-v1.mp4" type="video/mp4">
      </video>
      <div class="hb-hero__overlay" aria-hidden="true"></div>
      <div class="hb-hero__content">
        <h1 class="hb-hero__name" aria-label="Ferða Box">${t('home.heroTitle1')} ${t('home.heroTitle2')}</h1>
        <p class="hb-hero__tagline">${t('about.heroTagline')}</p>
      </div>
      <div class="hb-hero__scroll" aria-hidden="true">
        <span>${t('home.scroll')}</span>
        <div class="hb-hero__scroll-arrow"></div>
      </div>
    </section>`;
  }

  // ── SECTION: Chapter One — Our Story ──────────────────────────────────────
  _chapterOne() {
    return `
    <section class="hb-section hb-section--1" aria-labelledby="hb-chapter1-title">
      <div class="hb-inner">
        <div class="hb-two-col">
          <div>
            <span class="hb-eyebrow hb-reveal">${t('about.chapterOneEyebrow')}</span>
            <h2 class="hb-title hb-reveal hb-d1" id="hb-chapter1-title">${t('about.chapterOneTitle')}</h2>
            <p class="hb-body hb-reveal hb-d2">${t('about.chapterOneText')}</p>
            <p class="hb-body hb-reveal hb-d3">${t('about.chapterOneText2')}</p>
          </div>
          <div class="hb-reveal hb-reveal--right hb-d2" aria-hidden="true"
               style="display:flex;align-items:center;justify-content:center">
            ${this._icelandSvg()}
          </div>
        </div>
      </div>
    </section>`;
  }

  // ── SECTION: Chapter Two — Quality ────────────────────────────────────────
  _chapterTwo() {
    return `
    <section class="hb-section hb-section--2" aria-labelledby="hb-chapter2-title">
      <div class="hb-inner">
        <span class="hb-eyebrow hb-reveal">${t('about.chapterTwoEyebrow')}</span>
        <h2 class="hb-title hb-reveal hb-d1" id="hb-chapter2-title">${t('about.chapterTwoTitle')}</h2>
        <div class="hb-two-col">
          <div>
            <p class="hb-body hb-reveal hb-d2">${t('about.chapterTwoText')}</p>
            <p class="hb-body hb-reveal hb-d3">${t('about.chapterTwoText2')}</p>
          </div>
        </div>
      </div>
    </section>`;
  }

  // ── SECTION: Counters ─────────────────────────────────────────────────────
  _counters() {
    return `
    <section class="hb-section hb-section--amber hb-counters" aria-label="Key stats">
      <div class="hb-counters__grid">
        <div class="hb-reveal hb-reveal--scale">
          <span class="hb-counter__num" data-counter="counter1"
                data-target="${t('about.counter1Num')}">0</span>
          <span class="hb-counter__label">${t('about.counter1Label')}</span>
        </div>
        <div class="hb-reveal hb-reveal--scale hb-d1">
          <span class="hb-counter__num" data-counter="counter2"
                data-target="${t('about.counter2Num')}">0</span>
          <span class="hb-counter__label">${t('about.counter2Label')}</span>
        </div>
        <div class="hb-reveal hb-reveal--scale hb-d2">
          <span class="hb-counter__num" data-counter="counter3"
                data-target="${t('about.counter3Num')}">0</span>
          <span class="hb-counter__label">${t('about.counter3Label')}</span>
        </div>
        <div class="hb-reveal hb-reveal--scale hb-d3">
          <span class="hb-counter__num" data-counter="counter4"
                data-target="${t('about.counter4Num')}">0</span>
          <span class="hb-counter__label">${t('about.counter4Label')}</span>
        </div>
      </div>
    </section>`;
  }

  // ── SECTION: Chapter Three — Service ──────────────────────────────────────
  _chapterThree() {
    return `
    <section class="hb-section hb-section--1" aria-labelledby="hb-chapter3-title">
      <div class="hb-inner">
        <div style="max-width:800px;margin:0 auto;padding:0 clamp(20px,6vw,80px)">
          <span class="hb-eyebrow hb-reveal">${t('about.chapterThreeEyebrow')}</span>
          <h2 class="hb-title hb-reveal hb-d1" id="hb-chapter3-title">${t('about.chapterThreeTitle')}</h2>
          <p class="hb-body hb-reveal hb-d2">${t('about.chapterThreeText')}</p>
          <p class="hb-body hb-reveal hb-d3">${t('about.chapterThreeText2')}</p>
          <a href="#/contact" class="hb-cta hb-reveal hb-d4">${t('home.getInTouch')}</a>
        </div>
      </div>
    </section>`;
  }

  // ── Decorative Iceland SVG ────────────────────────────────────────────────
  _icelandSvg() {
    return `
    <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg"
         style="max-width:280px;width:100%;opacity:0.35" aria-hidden="true">
      <path d="M40,180 Q80,100 160,80 Q220,65 280,90 Q300,140 260,170 Q200,200 120,195 Q70,192 40,180 Z"
            fill="none" stroke="rgba(200,170,110,0.6)" stroke-width="1.5"/>
      <path d="M155,80 L140,135 L170,135 Z"
            fill="none" stroke="rgba(200,170,110,0.4)" stroke-width="1"/>
      <circle cx="80"  cy="40" r="1"   fill="rgba(200,170,110,0.5)"/>
      <circle cx="140" cy="25" r="1.5" fill="rgba(200,170,110,0.6)"/>
      <circle cx="200" cy="35" r="1"   fill="rgba(200,170,110,0.5)"/>
      <circle cx="250" cy="20" r="1"   fill="rgba(200,170,110,0.4)"/>
      <circle cx="290" cy="50" r="1.5" fill="rgba(200,170,110,0.5)"/>
      <circle cx="50"  cy="60" r="1"   fill="rgba(200,170,110,0.4)"/>
      <path d="M30,70 Q100,50 200,65 Q260,72 300,55"
            fill="none" stroke="rgba(11,196,227,0.15)" stroke-width="3"/>
      <path d="M20,85 Q120,65 220,78 Q270,83 310,70"
            fill="none" stroke="rgba(11,196,227,0.1)" stroke-width="2"/>
    </svg>`;
  }

  // ── Init: scroll reveal via IntersectionObserver ──────────────────────────
  _initScrollReveal(view) {
    const els = view.querySelectorAll('.hb-reveal');
    if (!els.length) return;

    this._observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            this._observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach(el => this._observer.observe(el));
  }

  // ── Init: counter animations ──────────────────────────────────────────────
  _initCounters(view) {
    const counters = view.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    this._counterObs = new IntersectionObserver(
      entries => {
        if (this._countersAnimated) return;
        if (entries.some(e => e.isIntersecting)) {
          this._countersAnimated = true;
          counters.forEach(el => this._animateCounter(el, el.dataset.target));
          this._counterObs.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    counters.forEach(el => this._counterObs.observe(el));
  }

  _animateCounter(el, target) {
    const m = String(target).match(/^(\d+(?:\.\d+)?)(.*)/);
    if (!m) { el.textContent = target; return; }

    const num    = parseFloat(m[1]);
    const suffix = m[2];
    const dur    = 1400;
    const t0     = performance.now();

    const step = ts => {
      const p = Math.min((ts - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(num * e) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ── Init: hero video autoplay ─────────────────────────────────────────────
  _initVideo(view) {
    const video = view.querySelector('.hb-hero__video');
    if (!video) return;
    requestAnimationFrame(() => {
      video.play().catch(() => {
        const resume = () => { video.play().catch(() => {}); };
        document.addEventListener('click', resume, { once: true });
      });
    });
  }
}
