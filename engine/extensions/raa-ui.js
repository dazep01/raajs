/**
 * RaaJS UI Toolkit | v3.1.0
 * File: raa-ui.js
 * ─────────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Toolkit Pengalaman" (Experience Toolkit). File ini
 * adalah kumpulan instrumen presisi yang mengubah interaksi mentah
 * menjadi pengalaman pengguna yang halus dan intuitif, memberikan
 * sentuhan magis pada setiap interaksi dan masukan data.
 * ─────────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-ui:tooltip   : Pesan bantuan dinamis saat elemen disentuh/diarahkan.
 * - raa-ui:clipboard : Menyalin teks ke papan klip secara instan & reaktif.
 * - raa-ui:scroll-to : Navigasi gulir halus (smooth scroll) menuju target.
 * - raa-ui:mask      : Mengatur pola input (masking) secara presisi & real-time.
 * - raa-ui:outside   : Menangkap aksi yang terjadi di luar batas elemen.
 * - window.RaaUI     : API konfigurasi global untuk durasi, gaya, dan perilaku UI.
 * ─────────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Reactive-First, Multi-plugin Safe, Zero-Dependency, Lightweight,
 *   Plugin-Native (v3.0.0+).
 *
 * "Interaksi yang baik adalah yang tidak terasa, namun sangat membantu."
 * ─────────────────────────────────────────────────────────────
 * CHANGELOG
 * v3.1.0 (2026-05-23)
 *   [BREAKING]  RaaJS.prototype.init patching dihapus — class ada di IIFE.
 *               Instalasi kini via Plugin System v3.0.0.
 *   [FIX]       deepCleanup tidak lagi di-monkey-patch pada instance.
 *               Cleanup kini via beforeDestroy hook yang mengiterasi subtree.
 *   [FIX]       console.log production leak dihapus (×2).
 *   [IMPROVE]   raa-ui:* terdaftar sebagai custom directive via install(raa),
 *               tidak lagi memerlukan __raa_ui_installed__ guard karena
 *               Plugin System menjamin install() hanya dipanggil sekali.
 *
 * v2.2.0 (baseline)
 *   Original version — RaaJS.prototype.init patching approach.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ═══════════════════════════════════════════════════════
  //  GLOBAL CONFIG API
  // ═══════════════════════════════════════════════════════
  window.RaaUI = {
    config: {
      tooltip: { position: 'top', offset: 8, delay: 300, className: 'raa-tooltip' },
      scrollTo: { behavior: 'smooth', block: 'start', duration: 800 },
      mask: { lazy: true }
    }
  };

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════
  function createElement(tag, attrs = {}, styles = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    Object.assign(el.style, styles);
    return el;
  }

  function resolveConfig(el, state, raa, defaults, configAttrName) {
    let cfg = { ...defaults };
    if (state?.uiConfig && typeof state.uiConfig === 'object') {
      const key = configAttrName === 'raa-ui:tooltip-config' ? 'tooltip' :
                  configAttrName === 'raa-ui:scroll-to-config' ? 'scrollTo' :
                  configAttrName === 'raa-ui:mask-config' ? 'mask' : null;
      if (key && state.uiConfig[key]) cfg = { ...cfg, ...state.uiConfig[key] };
    }
    const configAttr = el.getAttribute(configAttrName);
    if (configAttr) {
      try {
        const perCfg = raa.evaluate(configAttr, state, el);
        if (perCfg && typeof perCfg === 'object') cfg = { ...cfg, ...perCfg };
      } catch (_) {}
    }
    // data-* overrides
    if (configAttrName === 'raa-ui:tooltip-config') {
      if (el.dataset.raaUiTooltipPosition) cfg.position = el.dataset.raaUiTooltipPosition;
      if (el.dataset.raaUiTooltipOffset)   cfg.offset   = parseInt(el.dataset.raaUiTooltipOffset, 10);
      if (el.dataset.raaUiTooltipDelay)    cfg.delay    = parseInt(el.dataset.raaUiTooltipDelay, 10);
      if (el.dataset.raaUiTooltipClass)    cfg.className= el.dataset.raaUiTooltipClass;
    } else if (configAttrName === 'raa-ui:scroll-to-config') {
      if (el.dataset.raaUiScrollBehavior) cfg.behavior = el.dataset.raaUiScrollBehavior;
      if (el.dataset.raaUiScrollBlock)    cfg.block    = el.dataset.raaUiScrollBlock;
      if (el.dataset.raaUiScrollDuration) cfg.duration = parseInt(el.dataset.raaUiScrollDuration, 10);
    } else if (configAttrName === 'raa-ui:mask-config') {
      if (el.dataset.raaUiMaskLazy !== undefined) cfg.lazy = el.dataset.raaUiMaskLazy === 'true';
    }
    return cfg;
  }

  /** Daftarkan cleanup function pada elemen (dipanggil saat beforeDestroy) */
  function addCleanup(el, fn) {
    if (!el.__raa_cleanup__) el.__raa_cleanup__ = [];
    el.__raa_cleanup__.push(fn);
  }

  /** Jalankan semua cleanup function pada satu elemen */
  function runCleanup(el) {
    if (!el.__raa_cleanup__) return;
    el.__raa_cleanup__.forEach(fn => { try { fn(); } catch (_) {} });
    el.__raa_cleanup__ = null;
    // Reset guard flags agar bisa dipasang ulang jika dikompilasi ulang
    el.__raa_ui_tooltip_done__   = false;
    el.__raa_ui_clipboard_done__ = false;
    el.__raa_ui_scrollto_done__  = false;
    el.__raa_ui_mask_done__      = false;
    el.__raa_ui_outside_done__   = false;
  }

  // ═══════════════════════════════════════════════════════
  //  TOOLTIP
  // ═══════════════════════════════════════════════════════
  function handleTooltip(el, rawExpr, state, raa) {
    if (el.__raa_ui_tooltip_done__) return;
    el.__raa_ui_tooltip_done__ = true;

    let tooltipEl = null, showTimer = null, isVisible = false;
    const cfg = resolveConfig(el, state, raa, window.RaaUI.config.tooltip, 'raa-ui:tooltip-config');

    const getContent = () => {
      if (rawExpr == null) return null;
      if (typeof rawExpr === 'function') return rawExpr.call(el, state);
      if (typeof rawExpr !== 'string') return rawExpr;
      return raa.evaluate(rawExpr, state, el);
    };

    function createTooltip() {
      if (tooltipEl) return;
      tooltipEl = createElement('div', { class: cfg.className, role: 'tooltip' }, {
        position: 'absolute', zIndex: '9999', pointerEvents: 'none', opacity: '0',
        transition: 'opacity 0.2s', whiteSpace: 'pre-wrap', padding: '6px 10px',
        borderRadius: '4px', background: '#333', color: '#fff', fontSize: '13px',
        maxWidth: '200px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        ...(cfg.styles || {})
      });
      document.body.appendChild(tooltipEl);
    }

    function positionTooltip() {
      if (!tooltipEl) return;
      const rect = el.getBoundingClientRect();
      const tRect = tooltipEl.getBoundingClientRect();
      const { position: pos, offset } = cfg;
      let top, left;
      switch (pos) {
        case 'top':    top = rect.top - tRect.height - offset + window.scrollY;  left = rect.left + rect.width/2 - tRect.width/2 + window.scrollX; break;
        case 'bottom': top = rect.bottom + offset + window.scrollY;              left = rect.left + rect.width/2 - tRect.width/2 + window.scrollX; break;
        case 'left':   top = rect.top + rect.height/2 - tRect.height/2 + window.scrollY; left = rect.left - tRect.width - offset + window.scrollX; break;
        case 'right':  top = rect.top + rect.height/2 - tRect.height/2 + window.scrollY; left = rect.right + offset + window.scrollX; break;
        default:       top = rect.top - tRect.height - offset + window.scrollY;  left = rect.left + rect.width/2 - tRect.width/2 + window.scrollX;
      }
      const maxH = document.documentElement.scrollHeight;
      const maxW = document.documentElement.scrollWidth;
      tooltipEl.style.top  = Math.max(4, Math.min(top, maxH - tRect.height - 4)) + 'px';
      tooltipEl.style.left = Math.max(4, Math.min(left, maxW - tRect.width - 4)) + 'px';
    }

    function show() {
      clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        const content = getContent();
        if (content == null || content === '') return;
        createTooltip();
        tooltipEl.textContent = String(content);
        positionTooltip();
        tooltipEl.style.opacity = '1';
        isVisible = true;
        window.addEventListener('scroll', positionTooltip, { passive: true });
        window.addEventListener('resize', positionTooltip, { passive: true });
      }, cfg.delay);
    }

    function hide() {
      clearTimeout(showTimer);
      if (tooltipEl && isVisible) {
        tooltipEl.style.opacity = '0';
        isVisible = false;
        window.removeEventListener('scroll', positionTooltip);
        window.removeEventListener('resize', positionTooltip);
      }
    }

    el.addEventListener('mouseenter', show);
    el.addEventListener('focus', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('blur', hide);

    addCleanup(el, () => {
      clearTimeout(showTimer);
      if (tooltipEl) { tooltipEl.style.opacity = '0'; setTimeout(() => tooltipEl?.remove(), 200); tooltipEl = null; }
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('focus', show);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('blur', hide);
      window.removeEventListener('scroll', positionTooltip);
      window.removeEventListener('resize', positionTooltip);
    });
  }

  // ═══════════════════════════════════════════════════════
  //  CLIPBOARD
  // ═══════════════════════════════════════════════════════
  function handleClipboard(el, rawExpr, state, raa) {
    if (el.__raa_ui_clipboard_done__) return;
    el.__raa_ui_clipboard_done__ = true;

    const getText = () => {
      if (rawExpr == null) return '';
      if (typeof rawExpr === 'function') return rawExpr.call(el, state);
      if (typeof rawExpr !== 'string') return String(rawExpr);
      const val = raa.evaluate(rawExpr, state, el);
      return val != null ? String(val) : '';
    };

    const handler = async (e) => {
      e.preventDefault();
      const text = getText();
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        // Fallback untuk browser tanpa Clipboard API
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      el.classList.add('raa-copied');
      setTimeout(() => el.classList.remove('raa-copied'), 1500);
      if (el.dataset.raaUiClipboardSuccess) {
        raa.evaluate(el.dataset.raaUiClipboardSuccess, state, el);
      }
    };

    el.addEventListener('click', handler);
    addCleanup(el, () => el.removeEventListener('click', handler));
  }

  // ═══════════════════════════════════════════════════════
  //  SCROLL-TO
  // ═══════════════════════════════════════════════════════
  function handleScrollTo(el, rawExpr, state, raa) {
    if (el.__raa_ui_scrollto_done__) return;
    el.__raa_ui_scrollto_done__ = true;

    const cfg = resolveConfig(el, state, raa, window.RaaUI.config.scrollTo, 'raa-ui:scroll-to-config');

    const getSelector = () => {
      if (rawExpr == null) return null;
      if (typeof rawExpr === 'function') return rawExpr.call(el, state);
      if (typeof rawExpr !== 'string') return String(rawExpr);
      return raa.evaluate(rawExpr, state, el);
    };

    const handler = (e) => {
      e.preventDefault();
      const selector = getSelector();
      if (!selector) return;
      const target = document.querySelector(selector);
      if (!target) { console.warn(`[RaaUI] Scroll target tidak ditemukan: ${selector}`); return; }

      if ('scrollBehavior' in document.documentElement.style) {
        target.scrollIntoView({ behavior: cfg.behavior, block: cfg.block });
      } else {
        const start = window.scrollY;
        const targetY = start + target.getBoundingClientRect().top -
          (cfg.block === 'center' ? window.innerHeight / 2 : 0);
        const duration = cfg.duration;
        const startTime = performance.now();
        const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        function animate(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          window.scrollTo(0, start + (targetY - start) * ease(progress));
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      }
      if (selector.startsWith('#')) history.replaceState(null, null, selector);
    };

    el.addEventListener('click', handler);
    addCleanup(el, () => el.removeEventListener('click', handler));
  }

  // ═══════════════════════════════════════════════════════
  //  MASK
  // ═══════════════════════════════════════════════════════
  function handleMask(el, pattern, state, raa) {
    if (el.__raa_ui_mask_done__) return;
    el.__raa_ui_mask_done__ = true;

    const cfg = resolveConfig(el, state, raa, window.RaaUI.config.mask, 'raa-ui:mask-config');
    const maskTokens = String(pattern).split('');

    function applyMask(value) {
      let result = '', valIdx = 0;
      const clean = String(value ?? '').replace(/[^a-zA-Z0-9]/g, '');
      for (const token of maskTokens) {
        if (valIdx >= clean.length) break;
        if      (token === '9' && /\d/.test(clean[valIdx]))         result += clean[valIdx++];
        else if (token === 'a' && /[a-zA-Z]/.test(clean[valIdx]))   result += clean[valIdx++];
        else if (token === '*' && /[a-zA-Z0-9]/.test(clean[valIdx]))result += clean[valIdx++];
        else if (token === 'X' && /[a-zA-Z0-9]/.test(clean[valIdx]))result += clean[valIdx++].toUpperCase();
        else { result += token; if (clean[valIdx] === token) valIdx++; }
      }
      return result;
    }

    const handler = () => {
      const masked = applyMask(el.value);
      if (el.value !== masked) {
        const pos = el.selectionStart || 0;
        el.value = masked;
        setTimeout(() => {
          if (el.setSelectionRange) {
            const clampedPos = Math.min(pos + 1, masked.length);
            el.setSelectionRange(clampedPos, clampedPos);
          }
        }, 0);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    el.addEventListener('input', handler);
    if (cfg.lazy) el.addEventListener('blur', handler);
    if (el.value) el.value = applyMask(el.value);

    addCleanup(el, () => {
      el.removeEventListener('input', handler);
      el.removeEventListener('blur', handler);
    });
  }

  // ═══════════════════════════════════════════════════════
  //  OUTSIDE CLICK
  // ═══════════════════════════════════════════════════════
  function handleOutside(el, rawExpr, state, root, raa) {
    if (el.__raa_ui_outside_done__) return;
    el.__raa_ui_outside_done__ = true;

    const handler = (e) => {
      if (el.contains(e.target)) return;
      let result;
      if (typeof rawExpr === 'function') result = rawExpr.call(el, state, e);
      else if (typeof rawExpr === 'string') result = raa.evaluate(rawExpr, state, el);
      else result = rawExpr;
      if (result === false) e.stopPropagation();
    };

    document.addEventListener('click', handler, true);
    addCleanup(el, () => document.removeEventListener('click', handler, true));
  }
  
  // ═══════════════════════════════════════════════════════
  //  PLUGIN DEFINITION (v3.0.0 Plugin System)
  // ═══════════════════════════════════════════════════════
  const RaaUIPlugin = {
    name: 'raa-ui',

    install(raa) {
      // ── 1. Daftarkan wildcard directive raa-ui:* ─────────────────────────
      raa.__raa_custom_directives__.push([
        'raa-ui:*',
        function handleUIDirective(el, name, rawValue, state, root) {
          // raa-ui:*-config adalah atribut modifier — dibaca via getAttribute()
          // di dalam masing-masing handler. Tidak perlu diproses di sini.
          if (name.endsWith('-config')) return;

          switch (name) {
            case 'raa-ui:tooltip':
              handleTooltip(el, rawValue, state, raa);
              break;
            case 'raa-ui:clipboard':
              handleClipboard(el, rawValue, state, raa);
              break;
            case 'raa-ui:scroll-to':
              handleScrollTo(el, rawValue, state, raa);
              break;
            case 'raa-ui:mask':
              handleMask(el, rawValue, state, raa);
              break;
            case 'raa-ui:outside':
              handleOutside(el, rawValue, state, root, raa);
              break;
            default:
              console.warn(`[RaaUI] Directive tidak dikenal: ${name}`);
          }
        }
      ]);

      // ── 2. beforeDestroy: jalankan semua cleanup di seluruh subtree ──────
      raa.pluginManager.addHook('beforeDestroy', function (root) {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        const all = [root, ...Array.from(root.querySelectorAll('*'))];
        all.forEach(runCleanup);
      }, 'raa-ui');
    },

    uninstall(raa) {}
  };

  // ═══════════════════════════════════════════════════════
  //  AUTO-INSTALL
  // ═══════════════════════════════════════════════════════
  function installPlugin() {
    if (typeof window.Raa === 'undefined') {
      console.warn('[RaaUI] window.Raa tidak ditemukan. Muat raa-v3.0.0.js terlebih dahulu.');
      return;
    }
    window.Raa.use(RaaUIPlugin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPlugin);
  } else {
    installPlugin();
  }

})();
