/**
 * RaaJS Validation Extension v1.0
 * Directive:
 *   raa-validate:required   – wajib isi
 *   raa-validate:email      – format email
 *   raa-validate:min        – nilai minimal (angka/panjang string)
 *   raa-validate:max        – nilai maksimal
 *   raa-validate:pattern    – validasi regex
 *   raa-validate:custom     – fungsi validasi kustom
 *   raa-validate:group      – kelola grup error form
 *
 * Otomatis menambah class raa-valid / raa-invalid,
 * membuat elemen pesan error, dan bisa dikustom via JS.
 * CSP-safe, no eval.
 */
(function () {
  if (typeof window === 'undefined') return;

  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaValidate] RaaJS not found. Load raa.js first.');
    return;
  }

  const Raa = window.Raa;

  // ═══════════════════════════════════════════════════
  //  GLOBAL CONFIGURATION
  // ═══════════════════════════════════════════════════
  window.RaaValidate = {
    // Pesan error default (bisa di-override atau pakai I18n nanti)
    messages: {
      required: 'Wajib diisi.',
      email: 'Format email tidak valid.',
      min: 'Minimal {min} karakter.',
      max: 'Maksimal {max} karakter.',
      pattern: 'Format tidak sesuai.',
      custom: 'Tidak valid.'
    },

    // Custom rules registry
    rules: {},

    /**
     * Definisikan aturan validasi kustom
     * @param {string} name
     * @param {function} validator (value, params, el) => boolean | string (pesan error)
     */
    defineRule(name, validator) {
      if (!name || typeof validator !== 'function') return;
      this.rules[name] = validator;
    },

    /**
     * Validasi satu field
     * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} el
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validateField(el) {
      if (!el || !el.getAttribute) {
        return { valid: true, errors: [] };
      }

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
     * Validasi semua field dalam form (atau dalam root)
     * @param {HTMLElement} root
     * @returns {{ valid: boolean, errors: Record<string, string[]> }}
     */
    validateGroup(root) {
      if (!root) {
        return { valid: true, errors: {} };
      }

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

      // Update state grup jika ada raa-validate:group
      const groupEl = this._getGroupElement(root);
      if (groupEl && groupEl.__raa_state__) {
        const target = groupEl.getAttribute('raa-validate:group');
        if (target) {
          groupEl.__raa_state__[target] = { valid: allValid, errors: groupErrors };
        }
      }

      return { valid: allValid, errors: groupErrors };
    },

    /**
     * Pasang listener validasi otomatis pada subtree
     * @param {HTMLElement} root
     */
    attach(root) {
      if (!root) return;

      const fields = this._getValidateFields(root);

      fields.forEach((field) => {
        // Hindari double binding listener
        if (field.__raa_validate_listener__) return;
        field.__raa_validate_listener__ = true;

        const eventType =
          (field.type === 'checkbox' ||
            field.type === 'radio' ||
            field.tagName === 'SELECT')
            ? 'change'
            : 'input';

        field.addEventListener(eventType, () => {
          window.RaaValidate.validateField(field);
        });

        // Validasi awal
        const enqueue =
          typeof queueMicrotask === 'function'
            ? queueMicrotask
            : (fn) => Promise.resolve().then(fn);

        enqueue(() => window.RaaValidate.validateField(field));
      });
    },

    // ─── PRIVATE HELPERS ────────────────────────────

    _getValidateDirectives(el) {
      const all = [];
      Array.from(el.attributes || []).forEach((attr) => {
        if (attr.name.startsWith('raa-validate:') && attr.name !== 'raa-validate:group') {
          const rule = attr.name.slice('raa-validate:'.length);
          all.push({ rule, param: attr.value || undefined });
        }
      });
      return all;
    },

    _getFieldValue(el) {
      if (!el) return '';

      const tagName = (el.tagName || '').toUpperCase();
      const type = (el.type || '').toLowerCase();

      if (type === 'checkbox') {
        return el.checked ? (el.value ?? 'on') : '';
      }

      if (type === 'radio') {
        const selected = this._getSelectedRadioValue(el);
        return selected != null ? String(selected) : '';
      }

      if (tagName === 'SELECT' && el.multiple) {
        return Array.from(el.selectedOptions || []).map((opt) => opt.value).join(',');
      }

      return el.value == null ? '' : String(el.value);
    },

    _getSelectedRadioValue(el) {
      const name = el && el.name;
      if (!name) return el && el.checked ? el.value : '';

      const scope = el.form || el.ownerDocument || document;
      const radios = Array.from(scope.querySelectorAll('input[type="radio"]'))
        .filter((radio) => radio.name === name);

      const checked = radios.find((radio) => radio.checked);
      return checked ? checked.value : '';
    },

    _isRequiredValid(el, value) {
      const tagName = (el.tagName || '').toUpperCase();
      const type = (el.type || '').toLowerCase();

      if (type === 'checkbox') {
        return !!el.checked;
      }

      if (type === 'radio') {
        return this._getSelectedRadioValue(el) !== '';
      }

      if (tagName === 'SELECT' && el.multiple) {
        return Array.from(el.selectedOptions || []).length > 0;
      }

      return String(value).trim() !== '';
    },

    _runRule(rule, value, param, el) {
      switch (rule) {
        case 'required':
          return this._isRequiredValid(el, value);

        case 'email':
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
          try {
            const regex = new RegExp(param);
            return regex.test(String(value));
          } catch {
            return false;
          }

        case 'custom':
          if (this.rules[param]) {
            return this.rules[param](value, param, el);
          }
          return false;

        default:
          // Bisa custom rule yang belum terdaftar
          if (this.rules[rule]) return this.rules[rule](value, param, el);
          return true;
      }
    },

    _message(rule, param) {
      const msg = this.messages[rule] || this.messages.custom;
      return msg.replace(/\{(\w+)\}/g, (_, key) => {
        if (key === 'min' || key === 'max') return param;
        return '';
      });
    },

    _updateUI(el, errors) {
      const isValid = errors.length === 0;

      el.classList.toggle('raa-valid', isValid);
      el.classList.toggle('raa-invalid', !isValid);

      if (typeof el.setAttribute === 'function') {
        el.setAttribute('aria-invalid', isValid ? 'false' : 'true');
      }

      // Buat/update elemen error, scoped per field
      let errorEl = el.__raa_validate_error_el__ || null;

      if (errorEl && (!errorEl.isConnected || errorEl.parentNode !== el.parentNode)) {
        errorEl = null;
        el.__raa_validate_error_el__ = null;
      }

      if (!errorEl && !isValid) {
        errorEl = document.createElement('span');
        errorEl.className = 'raa-error-message';
        errorEl.setAttribute('aria-live', 'polite');

        if (el.parentNode) {
          el.parentNode.insertBefore(errorEl, el.nextSibling);
        }

        el.__raa_validate_error_el__ = errorEl;
      }

      if (errorEl) {
        errorEl.textContent = errors.join(', ');
        errorEl.style.display = isValid ? 'none' : '';
      }
    },

    _getValidateFields(root) {
      const nodes = [];

      if (root && root.nodeType === 1) nodes.push(root);

      if (root && typeof root.querySelectorAll === 'function') {
        nodes.push(...root.querySelectorAll('*'));
      }

      return nodes.filter((el) => {
        if (!el || !el.attributes) return false;

        const attrs = Array.from(el.attributes);
        return attrs.some((attr) => {
          if (!attr.name.startsWith('raa-validate:')) return false;
          return attr.name !== 'raa-validate:group';
        });
      });
    },

    _getGroupElement(root) {
      if (!root || typeof root.matches !== 'function') return null;

      if (root.matches('[raa-validate\\:group]')) return root;
      if (typeof root.querySelector === 'function') {
        return root.querySelector('[raa-validate\\:group]');
      }
      return null;
    }
  };

  // ═══════════════════════════════════════════════════
  //  INTEGRATION WITH RaaJS
  // ═══════════════════════════════════════════════════

  // Override createBindingEffect untuk directive raa-validate:group
  if (typeof Raa.createBindingEffect === 'function') {
    const originalCreateBindingEffect = Raa.createBindingEffect.bind(Raa);

    Raa.createBindingEffect = function (el, name, value, state, root) {
      // raa-validate:group (tidak perlu efek, hanya penanda)
      if (name === 'raa-validate:group') {
        return;
      }

      // Fallback
      return originalCreateBindingEffect(el, name, value, state, root);
    };
  } else {
    console.warn('[RaaValidate] Raa.createBindingEffect not found. Validation group hook may be limited.');
  }

  // Override compileSubtree untuk menangkap event input/change dan validasi otomatis
  if (typeof Raa.compileSubtree === 'function') {
    const originalCompileSubtree = Raa.compileSubtree.bind(Raa);

    Raa.compileSubtree = function (root, state) {
      // Panggil original
      originalCompileSubtree(root, state);

      // Setelah subtree terkompilasi, pasang listener validasi otomatis
      window.RaaValidate.attach(root);
    };
  } else {
    console.warn('[RaaValidate] Raa.compileSubtree not found. Auto-attach validation is disabled.');
  }

  console.log('[RaaValidate] v1.0 loaded. Directives: required, email, min, max, pattern, custom, group.');
})();