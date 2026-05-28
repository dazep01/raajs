/**
 * RaaJS Validation Extension | v3.1.0
 * File: raa-validate.js
 * ───────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Penjaga Gerbang" (The Gatekeeper). Ekstensi ini adalah
 * sistem pertahanan yang memastikan integritas data sebelum masuk
 * ke dalam state, memberikan umpan balik visual secara otomatis
 * untuk menjaga kejujuran interaksi antara pengguna dan aplikasi.
 * ───────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-validate:required      : Field wajib diisi.
 * - raa-validate:email         : Validasi format email.
 * - raa-validate:min="n"       : Minimal n karakter (atau nilai angka).
 * - raa-validate:max="n"       : Maksimal n karakter (atau nilai angka).
 * - raa-validate:pattern="rx"  : Validasi regex kustom.
 * - raa-validate:custom="name" : Panggil rule kustom terdaftar.
 * - raa-validate:group="key"   : Tulis hasil validasi grup ke state[key].
 * - RaaValidate.defineRule()   : Daftarkan aturan validasi baru.
 * - RaaValidate.validateField(): Validasi satu field secara manual.
 * - RaaValidate.validateGroup(): Validasi semua field dalam sebuah root.
 * - .raa-valid / .raa-invalid  : Penanda visual otomatis untuk status elemen.
 * ───────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - CSP-Safe (No-Eval), Scoped Error Messages, Automatic UI Feedback,
 *   ARIA-Friendly, Reactive-Integrity, Plugin-Native (v3.0.0+).
 *
 * "Integritas data adalah bentuk penghormatan tertinggi pada sistem."
 * ───────────────────────────────────────────────────────────
 * CHANGELOG
 * v3.1.0 (2026-05-23)
 *   [BREAKING]  Integrasi sepenuhnya via Plugin System v3.0.0.
 *               Tidak lagi menggunakan monkey-patching pada instance Raa.
 *   [FEATURE]   Mendaftarkan diri lewat raa.use({ name, install }) —
 *               mendapatkan beforeCompile/afterCompile/beforeDestroy/afterDestroy
 *               hooks secara otomatis.
 *   [FEATURE]   raa-validate:* terdaftar sebagai custom directive sehingga
 *               tidak memicu warning "unknown directive" di core v3.0.0.
 *   [FEATURE]   raa-validate:group kini menulis ke state secara reaktif
 *               melalui referensi state root, bukan lewat __raa_state__ langsung.
 *   [FIX]       beforeDestroy hook: semua listener validasi dibersihkan
 *               via _detach() saat root di-destroy — tidak ada memory leak.
 *   [FIX]       Listener validasi dicatat di el.__raa_validate_listeners__
 *               sehingga cleanup bisa dilakukan secara tepat per-field.
 *   [FIX]       console.log production leak dihapus.
 *   [FIX]       Pengecekan window.Raa menggunakan pola deferred yang benar
 *               (DOMContentLoaded-aware) agar aman dimuat sebelum atau
 *               sesudah core script.
 *   [IMPROVE]   uninstall() ditambahkan pada plugin object — PluginManager
 *               akan memanggilnya saat raa.pluginManager.uninstall('raa-validate').
 *
 * v2.2.0 (baseline)
 *   Original version — monkey-patching approach.
 * ───────────────────────────────────────────────────────────
 */

(function () {
  "use strict";
  if (typeof window === 'undefined') return;

  // ═══════════════════════════════════════════════════════
  //  GLOBAL API: window.RaaValidate
  //  Tetap sebagai objek global agar bisa dipanggil dari
  //  luar plugin (template expression atau kode pengguna).
  // ═══════════════════════════════════════════════════════

  window.RaaValidate = {

    // ── Pesan error default (bisa di-override) ──────────
    messages: {
      required: 'Wajib diisi.',
      email: 'Format email tidak valid.',
      min: 'Minimal {min} karakter.',
      max: 'Maksimal {max} karakter.',
      pattern: 'Format tidak sesuai.',
      custom: 'Tidak valid.'
    },

    // ── Custom rules registry ────────────────────────────
    rules: {},

    /**
     * Daftarkan aturan validasi kustom.
     * @param {string} name
     * @param {(value: string, param: string|undefined, el: HTMLElement) => boolean|string} validator
     *   Kembalikan true jika valid, false atau string pesan error jika tidak.
     */
    defineRule(name, validator) {
      if (!name || typeof validator !== 'function') return;
      this.rules[name] = validator;
    },

    // ── Core Validation ──────────────────────────────────

    /**
     * Validasi satu field berdasarkan semua direktif raa-validate:* yang ada.
     * Mengupdate UI secara otomatis (.raa-valid/.raa-invalid, aria-invalid, pesan error).
     * @param {HTMLElement} el
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateField(el) {
      if (!el || !el.getAttribute) return { valid: true, errors: [] };

      const directives = this._getValidateDirectives(el);
      const value = this._getFieldValue(el);
      const errors = [];

      directives.forEach(({ rule, param }) => {
        const result = this._runRule(rule, value, param, el);
        if (result !== true) {
          errors.push(typeof result === 'string' ? result : this._message(rule, param));
        }
      });

      this._updateUI(el, errors);
      return { valid: errors.length === 0, errors };
    },

    /**
     * Validasi semua field dalam sebuah root (form atau container).
     * Jika ada elemen dengan raa-validate:group, tulis hasilnya ke state[key].
     * @param {HTMLElement} root
     * @returns {{ valid: boolean, errors: Record<string, string[]> }}
     */
    validateGroup(root) {
      if (!root) return { valid: true, errors: {} };

      const fields = this._getValidateFields(root);
      let allValid = true;
      const groupErrors = {};

      fields.forEach((el) => {
        const { valid, errors } = this.validateField(el);
        if (!valid) {
          allValid = false;
          const key =
            el.getAttribute('raa-bind:model') ||
            el.name ||
            el.id ||
            'field';
          if (!groupErrors[key]) groupErrors[key] = [];
          groupErrors[key].push(...errors);
        }
      });

      // Tulis hasil ke state reaktif via group anchor
      const groupEl = this._getGroupElement(root);
      if (groupEl) {
        const target = groupEl.getAttribute('raa-validate:group');
        // Cari state: dari __raa_validate_group__ (disimpan saat compile)
        // atau fallback ke __raa_state__ pada root terdekat
        const state =
          (groupEl.__raa_validate_group__ && groupEl.__raa_validate_group__.state) ||
          groupEl.__raa_state__ ||
          (groupEl.__raa_root__ && groupEl.__raa_root__.__raa_state__);

        if (state && target) {
          state[target] = { valid: allValid, errors: groupErrors };
        }
      }

      return { valid: allValid, errors: groupErrors };
    },

    /**
     * Pasang listener validasi real-time pada semua field di dalam root.
     * Dipanggil otomatis via afterCompile hook — tidak perlu dipanggil manual.
     * @param {HTMLElement} root
     * @param {RaaJS} raa  Instance RaaJS (digunakan untuk debug flag)
     */
    attach(root, raa) {
      if (!root) return;
      const fields = this._getValidateFields(root);

      fields.forEach((el) => {
        // Hindari double-binding listener pada elemen yang sama
        if (el.__raa_validate_bound__) return;
        el.__raa_validate_bound__ = true;

        if (!el.__raa_validate_listeners__) el.__raa_validate_listeners__ = [];

        const eventType =
          (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT')
            ? 'change'
            : 'input';

        const handler = () => { window.RaaValidate.validateField(el); };
        el.addEventListener(eventType, handler);
        el.__raa_validate_listeners__.push({ eventType, handler });

        // Validasi awal setelah microtask (setelah model binding pertama berjalan)
        queueMicrotask(() => {
          if (el.isConnected) window.RaaValidate.validateField(el);
        });
      });
    },

    /**
     * Lepas semua listener validasi dalam root (dipanggil via beforeDestroy hook).
     * @param {HTMLElement} root
     */
    _detach(root) {
      if (!root || typeof root.querySelectorAll !== 'function') return;

      const all = [root, ...Array.from(root.querySelectorAll('*'))];
      all.forEach((el) => {
        if (!el.__raa_validate_listeners__) return;
        el.__raa_validate_listeners__.forEach(({ eventType, handler }) => {
          try { el.removeEventListener(eventType, handler); } catch (_) {}
        });
        el.__raa_validate_listeners__ = null;
        el.__raa_validate_bound__ = false;
        // Bersihkan error element yang tersisa
        if (el.__raa_validate_error_el__ && el.__raa_validate_error_el__.isConnected) {
          try { el.__raa_validate_error_el__.remove(); } catch (_) {}
        }
        el.__raa_validate_error_el__ = null;
        el.__raa_validate_group__ = null;
      });
    },

    // ── Private Helpers ──────────────────────────────────

    /** Ambil semua direktif raa-validate:* (kecuali :group) dari sebuah elemen */
    _getValidateDirectives(el) {
      const all = [];
      Array.from(el.attributes || []).forEach((attr) => {
        if (attr.name.startsWith('raa-validate:') && attr.name !== 'raa-validate:group') {
          all.push({ rule: attr.name.slice('raa-validate:'.length), param: attr.value || undefined });
        }
      });
      return all;
    },

    /** Ambil nilai field dengan benar untuk semua tipe input */
    _getFieldValue(el) {
      if (!el) return '';
      const tagName = (el.tagName || '').toUpperCase();
      const type = (el.type || '').toLowerCase();

      if (type === 'checkbox') return el.checked ? (el.value ?? 'on') : '';
      if (type === 'radio') return this._getSelectedRadioValue(el);
      if (tagName === 'SELECT' && el.multiple) {
        return Array.from(el.selectedOptions || []).map((opt) => opt.value).join(',');
      }
      return el.value == null ? '' : String(el.value);
    },

    /** Cari nilai radio yang terpilih dalam grup (berdasarkan name) */
    _getSelectedRadioValue(el) {
      const name = el && el.name;
      if (!name) return el && el.checked ? el.value : '';
      const scope = el.form || el.ownerDocument || document;
      const radios = Array.from(scope.querySelectorAll('input[type="radio"]'))
        .filter((radio) => radio.name === name);
      const checked = radios.find((radio) => radio.checked);
      return checked ? checked.value : '';
    },

    /** Cek validitas khusus untuk required (checkbox, radio, select-multiple) */
    _isRequiredValid(el, value) {
      const tagName = (el.tagName || '').toUpperCase();
      const type = (el.type || '').toLowerCase();
      if (type === 'checkbox') return !!el.checked;
      if (type === 'radio') return this._getSelectedRadioValue(el) !== '';
      if (tagName === 'SELECT' && el.multiple) {
        return Array.from(el.selectedOptions || []).length > 0;
      }
      return String(value).trim() !== '';
    },

    /**
     * Jalankan satu rule validasi.
     * @returns {true | false | string}  true = valid, false/string = error
     */
    _runRule(rule, value, param, el) {
      switch (rule) {
        case 'required':
          return this._isRequiredValid(el, value);

        case 'email':
          // Izinkan kosong jika tidak ada 'required' — validasi email hanya jika ada isi
          if (!String(value).trim()) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));

        case 'min': {
          const min = parseFloat(param);
          if (Number.isNaN(min)) return false;
          if (el.type === 'number' || el.type === 'range') {
            const num = parseFloat(value);
            return !Number.isNaN(num) && num >= min;
          }
          return String(value).length >= min;
        }

        case 'max': {
          const max = parseFloat(param);
          if (Number.isNaN(max)) return false;
          if (el.type === 'number' || el.type === 'range') {
            const num = parseFloat(value);
            return !Number.isNaN(num) && num <= max;
          }
          return String(value).length <= max;
        }

        case 'pattern':
          if (!param) return false;
          try { return new RegExp(param).test(String(value)); }
          catch { return false; }

        case 'custom':
          if (this.rules[param]) return this.rules[param](value, param, el);
          return false;

        default:
          // Rule kustom yang didaftarkan via defineRule() dengan nama langsung
          if (this.rules[rule]) return this.rules[rule](value, param, el);
          return true; // Rule tidak dikenal → asumsikan valid
      }
    },

    /** Format pesan error dengan substitusi parameter */
    _message(rule, param) {
      const msg = this.messages[rule] || this.messages.custom;
      return msg.replace(/\{(\w+)\}/g, (_, key) => {
        if (key === 'min' || key === 'max') return param ?? '';
        return '';
      });
    },

    /** Update kelas CSS, aria-invalid, dan elemen pesan error pada field */
    _updateUI(el, errors) {
      const isValid = errors.length === 0;

      el.classList.toggle('raa-valid', isValid);
      el.classList.toggle('raa-invalid', !isValid);

      if (typeof el.setAttribute === 'function') {
        el.setAttribute('aria-invalid', isValid ? 'false' : 'true');
      }

      // Dapatkan atau buat elemen pesan error (scoped per field)
      let errorEl = el.__raa_validate_error_el__ || null;

      // Validasi bahwa errorEl masih dalam DOM dan tetap menjadi sibling
      if (errorEl && (!errorEl.isConnected || errorEl.parentNode !== el.parentNode)) {
        errorEl = null;
        el.__raa_validate_error_el__ = null;
      }

      if (!errorEl && !isValid) {
        errorEl = document.createElement('span');
        errorEl.className = 'raa-error-message';
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'polite');
        if (el.parentNode) el.parentNode.insertBefore(errorEl, el.nextSibling);
        el.__raa_validate_error_el__ = errorEl;
      }

      if (errorEl) {
        errorEl.textContent = isValid ? '' : errors.join(' ');
        errorEl.style.display = isValid ? 'none' : '';
      }
    },

    /** Kumpulkan semua elemen field yang memiliki direktif raa-validate:* */
    _getValidateFields(root) {
      const nodes = [];
      if (root && root.nodeType === 1) nodes.push(root);
      if (root && typeof root.querySelectorAll === 'function') {
        nodes.push(...root.querySelectorAll('*'));
      }
      return nodes.filter((el) => {
        if (!el || !el.attributes) return false;
        return Array.from(el.attributes).some(
          (attr) => attr.name.startsWith('raa-validate:') && attr.name !== 'raa-validate:group'
        );
      });
    },

    /** Cari elemen anchor group (yang memiliki raa-validate:group) */
    _getGroupElement(root) {
      if (!root || typeof root.matches !== 'function') return null;
      if (root.matches('[raa-validate\\:group]')) return root;
      if (typeof root.querySelector === 'function') {
        return root.querySelector('[raa-validate\\:group]');
      }
      return null;
    }
  };

  // ═══════════════════════════════════════════════════════
  //  PLUGIN DEFINITION (v3.0.0 Plugin System)
  // ═══════════════════════════════════════════════════════

  const RaaValidatePlugin = {
    name: 'raa-validate',

    /**
     * install() dipanggil oleh raa.use(plugin).
     * Menerima instance RaaJS yang sudah aktif.
     * @param {RaaJS} raa
     */
install(raa) {
  // 1. Daftarkan custom directive handler
  raa.__raa_custom_directives__.push([
    'raa-validate:*',
    function handleValidateDirective(el, name, value, state, root) {
      if (name === 'raa-validate:group') {
        el.__raa_validate_group__ = { key: value, state, root };
      }
    }
  ]);

  // 2. afterCompile: Pasang listener & AUTO-INIT state group
  raa.pluginManager.addHook('afterCompile', function(root, state) {
    window.RaaValidate.attach(root, raa);
    
    // FIX: Auto-inisialisasi state group jika belum ada
    // Ini mencegah error "Cannot read properties of undefined" di template
    const groupEl = window.RaaValidate._getGroupElement(root);
    if (groupEl) {
      const target = groupEl.getAttribute('raa-validate:group');
      // Hanya init jika key belum ada di state (agar tidak menimpa data user)
      if (target && !(target in state)) {
        state[target] = { 
          valid: true, 
          errors: {},
          // Opsional: init field kosong jika ingin lebih agresif
          // email: '', message: '' 
        };
      }
    }
  }, 'raa-validate');

  // 3. beforeDestroy: Cleanup
  raa.pluginManager.addHook('beforeDestroy', function(root) {
    window.RaaValidate._detach(root);
  }, 'raa-validate');
},

    /**
     * uninstall() dipanggil oleh raa.pluginManager.uninstall('raa-validate').
     * PluginManager akan membersihkan hooks dan custom directives secara
     * otomatis — tidak perlu cleanup manual di sini.
     * @param {RaaJS} raa
     */
    uninstall(raa) {
      // PluginManager menangani pembersihan lifecycle hooks dan
      // custom directives yang didaftarkan oleh plugin ini.
      // Tidak ada state global plugin yang perlu dibersihkan.
    }
  };

  // ═══════════════════════════════════════════════════════
  //  AUTO-INSTALL
  //  Mendukung pemuatan script sebelum atau sesudah core.
  //  window.Raa diisi oleh core pada DOMContentLoaded.
  // ═══════════════════════════════════════════════════════

  function installPlugin() {
    if (typeof window.Raa === 'undefined') {
      console.warn('[RaaValidate] window.Raa tidak ditemukan. Muat raa-v3.0.0.js terlebih dahulu.');
      return;
    }
    window.Raa.use(RaaValidatePlugin);
  }

  // Jika DOM belum siap, tunggu DOMContentLoaded (sama dengan timing core).
  // Jika sudah siap (script dimuat defer/async terlambat), langsung install.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPlugin);
  } else {
    installPlugin();
  }

})();
