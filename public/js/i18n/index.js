import is from './is.js';
import en from './en.js';

const translations = { is, en };

// Resolve a dot-path key like 'nav.home' from a nested object
function resolve(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

let currentLang = localStorage.getItem('ferdabox_lang') || 'is';

/**
 * Translate a key, e.g. t('nav.home')
 * Supports simple {placeholder} interpolation: t('products.count', { count: 5 })
 */
export function t(key, params) {
  let val = resolve(translations[currentLang], key)
         ?? resolve(translations.is, key)
         ?? key;
  if (params && typeof val === 'string') {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(`{${k}}`, v);
    }
  }
  return val;
}

/** Get current language code ('is' or 'en') */
export function getLang() {
  return currentLang;
}

/** Switch language and persist choice */
export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('ferdabox_lang', lang);
  window.dispatchEvent(new CustomEvent('languagechange'));
}
