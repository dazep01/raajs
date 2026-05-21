/**
 * RaaJS I18n Extension | v2.2.0
 * File: raa-i18n.js
 * ─────────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Penerjemah Universal" (Universal Bridge). Ekstensi ini 
 * memberikan kemampuan multibahasa yang reaktif pada aplikasi, 
 * memastikan pesan tersampaikan dengan tepat melalui sistem 
 * interpolasi dan pluralisasi yang cerdas.
 * ─────────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-i18n:locale : Mengatur bahasa aktif secara reaktif di elemen.
 * - $t(key, params) : Fungsi global untuk menerjemahkan key & interpolasi.
 * - $locale         : Variabel ajaib untuk mendapatkan locale saat ini.
 * - RaaI18n.setTranslations() : API untuk mendaftarkan kamus bahasa.
 * - RaaI18n.setLocale() : Mengubah bahasa aplikasi secara programatik.
 * - RaaI18n.getLocale()
 * - RaaI18n.setFallbackLocale(locale)
 * - RaaI18n.t(key, params?, locale?)─────────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Nested Key Support, Pluralization (Pipe-based), Fallback Chain, 
 *   CSP-Safe (No-Eval), Reactive Locale.
 * 
 * "Bahasa adalah jembatan yang menghubungkan ide dengan manusia."
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  let currentLocale = 'en';

  window.RaaI18n = {
    _translations: {},
    _fallbackLocale: 'en',

    setTranslations(locale, messages) {
      if (!this._translations[locale]) {
        this._translations[locale] = {};
      }
      Object.assign(this._translations[locale], messages);
    },

    setLocale(locale) {
      currentLocale = locale;
      if (window.Raa && typeof window.Raa.rerunRootEffects === 'function') {
        document.querySelectorAll('[raa-core\\:app]').forEach(appEl => {
          window.Raa.rerunRootEffects(appEl);
        });
      }
    },

    getLocale() {
      return currentLocale;
    },

    setFallbackLocale(locale) {
      this._fallbackLocale = locale;
    },

    t(key, params = {}) {
      const loc = this.getLocale();
      let message = this._resolveMessage(key, loc);

      if (message === key && loc !== this._fallbackLocale) {
        message = this._resolveMessage(key, this._fallbackLocale);
      }

      if (message === key) return key;

      if (params.count !== undefined) {
        message = this._pluralize(message, params.count);
      }

      return this._interpolate(message, params);
    },

    // 🌟 SEKARANG LEBIH PINTAR: Mendukung struktur Flat ("nav.features") maupun Nested (nav: { features })
    _resolveMessage(key, locale) {
      const messages = this._translations[locale];
      if (!messages) return key;

      // 1. Coba cek format Flat dulu (misal langsung nyari key "nav.features")
      if (messages[key] !== undefined) {
        return String(messages[key]);
      }

      // 2. Jika tidak ada, coba telusuri sebagai format Nested bertingkat
      const parts = key.split('.');
      let current = messages;
      for (const part of parts) {
        if (current == null || typeof current !== 'object') return key;
        current = current[part];
      }
      return current !== undefined ? String(current) : key;
    },

    _interpolate(message, params) {
      return message.replace(/\{(\w+)\}/g, (_, name) =>
        params[name] !== undefined ? String(params[name]) : `{${name}}`
      );
    },

    _pluralize(message, count) {
      if (message.includes('|')) {
        const parts = message.split('|').map(s => s.trim());
        if (count === 1 && parts[0]) {
          return parts[0].replace('{count}', count);
        } else if (parts[1]) {
          return parts[1].replace('{count}', count);
        }
      }
      return message.replace('{count}', count);
    }
  };

  if (window.RaaJS && typeof window.RaaJS.defineGlobal === 'function') {
    window.RaaJS.defineGlobal('$t', (key, params) => window.RaaI18n.t(key, params));
    window.RaaJS.defineGlobal('$locale', () => window.RaaI18n.getLocale());
  }
})();
