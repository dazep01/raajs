/**
 * RaaJS UI Toolkit v1.0
 * 
 * Directive:
 *   raa-ui:tooltip    – Tooltip saat hover/focus
 *   raa-ui:clipboard  – Salin teks ke clipboard saat klik
 *   raa-ui:scroll-to  – Gulir mulus ke elemen target
 *   raa-ui:mask       – Input mask untuk format tertentu
 *   raa-ui:outside    – Deteksi klik di luar elemen
 * 
 * Semua directive CSP-safe, tidak ada eval, auto-cleanup.
 */
(function () {
  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaUI] RaaJS not found. Load raa.js first.');
    return;
  }

  // ═══════════════════════════════════════════════════
  //  GLOBAL CONFIG
  // ═══════════════════════════════════════════════════
  window.RaaUI = {
    config: {
      tooltip: {
        position: 'top',     // top, bottom, left, right
        offset: 8,
        delay: 300,          // ms sebelum muncul
        className: 'raa-tooltip'
      },
      scrollTo: {
        behavior: 'smooth',
        block: 'start',
        duration: 800         // fallback jika smooth tidak didukung
      },
      mask: {
        lazy: true            // jika true, format saat blur; false = format saat input
      }
    }
  };

  // ═══════════════════════════════════════════════════
  //  UTILITIES
  // ═══════════════════════════════════════════════════
  function createElement(tag, attrs = {}, styles = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    Object.assign(el.style, styles);
    return el;
  }

  // ═══════════════════════════════════════════════════
  //  1. TOOLTIP
  // ═══════════════════════════════════════════════════
  function setupTooltip(el, content, config) {
    if (el.__raa_tooltip__) return; // sudah terpasang
    el.__raa_tooltip__ = true;

    let tooltipEl = null;
    let showTimer = null;
    let isVisible = false;

    const mergedConfig = { ...RaaUI.config.tooltip, ...config };

    function createTooltip() {
      if (tooltipEl) return;
      tooltipEl = createElement('div', {
        class: mergedConfig.className,
        role: 'tooltip'
      }, {
        position: 'absolute',
        zIndex: '9999',
        pointerEvents: 'none',
        opacity: '0',
        transition: `opacity 0.2s`,
        whiteSpace: 'nowrap',
        padding: '6px 10px',
        borderRadius: '4px',
        background: '#333',
        color: '#fff',
        fontSize: '13px',
        maxWidth: '200px'
      });
      tooltipEl.textContent = content;
      document.body.appendChild(tooltipEl);
    }

    function positionTooltip() {
      if (!tooltipEl) return;
      const rect = el.getBoundingClientRect();
      const tooltipRect = tooltipEl.getBoundingClientRect();
      const pos = mergedConfig.position;
      const offset = mergedConfig.offset;

      let top, left;
      switch (pos) {
        case 'top':
          top = rect.top - tooltipRect.height - offset + window.scrollY;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2 + window.scrollX;
          break;
        case 'bottom':
          top = rect.bottom + offset + window.scrollY;
          left = rect.left + rect.width / 2 - tooltipRect.width / 2 + window.scrollX;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2 + window.scrollY;
          left = rect.left - tooltipRect.width - offset + window.scrollX;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipRect.height / 2 + window.scrollY;
          left = rect.right + offset + window.scrollX;
          break;
      }
      tooltipEl.style.top = Math.max(0, top) + 'px';
      tooltipEl.style.left = Math.max(0, left) + 'px';
    }

    function show() {
      clearTimeout(showTimer);
      showTimer = setTimeout(() => {
        createTooltip();
        positionTooltip();
        tooltipEl.style.opacity = '1';
        isVisible = true;
      }, mergedConfig.delay);
    }

    function hide() {
      clearTimeout(showTimer);
      if (tooltipEl && isVisible) {
        tooltipEl.style.opacity = '0';
        isVisible = false;
      }
    }

    el.addEventListener('mouseenter', show);
    el.addEventListener('focus', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('blur', hide);

    // Simpan referensi untuk cleanup
    el.__raa_tooltip_cleanup__ = () => {
      clearTimeout(showTimer);
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('focus', show);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('blur', hide);
    };
  }

  // ═══════════════════════════════════════════════════
  //  2. CLIPBOARD
  // ═══════════════════════════════════════════════════
  function setupClipboard(el, textExpr, state) {
    if (el.__raa_clipboard__) return;
    el.__raa_clipboard__ = true;

    el.addEventListener('click', async (e) => {
      e.preventDefault();
      const text = typeof textExpr === 'function' ? textExpr() : textExpr;
      try {
        await navigator.clipboard.writeText(String(text));
        el.classList.add('raa-copied');
        setTimeout(() => el.classList.remove('raa-copied'), 1500);
      } catch (err) {
        console.warn('[RaaUI] Clipboard write failed:', err);
        // Fallback untuk browser lama
        const textarea = document.createElement('textarea');
        textarea.value = String(text);
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        el.classList.add('raa-copied');
        setTimeout(() => el.classList.remove('raa-copied'), 1500);
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  3. SCROLL TO
  // ═══════════════════════════════════════════════════
  function setupScrollTo(el, targetExpr, config) {
    if (el.__raa_scrollto__) return;
    el.__raa_scrollto__ = true;

    const mergedConfig = { ...RaaUI.config.scrollTo, ...config };

    el.addEventListener('click', (e) => {
      e.preventDefault();
      const selector = typeof targetExpr === 'function' ? targetExpr() : targetExpr;
      const target = document.querySelector(selector);
      if (!target) return;

      if ('scrollBehavior' in document.documentElement.style) {
        target.scrollIntoView({
          behavior: mergedConfig.behavior,
          block: mergedConfig.block
        });
      } else {
        // Fallback smooth scroll
        const targetRect = target.getBoundingClientRect();
        const start = window.scrollY;
        const targetY = start + targetRect.top - (mergedConfig.block === 'center' ? window.innerHeight / 2 : 0);
        const duration = mergedConfig.duration;
        const startTime = performance.now();

        function animate(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          window.scrollTo(0, start + (targetY - start) * ease(progress));
          if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      }
    });
  }

  // ═══════════════════════════════════════════════════
  //  4. INPUT MASK
  // ═══════════════════════════════════════════════════
  function setupMask(el, pattern, config) {
    if (el.__raa_mask__) return;
    el.__raa_mask__ = true;

    const mergedConfig = { ...RaaUI.config.mask, ...config };

    // Pattern: '9' = digit, 'a' = huruf, '*' = alfanumerik, lainnya = literal
    const maskTokens = pattern.split('');

    function applyMask(value) {
      let result = '';
      let valIndex = 0;
      const cleanValue = value.replace(/[^a-zA-Z0-9]/g, ''); // bersihkan dulu

      for (const token of maskTokens) {
        if (valIndex >= cleanValue.length) break;
        if (token === '9') {
          if (/\d/.test(cleanValue[valIndex])) {
            result += cleanValue[valIndex];
            valIndex++;
          }
        } else if (token === 'a') {
          if (/[a-zA-Z]/.test(cleanValue[valIndex])) {
            result += cleanValue[valIndex];
            valIndex++;
          }
        } else if (token === '*') {
          if (/[a-zA-Z0-9]/.test(cleanValue[valIndex])) {
            result += cleanValue[valIndex];
            valIndex++;
          }
        } else {
          result += token;
          // Jika karakter berikutnya di input adalah literal yang sama, lewati
          if (cleanValue[valIndex] === token) valIndex++;
        }
      }
      return result;
    }

    const handler = (e) => {
      const masked = applyMask(el.value);
      if (el.value !== masked) {
        el.value = masked;
        // Trigger input event agar model binding RaaJS terupdate
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    if (mergedConfig.lazy) {
      el.addEventListener('blur', handler);
      el.addEventListener('input', handler); // tetap untuk model binding
    } else {
      el.addEventListener('input', handler);
    }

    el.__raa_mask_cleanup__ = () => {
      el.removeEventListener('input', handler);
      el.removeEventListener('blur', handler);
    };
  }

  // ═══════════════════════════════════════════════════
  //  5. CLICK OUTSIDE
  // ═══════════════════════════════════════════════════
  function setupOutside(el, callbackExpr, state, root) {
    if (el.__raa_outside__) return;
    el.__raa_outside__ = true;

    const handler = (e) => {
      if (!el.contains(e.target)) {
        Raa.evaluate(callbackExpr, state, el);
      }
    };

    document.addEventListener('click', handler, true);
    el.__raa_outside_cleanup__ = () => {
      document.removeEventListener('click', handler, true);
    };
  }

  // ═══════════════════════════════════════════════════
  //  INTEGRATION WITH RaaJS
  // ═══════════════════════════════════════════════════
  const Raa = window.Raa;
  const originalCreateBindingEffect = Raa.createBindingEffect.bind(Raa);

  Raa.createBindingEffect = function (el, name, value, state, root) {
    // ─────────────────────────────────
    // raa-ui:tooltip
    // ─────────────────────────────────
    if (name === 'raa-ui:tooltip') {
      el.__raa_effects__.push(this.createEffect(() => {
        const content = this.evaluate(value, state, el);
        if (content) {
          const pos = el.dataset.raaUiTooltipPosition || undefined;
          setupTooltip(el, content, { position: pos });
        }
      }, { root, element: el }));
      return;
    }

    // ─────────────────────────────────
    // raa-ui:clipboard
    // ─────────────────────────────────
    if (name === 'raa-ui:clipboard') {
      el.__raa_effects__.push(this.createEffect(() => {
        const text = this.evaluate(value, state, el);
        setupClipboard(el, text, state);
      }, { root, element: el }));
      return;
    }

    // ─────────────────────────────────
    // raa-ui:scroll-to
    // ─────────────────────────────────
    if (name === 'raa-ui:scroll-to') {
      el.__raa_effects__.push(this.createEffect(() => {
        const selector = this.evaluate(value, state, el);
        if (selector) {
          setupScrollTo(el, selector, {});
        }
      }, { root, element: el }));
      return;
    }

    // ─────────────────────────────────
    // raa-ui:mask
    // ─────────────────────────────────
    if (name === 'raa-ui:mask') {
      el.__raa_effects__.push(this.createEffect(() => {
        setupMask(el, value, {});
      }, { root, element: el }));
      return;
    }

    // ─────────────────────────────────
    // raa-ui:outside
    // ─────────────────────────────────
    if (name === 'raa-ui:outside') {
      el.__raa_effects__.push(this.createEffect(() => {
        setupOutside(el, value, state, root);
      }, { root, element: el }));
      return;
    }

    // Fallback
    return originalCreateBindingEffect(el, name, value, state, root);
  };

  // ═══════════════════════════════════════════════════
  //  CLEANUP OVERRIDE
  // ═══════════════════════════════════════════════════
  const originalDeepCleanup = Raa.deepCleanup.bind(Raa);
  Raa.deepCleanup = function (el, visited = new WeakSet()) {
    if (!el || visited.has(el)) return;
    visited.add(el);

    // Cleanup tooltip
    if (el.__raa_tooltip_cleanup__) {
      el.__raa_tooltip_cleanup__();
      el.__raa_tooltip_cleanup__ = null;
      el.__raa_tooltip__ = false;
    }
    // Cleanup mask
    if (el.__raa_mask_cleanup__) {
      el.__raa_mask_cleanup__();
      el.__raa_mask_cleanup__ = null;
      el.__raa_mask__ = false;
    }
    // Cleanup outside
    if (el.__raa_outside_cleanup__) {
      el.__raa_outside_cleanup__();
      el.__raa_outside_cleanup__ = null;
      el.__raa_outside__ = false;
    }
    // Reset clipboard & scrollto flag
    el.__raa_clipboard__ = false;
    el.__raa_scrollto__ = false;

    originalDeepCleanup(el, visited);
  };

  console.log('[RaaUI] v1.0 loaded. Directives: tooltip, clipboard, scroll-to, mask, outside.');
})();