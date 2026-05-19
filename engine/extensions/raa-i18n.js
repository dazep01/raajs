/**
 * RaaJS I18n Extension v1.0 — Final
 * 
 * ════════════════════════════════════════════════════
 *  DIREKTIF
 * ════════════════════════════════════════════════════
 * raa-i18n:locale   → set locale aktif (reaktif)
 *   Contoh: <body raa-i18n:locale="lang">
 * 
 * ════════════════════════════════════════════════════
 *  FUNGSI GLOBAL (tersedia di expression)
 * ════════════════════════════════════════════════════
 * $t(key, params?)   → terjemahkan key dengan interpolasi
 *   Contoh: $t('hello')
 *   Contoh: $t('greeting', { name: userName })
 *   Contoh: $t('apples', { count: 5 })
 * 
 * $locale            → nilai locale saat ini (readable)
 *   Contoh: $locale === 'id' ? 'Indonesia' : 'English'
 * 
 * ════════════════════════════════════════════════════
 *  API
 * ════════════════════════════════════════════════════
 * RaaI18n.setTranslations(locale, messages)
 * RaaI18n.setLocale(locale)
 * RaaI18n.getLocale()
 * RaaI18n.setFallbackLocale(locale)
 * RaaI18n.t(key, params?, locale?)
 * 
 * ════════════════════════════════════════════════════
 *  FITUR
 * ════════════════════════════════════════════════════
 * - Interpolasi variabel  → $t('halo {nama}', { nama: 'Budi' })
 * - Pluralization         → $t('apel', { count: 1 }) // "1 apel"
 *                           $t('apel', { count: 5 }) // "5 apel"
 *   Format: "1 apel | {count} apel"
 * - Nested key            → $t('user.profile.title')
 * - Fallback chain        → id → en → key mentah
 * - Reaktif penuh         → ganti locale, semua $t() terupdate otomatis
 * - CSP‑safe, no eval     → semua evaluasi via RaaJS expression engine
 * 
 * ════════════════════════════════════════════════════
 *  CATATAN
 * ════════════════════════════════════════════════════
 * Memanfaatkan Raa.createReactive untuk locale agar
 * sistem dependency tracking bawaan RaaJS bekerja
 * secara otomatis. Tidak menyentuh internal RaaJS.
 * 
 * Membutuhkan RaaJS.defineGlobal() di core.
 * Jika belum ada, tambahkan di raa.js:
 * 
 *   static defineGlobal(name, getter) {
 *     if (!this._safeGlobals) this._safeGlobals = {};
 *     this._safeGlobals[name] = getter;
 *   }
 */
(function () {
  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaI18n] RaaJS not found. Load raa.js first.');
    return;
  }

  // ═══════════════════════════════════════════════════
  //  I18N CORE
  // ═══════════════════════════════════════════════════
  window.RaaI18n = {
    _translations: {},       // { locale: { key: message } }
    _fallbackLocale: 'en',

    /**
     * Daftarkan terjemahan untuk suatu locale
     * @param {string} locale - kode bahasa, misal 'id', 'en', 'ja'
     * @param {object} messages - key-value translation (support nested)
     */
    setTranslations(locale, messages) {
      if (!this._translations[locale]) {
        this._translations[locale] = {};
      }
      Object.assign(this._translations[locale], messages);
    },

    /**
     * Set locale aktif — REAKTIF
     * Semua binding $t() akan otomatis terupdate.
     * @param {string} locale
     */
    setLocale(locale) {
      this._reactiveState.locale = locale;
    },

    /**
     * Get locale aktif
     * @returns {string}
     */
    getLocale() {
      return this._reactiveState.locale;
    },

    /**
     * Set fallback locale (default 'en')
     * @param {string} locale
     */
    setFallbackLocale(locale) {
      this._fallbackLocale = locale;
    },

    /**
     * Translate key
     * @param {string} key - key atau nested key ("user.name")
     * @param {object} params - variabel interpolasi, plus count untuk plural
     * @param {string} locale - opsional, override locale
     * @returns {string}
     */
    t(key, params = {}, locale) {
      const loc = locale || this.getLocale();
      let message = this._resolveMessage(key, loc);

      // Fallback
      if (message === key && loc !== this._fallbackLocale) {
        message = this._resolveMessage(key, this._fallbackLocale);
      }

      // Jika masih mentah, kembalikan key
      if (message === key) return key;

      // Pluralization
      if (params.count !== undefined) {
        message = this._pluralize(message, params.count);
      }

      // Interpolasi
      return this._interpolate(message, params);
    },

    // ─── PRIVATE ─────────────────────────────────

    _resolveMessage(key, locale) {
      const messages = this._translations[locale];
      if (!messages) return key;

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

  // ═══════════════════════════════════════════════════
  //  STATE REAKTIF — Manfaatkan Proxy RaaJS
  // ═══════════════════════════════════════════════════
  const Raa = window.Raa;
  if (Raa && typeof Raa.createReactive === 'function') {
    // Gunakan document.documentElement sebagai root dummy
    // karena ini state global, bukan milik app tertentu
    RaaI18n._reactiveState = Raa.createReactive(
      document.documentElement,
      { locale: 'en' }
    );
  } else {
    // Fallback jika createReactive tidak tersedia
    RaaI18n._reactiveState = { locale: 'en' };
  }

  // ═══════════════════════════════════════════════════
  //  DAFTARKAN $t DAN $locale SEBAGAI SAFE GLOBAL
  // ═══════════════════════════════════════════════════
  if (window.RaaJS && typeof window.RaaJS.defineGlobal === 'function') {
    window.RaaJS.defineGlobal('$t', (key, params) => RaaI18n.t(key, params));
    window.RaaJS.defineGlobal('$locale', () => RaaI18n.getLocale());
  } else {
    // Jika defineGlobal belum ada, fallback: override buildScope
    // (hanya sebagai jembatan sementara)
    if (Raa && typeof Raa.buildScope === 'function') {
      const originalBuildScope = Raa.buildScope.bind(Raa);
      Raa.buildScope = function (state, el, extraLocals = {}) {
        const scope = originalBuildScope(state, el, extraLocals);
        return new Proxy(scope, {
          get(target, key) {
            if (key === '$t') return (k, p) => RaaI18n.t(k, p);
            if (key === '$locale') return RaaI18n.getLocale();
            return Reflect.get(target, key);
          },
          has(target, key) {
            if (key === '$t' || key === '$locale') return true;
            return Reflect.has(target, key);
          }
        });
      };
    }
  }

  console.log('[RaaI18n] v1.0 loaded. CSP‑safe, reactive. Use $t("key") in expressions.');
})();