/**
 * RaaJS UI Toolkit | v2.2.0
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
 * - Reactive-First, Multi-plugin Safe, Zero-Dependency, Lightweight.
 * 
 * "Interaksi yang baik adalah yang tidak terasa, namun sangat membantu."
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  if (!window.RaaJS || !window.RaaJS.prototype) {
    console.warn('[RaaUI] RaaJS class not found.');
    return;
  }

  const RaaJS = window.RaaJS;

  window.RaaUI = {
    config: {
      tooltip: { position: 'top', offset: 8, delay: 300, className: 'raa-tooltip' },
      scrollTo: { behavior: 'smooth', block: 'start', duration: 800 },
      mask: { lazy: true }
    }
  };

  function createElement(tag, attrs = {}, styles = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    Object.assign(el.style, styles);
    return el;
  }

  function resolveConfig(el, state, Raa, defaults, configAttrName) {
    let cfg = { ...defaults };
    if (state && state.uiConfig && typeof state.uiConfig === 'object') {
      const key = configAttrName === 'raa-ui:tooltip-config' ? 'tooltip' :
                  configAttrName === 'raa-ui:scroll-to-config' ? 'scrollTo' :
                  configAttrName === 'raa-ui:mask-config' ? 'mask' : null;
      if (key && state.uiConfig[key]) cfg = { ...cfg, ...state.uiConfig[key] };
    }
    const configAttr = el.getAttribute(configAttrName);
    if (configAttr) {
      try {
        const perCfg = Raa.evaluate(configAttr, state, el);
        if (perCfg && typeof perCfg === 'object') cfg = { ...cfg, ...perCfg };
      } catch (e) {}
    }
    // data-* overrides
    if (configAttrName === 'raa-ui:tooltip-config') {
      if (el.dataset.raaUiTooltipPosition) cfg.position = el.dataset.raaUiTooltipPosition;
      if (el.dataset.raaUiTooltipOffset) cfg.offset = parseInt(el.dataset.raaUiTooltipOffset, 10);
      if (el.dataset.raaUiTooltipDelay) cfg.delay = parseInt(el.dataset.raaUiTooltipDelay, 10);
      if (el.dataset.raaUiTooltipClass) cfg.className = el.dataset.raaUiTooltipClass;
    } else if (configAttrName === 'raa-ui:scroll-to-config') {
      if (el.dataset.raaUiScrollBehavior) cfg.behavior = el.dataset.raaUiScrollBehavior;
      if (el.dataset.raaUiScrollBlock) cfg.block = el.dataset.raaUiScrollBlock;
      if (el.dataset.raaUiScrollDuration) cfg.duration = parseInt(el.dataset.raaUiScrollDuration, 10);
    } else if (configAttrName === 'raa-ui:mask-config') {
      if (el.dataset.raaUiMaskLazy !== undefined) cfg.lazy = el.dataset.raaUiMaskLazy === 'true';
    }
    return cfg;
  }

  function install(instance) {
    if (!Array.isArray(instance.__raa_custom_directives__)) {
      instance.__raa_custom_directives__ = [];
    }

    instance.__raa_custom_directives__.push(['raa-ui:*', function (el, name, rawValue, state, root) {
      const Raa = this;
      switch (name) {
        case 'raa-ui:tooltip':
          handleTooltip(el, rawValue, state, Raa);
          break;
        case 'raa-ui:clipboard':
          handleClipboard(el, rawValue, state, Raa);
          break;
        case 'raa-ui:scroll-to':
          handleScrollTo(el, rawValue, state, Raa);
          break;
        case 'raa-ui:mask':
          handleMask(el, rawValue, state, Raa);
          break;
        case 'raa-ui:outside':
          handleOutside(el, rawValue, state, root, Raa);
          break;
        default:
          console.warn(`[RaaUI] Unknown directive: ${name}`);
      }
    }]);

    const originalDeepCleanup = instance.deepCleanup?.bind(instance) || function(){};
    instance.deepCleanup = function (el, visited = new WeakSet()) {
      if (!el || visited.has(el)) return;
      visited.add(el);
      if (el.__raa_cleanup__) {
        el.__raa_cleanup__.forEach(fn => { try { fn(); } catch (e) {} });
        el.__raa_cleanup__ = null;
      }
      el.__raa_ui_tooltip_done__ = false;
      el.__raa_ui_clipboard_done__ = false;
      el.__raa_ui_scrollto_done__ = false;
      el.__raa_ui_mask_done__ = false;
      el.__raa_ui_outside_done__ = false;
      originalDeepCleanup(el, visited);
    };
    console.log('[RaaUI] v2.4 – installed (reactive)');
  }

  // ────────────────────────────── TOOLTIP (reactive) ──────────────────────────────
  function handleTooltip(el, rawExpr, state, Raa) {
    if (el.__raa_ui_tooltip_done__) return;
    el.__raa_ui_tooltip_done__ = true;

    let tooltipEl = null, showTimer = null, isVisible = false;
    const cfg = resolveConfig(el, state, Raa, window.RaaUI.config.tooltip, 'raa-ui:tooltip-config');

    const getContent = () => {
      if (rawExpr == null) return null;
      if (typeof rawExpr === 'function') return rawExpr.call(el, state);
      if (typeof rawExpr !== 'string') return rawExpr;
      return Raa.evaluate(rawExpr, state, el);
    };

function createTooltip() {
  if (tooltipEl) return;
  const defaultStyles = {
    position: 'absolute', zIndex: '9999', pointerEvents: 'none', opacity: '0',
    transition: 'opacity 0.2s', whiteSpace: 'pre-wrap', padding: '6px 10px',
    borderRadius: '4px', background: '#333', color: '#fff', fontSize: '13px',
    maxWidth: '200px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  };
  const finalStyles = { ...defaultStyles, ...(cfg.styles || {}) };
  tooltipEl = createElement('div', { class: cfg.className, role: 'tooltip' }, finalStyles);
  document.body.appendChild(tooltipEl);
}

    function positionTooltip() {
      if (!tooltipEl) return;
      const rect = el.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const pos = cfg.position, offset = cfg.offset;
      let top, left;
      switch (pos) {
        case 'top': top = rect.top - tooltipRect.height - offset + window.scrollY; left = rect.left + rect.width/2 - tooltipRect.width/2 + window.scrollX; break;
        case 'bottom': top = rect.bottom + offset + window.scrollY; left = rect.left + rect.width/2 - tooltipRect.width/2 + window.scrollX; break;
        case 'left': top = rect.top + rect.height/2 - tooltipRect.height/2 + window.scrollY; left = rect.left - tooltipRect.width - offset + window.scrollX; break;
        case 'right': top = rect.top + rect.height/2 - tooltipRect.height/2 + window.scrollY; left = rect.right + offset + window.scrollX; break;
        default: top = rect.top - tooltipRect.height - offset + window.scrollY; left = rect.left + rect.width/2 - tooltipRect.width/2 + window.scrollX;
      }
      tooltipEl.style.top = Math.max(4, Math.min(top, document.documentElement.scrollHeight - tooltipRect.height - 4)) + 'px';
      tooltipEl.style.left = Math.max(4, Math.min(left, document.documentElement.scrollWidth - tooltipRect.width - 4)) + 'px';
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

    if (!el.__raa_cleanup__) el.__raa_cleanup__ = [];
    el.__raa_cleanup__.push(() => {
      clearTimeout(showTimer);
      if (tooltipEl) { tooltipEl.style.opacity = '0'; setTimeout(() => tooltipEl.remove(), 200); }
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('focus', show);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('blur', hide);
      window.removeEventListener('scroll', positionTooltip);
      window.removeEventListener('resize', positionTooltip);
    });
  }

  // ────────────────────────────── CLIPBOARD (reactive) ──────────────────────────────
  function handleClipboard(el, rawExpr, state, Raa) {
    if (el.__raa_ui_clipboard_done__) return;
    el.__raa_ui_clipboard_done__ = true;

    const getText = () => {
      if (rawExpr == null) return '';
      if (typeof rawExpr === 'function') return rawExpr.call(el, state);
      if (typeof rawExpr !== 'string') return String(rawExpr);
      const val = Raa.evaluate(rawExpr, state, el);
      return val != null ? String(val) : '';
    };

    el.addEventListener('click', async (e) => {
      e.preventDefault();
      const textStr = getText();
      try { await navigator.clipboard.writeText(textStr); }
      catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = textStr;
        textarea.style.cssText = 'position:fixed;opacity:0;left:-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      el.classList.add('raa-copied');
      setTimeout(() => el.classList.remove('raa-copied'), 1500);
      if (el.dataset.raaUiClipboardSuccess) {
        Raa.evaluate(el.dataset.raaUiClipboardSuccess, state, el);
      }
    });
  }

  // ────────────────────────────── SCROLL-TO (reactive) ──────────────────────────────
  function handleScrollTo(el, rawExpr, state, Raa) {
    if (el.__raa_ui_scrollto_done__) return;
    el.__raa_ui_scrollto_done__ = true;

    let cfg = resolveConfig(el, state, Raa, window.RaaUI.config.scrollTo, 'raa-ui:scroll-to-config');

    const getSelector = () => {
      if (rawExpr == null) return null;
      if (typeof rawExpr === 'function') return rawExpr.call(el, state);
      if (typeof rawExpr !== 'string') return String(rawExpr);
      return Raa.evaluate(rawExpr, state, el);
    };

    el.addEventListener('click', (e) => {
      e.preventDefault();
      const selector = getSelector();
      if (!selector) return;
      const target = document.querySelector(selector);
      if (!target) { console.warn(`[RaaUI] Scroll target not found: ${selector}`); return; }
      if ('scrollBehavior' in document.documentElement.style) {
        target.scrollIntoView({ behavior: cfg.behavior, block: cfg.block });
      } else {
        const targetRect = target.getBoundingClientRect();
        const start = window.scrollY;
        const targetY = start + targetRect.top - (cfg.block === 'center' ? window.innerHeight / 2 : 0);
        const duration = cfg.duration;
        const startTime = performance.now();
        const easeInOutQuad = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        function animate(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeInOutQuad(progress);
          window.scrollTo(0, start + (targetY - start) * eased);
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      }
      if (selector.startsWith('#')) history.replaceState(null, null, selector);
    });
  }

  // ────────────────────────────── MASK (no reactivity needed) ──────────────────────────────
  function handleMask(el, pattern, state, Raa) {
    if (el.__raa_ui_mask_done__) return;
    el.__raa_ui_mask_done__ = true;

    const cfg = resolveConfig(el, state, Raa, window.RaaUI.config.mask, 'raa-ui:mask-config');
    const maskTokens = String(pattern).split('');

    function applyMask(value) {
      let result = '', valIndex = 0;
      const cleanValue = String(value ?? '').replace(/[^a-zA-Z0-9]/g, '');
      for (const token of maskTokens) {
        if (valIndex >= cleanValue.length) break;
        if (token === '9' && /\d/.test(cleanValue[valIndex])) result += cleanValue[valIndex++];
        else if (token === 'a' && /[a-zA-Z]/.test(cleanValue[valIndex])) result += cleanValue[valIndex++];
        else if (token === '*' && /[a-zA-Z0-9]/.test(cleanValue[valIndex])) result += cleanValue[valIndex++];
        else if (token === 'X' && /[a-zA-Z0-9]/.test(cleanValue[valIndex])) result += cleanValue[valIndex++].toUpperCase();
        else { result += token; if (cleanValue[valIndex] === token) valIndex++; }
      }
      return result;
    }

    const handler = (e) => {
      const masked = applyMask(el.value);
      if (el.value !== masked) {
        const pos = el.selectionStart || 0;
        el.value = masked;
        setTimeout(() => { if (el.setSelectionRange) el.setSelectionRange(Math.min(pos + 1, masked.length), Math.min(pos + 1, masked.length)); }, 0);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };
    el.addEventListener('input', handler);
    if (cfg.lazy) el.addEventListener('blur', handler);
    if (el.value) el.value = applyMask(el.value);
    if (!el.__raa_cleanup__) el.__raa_cleanup__ = [];
    el.__raa_cleanup__.push(() => { el.removeEventListener('input', handler); el.removeEventListener('blur', handler); });
  }

  // ────────────────────────────── OUTSIDE (reactive) ──────────────────────────────
  function handleOutside(el, rawExpr, state, root, Raa) {
    if (el.__raa_ui_outside_done__) return;
    el.__raa_ui_outside_done__ = true;

    const handler = (e) => {
      if (!el.contains(e.target)) {
        let result;
        if (typeof rawExpr === 'function') result = rawExpr.call(el, state, e);
        else if (typeof rawExpr === 'string') result = Raa.evaluate(rawExpr, state, el);
        else result = rawExpr;
        if (result === false) e.stopPropagation();
      }
    };
    document.addEventListener('click', handler, true);
    if (!el.__raa_cleanup__) el.__raa_cleanup__ = [];
    el.__raa_cleanup__.push(() => document.removeEventListener('click', handler, true));
  }

  // ────────────────────────────── INIT ──────────────────────────────
  const originalInit = RaaJS.prototype.init;
  RaaJS.prototype.init = function () {
    if (!this.__raa_ui_installed__) {
      install(this);
      this.__raa_ui_installed__ = true;
    }
    return originalInit.call(this);
  };
  console.log('[RaaUI] v2.4 – Plugin ready (fully reactive)');
})();