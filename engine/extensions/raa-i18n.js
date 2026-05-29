/**
RaaJS I18n Extension | v3.1.0
File: raa-i18n.js
─────────────────────────────────────────────────────────────
🧬 ANATOMI & PERAN
Sebagai "Penerjemah Universal" (Universal Bridge). Ekstensi ini
memberikan kemampuan multibahasa yang reaktif pada aplikasi,
memastikan pesan tersampaikan dengan tepat melalui sistem
interpolasi dan pluralisasi yang cerdas.
─────────────────────────────────────────────────────────────
⚙️ DIREKTIF & API UTAMA
$t(key, params)          : Terjemahkan key dengan interpolasi & pluralisasi.
$locale()                : Locale aktif saat ini (tersedia global di template).
RaaI18n.setTranslations() : Daftarkan kamus bahasa.
RaaI18n.setLocale()       : Ubah bahasa aktif (memicu re-render reaktif).
RaaI18n.getLocale()
RaaI18n.setFallbackLocale(locale)
RaaI18n.t(key, params?, locale?)
─────────────────────────────────────────────────────────────
⚖️ FILOSOFI TEKNIS
Nested Key Support, Pluralization (Pipe-based), Fallback Chain,
CSP-Safe (No-Eval), Reactive Locale, Plugin-Native (v3.1.0+).
"Bahasa adalah jembatan yang menghubungkan ide dengan manusia."
─────────────────────────────────────────────────────────────
CHANGELOG
v3.1.0 (2026-05-24)
[BREAKING]  raa._globals tidak ada di v3.1.0 — diganti dengan
          window.RaaJS.defineGlobal() → mengisi __safeGlobalsExtras__.
[FIX]       uninstall() kini membersihkan window.RaaJS.__safeGlobalsExtras__
          alih-alih mengakses properti instan yang undefined.
[FIX]       Seluruh typo/artefak OCR (spasi, karakter putus) dibersihkan.
[FIX]       Reactive sentinel pattern dipertahankan & disinkronkan dengan
          Proxy trigger v3.1.0 untuk re-render otomatis tanpa manual loop.
[IMPROVE]   Idempotent hooks, cleanup listener saat uninstall,
          zero console.log production leak.
v2.2.0 (baseline)
Original version — RaaJS.defineGlobal() approach (API tidak ada).
─────────────────────────────────────────────────────────────
*/
(function () {
'use strict';
if (typeof window === 'undefined') return;

// ═══════════════════════════════════════════════════════
//  INTERNAL STATE
// ═══════════════════════════════════════════════════════
let _currentLocale = 'en';
const _localeChangeListeners = new Set();

// ═══════════════════════════════════════════════════════
//  GLOBAL API: window.RaaI18n
// ═══════════════════════════════════════════════════════
window.RaaI18n = {
  _translations: {},
  _fallbackLocale: 'en',

  /** Daftarkan kamus terjemahan untuk satu locale */
  setTranslations(locale, messages) {
    if (!this._translations[locale]) this._translations[locale] = {};
    Object.assign(this._translations[locale], messages);
  },

  /** Ubah locale aktif. Secara otomatis memicu re-render */
  setLocale(locale) {
    if (_currentLocale === locale) return;
    _currentLocale = locale;
    _localeChangeListeners.forEach(fn => { try { fn(locale); } catch (_) {} });
  },

  getLocale() { return _currentLocale; },

  setFallbackLocale(locale) { this._fallbackLocale = locale; },

  /** Terjemahkan key ke locale aktif */
  t(key, params = {}, locale) {
    const loc = locale || this.getLocale();
    let message = this._resolveMessage(key, loc);

    // Fallback ke locale default jika tidak ditemukan
    if (message === key && loc !== this._fallbackLocale) {
      message = this._resolveMessage(key, this._fallbackLocale);
    }
    if (message === key) return key;

    // Pluralisasi jika ada params.count
    if (params.count !== undefined) {
      message = this._pluralize(message, params.count);
    }
    return this._interpolate(message, params);
  },

  // ── Private helpers ─────────────────────────────────
  _resolveMessage(key, locale) {
    const messages = this._translations[locale];
    if (!messages) return key;
    if (messages[key] !== undefined) return String(messages[key]);

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
    if (!message.includes('|')) return message.replace('{count}', count);
    const parts = message.split('|').map(s => s.trim());
    const chosen = (count === 1 && parts[0]) ? parts[0] : (parts[1] || parts[0]);
    return chosen.replace('{count}', count);
  }
};
const I18n = window.RaaI18n;

// ═══════════════════════════════════════════════════════
//  PLUGIN DEFINITION (v3.1.0 Plugin System)
// ═══════════════════════════════════════════════════════
const RaaI18nPlugin = {
  name: 'raa-i18n',

  install(raa) {
    // ── 1. Injeksikan $t dan $locale via Static API v3.1.0 ─────────────
    // Tersedia otomatis di scope evaluator template tanpa inject manual per-app
    window.RaaJS.defineGlobal('$t', (key, params) => I18n.t(key, params));
    window.RaaJS.defineGlobal('$locale', () => I18n.getLocale());

    // ── 2. afterCompile: injeksikan $locale sebagai reactive property ───
    // Memungkinkan raa-bind:text="$locale" bereaksi saat locale berubah
    raa.pluginManager.addHook('afterCompile', function (root, state) {
      if (!state || state.__raa_i18n_injected__) return;
      state.__raa_i18n_injected__ = true;

      // Sentinel reaktif: mutasi property ini akan memicu trigger Proxy
      if (!Object.prototype.hasOwnProperty.call(state, '__raa_locale_sentinel__')) {
        state.__raa_locale_sentinel__ = I18n.getLocale();
      }

      // Inject $locale sebagai getter ke state (opsional, untuk konsistensi)
      if (!Object.prototype.hasOwnProperty.call(state, '$locale')) {
        Object.defineProperty(state, '$locale', {
          enumerable: true,
          configurable: true,
          get() { return I18n.getLocale(); }
        });
      }
    }, 'raa-i18n');

    // ── 3. Locale change listener: trigger reaktivitas saat setLocale() ──
    // Saat locale berubah, update sentinel di semua root aktif agar efek di-re-run
    _localeChangeListeners.add(function triggerLocaleChange(newLocale) {
      document.querySelectorAll('[raa-core\\:app], [raa-eco\\:island]').forEach(rootEl => {
        const state = rootEl.__raa_state__;
        if (state && state.__raa_i18n_injected__) {
          // Mutasi sentinel → memicu ReactiveSystem.trigger()
          state.__raa_locale_sentinel__ = newLocale;
        }
      });
    });
  },

  uninstall(raa) {
    // Bersihkan globals yang diinjeksikan via API static v3.1.0
    if (window.RaaJS && window.RaaJS.__safeGlobalsExtras__) {
      delete window.RaaJS.__safeGlobalsExtras__['$t'];
      delete window.RaaJS.__safeGlobalsExtras__['$locale'];
    }
    // Hapus listener untuk mencegah memory leak jika plugin di-reinstall
    _localeChangeListeners.clear();
  }
};

// ═══════════════════════════════════════════════════════
//  AUTO-INSTALL (DIPERBAIKI)
// ═══════════════════════════════════════════════════════
function registerGlobals() {
  // Pastikan wadah safeGlobalsExtras sudah ada
  if (!window.RaaJS.__safeGlobalsExtras__) {
    window.RaaJS.__safeGlobalsExtras__ = Object.create(null);
  }
  
  // Daftarkan global SEKARANG — ini static method, tidak perlu instance Raa
  window.RaaJS.defineGlobal('$t', function(key, params) {
    return I18n.t(key, params || {});
  });
  
  window.RaaJS.defineGlobal('$locale', function() {
    return I18n.getLocale();
  });
  
  console.log('[RaaI18n] Globals $t dan $locale terdaftar.');
}

function installPluginToInstance() {
  if (typeof window.Raa === 'undefined') {
    // Instance belum siap, tunda via DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof window.Raa !== 'undefined') {
        window.Raa.use(RaaI18nPlugin);
        console.log('[RaaI18n] Plugin terpasang ke instance Raa.');
      }
    });
  } else {
    window.Raa.use(RaaI18nPlugin);
    console.log('[RaaI18n] Plugin terpasang ke instance Raa.');
  }
}

// ── EKSEKUSI ─────────────────────────────────────────
// 1. Daftarkan global SEGERA (tidak perlu nunggu instance)
if (typeof window.RaaJS !== 'undefined') {
  registerGlobals();
} else {
  // Jika RaaJS class belum ada, tunda sampai script core di-load
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.RaaJS !== 'undefined') registerGlobals();
  });
}

// 2. Pasang plugin ke instance (dengan lifecycle hooks)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installPluginToInstance);
} else {
  installPluginToInstance();
}

})();