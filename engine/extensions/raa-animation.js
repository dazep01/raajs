/**
 * RaaJS Animation Extension v2.0
 * Directive:
 *   raa-animation:enter   – animasi masuk (berbasis state boolean)
 *   raa-animation:leave   – animasi keluar (berbasis state boolean)
 *   raa-animation:scroll  – animasi saat elemen masuk viewport
 *   raa-animation:group   – stagger animasi untuk raa-flow:for
 *   raa-animation:loop    – animasi berulang otomatis (dekoratif)
 *   raa-animation:trigger – animasi berdasarkan event (hover, click, focus, dll)
 *
 * Default behavior: CSS transition fade + slide ringan.
 * Customizable via RaaAnimation.config atau data attributes.
 * CSP‑safe, no eval, no new Function.
 */
(function () {
  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaAnimation] RaaJS not found. Load raa.js first.');
    return;
  }

  // ═══════════════════════════════════════════════════
  //  GLOBAL CONFIGURATION
  // ═══════════════════════════════════════════════════
  window.RaaAnimation = {
    config: {
      // Default enter / leave
      enter: {
        from: { opacity: 0, transform: 'translateY(10px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
        duration: 300,
        easing: 'ease-out',
        type: 'transition'   // 'transition' | 'keyframe'
      },
      leave: {
        from: { opacity: 1, transform: 'translateY(0)' },
        to: { opacity: 0, transform: 'translateY(10px)' },
        duration: 200,
        easing: 'ease-in',
        type: 'transition'
      },
      // Group (stagger)
      group: {
        stagger: 50,          // ms delay antar item
        itemAnimation: 'enter'
      },
      // Scroll
      scroll: {
        threshold: 0.2,
        animation: 'enter',
        once: true
      },
      // Loop (contoh pulse)
      loop: {
        pulse: {
          keyframes: [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.1)', opacity: 0.7 },
            { transform: 'scale(1)', opacity: 1 }
          ],
          duration: 800,
          iterations: Infinity,
          easing: 'ease-in-out',
          type: 'keyframe'
        },
        spin: {
          keyframes: [
            { transform: 'rotate(0deg)' },
            { transform: 'rotate(360deg)' }
          ],
          duration: 600,
          iterations: Infinity,
          easing: 'linear',
          type: 'keyframe'
        }
      },
      // Trigger presets (optional)
      trigger: {
        hover: {
          enter: 'enter',
          leave: 'leave'
        },
        click: {
          toggle: 'pop'      // akan mencari config.pop, fallback ke enter
        },
        focus: {
          enter: 'glow',
          leave: 'leave'
        }
      }
    },

    // ─── PUBLIC API ─────────────────────────────────

    /**
     * Main method: play animation on element
     * @param {Element} el
     * @param {string} animationName – key di config (misal 'enter', 'pulse')
     * @param {object} customConfig  – override sementara
     * @returns {Promise} resolved setelah animasi selesai (kecuali loop)
     */
    async play(el, animationName, customConfig = {}) {
      const baseConfig = this.config[animationName] || this.config.enter;
      const config = Object.assign({}, baseConfig, customConfig);

      if (config.type === 'keyframe') {
        return this._playKeyframe(el, config);
      } else {
        return this._playTransition(el, config);
      }
    },

    /**
     * Trigger animasi secara manual (untuk integrasi JS)
     * @param {Element} el
     * @param {string} animationName
     * @param {object} customConfig
     */
    trigger(el, animationName, customConfig = {}) {
      return this.play(el, animationName, customConfig);
    },

    /**
     * Hentikan animasi yang sedang berjalan
     * @param {Element} el
     */
    stop(el) {
      if (el.__raa_animation__) {
        el.__raa_animation__.cancel();
        el.__raa_animation__ = null;
      }
    },

    // ─── PRIVATE HELPERS ────────────────────────────

    _playTransition(el, config) {
      return new Promise(resolve => {
        const { from, to, duration, easing } = config;

        Object.assign(el.style, from, {
          transition: `all ${duration}ms ${easing}`
        });

        // Force reflow
        void el.offsetWidth;

        Object.assign(el.style, to);

        const onEnd = (e) => {
          if (e.target !== el) return;
          el.removeEventListener('transitionend', onEnd);
          el.style.transition = '';
          resolve();
        };

        el.addEventListener('transitionend', onEnd);

        // Fallback timeout (safety)
        setTimeout(() => {
          el.removeEventListener('transitionend', onEnd);
          resolve();
        }, duration + 50);
      });
    },

    _playKeyframe(el, config) {
      return new Promise(resolve => {
        const { keyframes, duration, easing, iterations = 1 } = config;

        // Batalkan animasi sebelumnya
        if (el.__raa_animation__) {
          el.__raa_animation__.cancel();
        }

        const animation = el.animate(keyframes, {
          duration,
          easing,
          fill: 'forwards',
          iterations
        });

        el.__raa_animation__ = animation;

        animation.onfinish = () => {
          el.__raa_animation__ = null;
          resolve();
        };

        // Fallback
        setTimeout(() => {
          if (el.__raa_animation__ === animation) {
            el.__raa_animation__ = null;
            resolve();
          }
        }, duration * iterations + 50);
      });
    },

    // Stagger list items
    applyGroup(container, items, config) {
      const baseAnim = this.config[config.itemAnimation] || this.config.enter;
      const stagger = config.stagger || 50;

      items.forEach((el, index) => {
        setTimeout(() => {
          this.play(el, config.itemAnimation, baseAnim);
        }, index * stagger);
      });
    }
  };

  // ═══════════════════════════════════════════════════
  //  INTEGRATION WITH RaaJS
  // ═══════════════════════════════════════════════════
  const Raa = window.Raa;

  // Simpan referensi original method
  const originalCreateBindingEffect = Raa.createBindingEffect.bind(Raa);
  const originalProcessForTemplate = Raa.processForTemplate.bind(Raa);

  // Override createBindingEffect untuk directive animasi
  Raa.createBindingEffect = function (el, name, value, state, root) {
    // ─────────────────────────────────
    // raa-animation:enter
    // ─────────────────────────────────
    if (name === 'raa-animation:enter') {
      el.__raa_effects__.push(this.createEffect(() => {
        const show = !!this.evaluate(value, state, el);
        if (show) {
          el.style.display = el.__raa_prev_display__ || '';
          const custom = this._parseAnimationConfig(el, 'enter');
          window.RaaAnimation.play(el, custom.animationName || 'enter', custom);
        } else {
          const custom = this._parseAnimationConfig(el, 'leave');
          window.RaaAnimation.play(el, custom.animationName || 'leave', custom).then(() => {
            if (!el.__raa_anim_active__) el.style.display = 'none';
          });
        }
      }, { root, element: el }));
      return;
    }

    // ─────────────────────────────────
    // raa-animation:leave
    // ─────────────────────────────────
    if (name === 'raa-animation:leave') {
      el.__raa_effects__.push(this.createEffect(() => {
        const hide = !!this.evaluate(value, state, el);
        if (hide) {
          const custom = this._parseAnimationConfig(el, 'leave');
          window.RaaAnimation.play(el, custom.animationName || 'leave', custom).then(() => {
            el.style.display = 'none';
          });
        } else {
          el.style.display = el.__raa_prev_display__ || '';
          const custom = this._parseAnimationConfig(el, 'enter');
          window.RaaAnimation.play(el, custom.animationName || 'enter', custom);
        }
      }, { root, element: el }));
      return;
    }

    // ─────────────────────────────────
    // raa-animation:scroll
    // ─────────────────────────────────
    if (name === 'raa-animation:scroll') {
      el.__raa_effects__.push(this.createEffect(() => {
        if (!el.__raa_scroll_observer__) {
          const threshold = parseFloat(el.dataset.raaAnimThreshold) ||
                            window.RaaAnimation.config.scroll.threshold;
          const once = el.dataset.raaAnimOnce !== 'false';
          const animName = el.dataset.raaAnimName ||
                           window.RaaAnimation.config.scroll.animation;

          el.__raa_scroll_observer__ = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const custom = this._parseAnimationConfig(el, animName);
                window.RaaAnimation.play(el, animName, custom);
                if (once) obs.unobserve(el);
              }
            });
          }, { threshold });
          el.__raa_scroll_observer__.observe(el);
        }
      }, { root, element: el }));
      return;
    }

    // ─────────────────────────────────
    // raa-animation:group
    // ─────────────────────────────────
    if (name === 'raa-animation:group') {
      if (el.tagName.toLowerCase() === 'template' && el.hasAttribute('raa-flow:for')) {
        el.__raa_animation_group__ = true;
        // Efek sebenarnya ditangani di override processForTemplate
      }
      // Biarkan efek lain tetap berjalan
      return originalCreateBindingEffect(el, name, value, state, root);
    }

    // ─────────────────────────────────
    // raa-animation:loop
    // ─────────────────────────────────
    if (name === 'raa-animation:loop') {
      el.__raa_effects__.push(this.createEffect(() => {
        // Hanya jalan sekali saat kompilasi
        const animName = el.dataset.raaAnimName || 'pulse'; // default pulse
        const custom = this._parseAnimationConfig(el, animName);
        // Pastikan type keyframe
        custom.type = custom.type || 'keyframe';
        // Loop animasi tidak perlu menunggu selesai
        window.RaaAnimation.play(el, animName, custom);
      }, { root, element: el, priority: Raa.PRIORITY?.LOW || 2 }));
      return;
    }

    // ─────────────────────────────────
    // raa-animation:trigger
    // ─────────────────────────────────
    if (name === 'raa-animation:trigger') {
      const events = String(value).split(',').map(e => e.trim()).filter(Boolean);
      if (events.length === 0) return;

      // Buat efek untuk setup listener (sekali)
      el.__raa_effects__.push(this.createEffect(() => {
        if (el.__raa_trigger_setup_done__) return;
        el.__raa_trigger_setup_done__ = true;

        events.forEach(eventType => {
          if (eventType === 'hover') {
            let isHovering = false;
            el.addEventListener('mouseenter', () => {
              if (isHovering) return;
              isHovering = true;
              const animName = el.dataset.raaAnimName || 'enter';
              const custom = this._parseAnimationConfig(el, animName);
              window.RaaAnimation.play(el, animName, custom);
            });
            el.addEventListener('mouseleave', () => {
              if (!isHovering) return;
              isHovering = false;
              const leaveAnim = el.dataset.raaAnimLeave || 'leave';
              const custom = this._parseAnimationConfig(el, leaveAnim);
              window.RaaAnimation.play(el, leaveAnim, custom);
            });
          } else if (eventType === 'click') {
            let toggled = false;
            el.addEventListener('click', () => {
              const animName = el.dataset.raaAnimName || (toggled ? 'leave' : 'enter');
              const custom = this._parseAnimationConfig(el, animName);
              window.RaaAnimation.play(el, animName, custom);
              toggled = !toggled;
            });
          } else if (eventType === 'focus') {
            let hasFocus = false;
            el.addEventListener('focus', () => {
              if (hasFocus) return;
              hasFocus = true;
              const animName = el.dataset.raaAnimName || 'glow';
              const custom = this._parseAnimationConfig(el, animName);
              window.RaaAnimation.play(el, animName, custom);
            });
            el.addEventListener('blur', () => {
              if (!hasFocus) return;
              hasFocus = false;
              const leaveAnim = el.dataset.raaAnimLeave || 'leave';
              const custom = this._parseAnimationConfig(el, leaveAnim);
              window.RaaAnimation.play(el, leaveAnim, custom);
            });
          } else if (eventType === 'dblclick') {
            el.addEventListener('dblclick', () => {
              const animName = el.dataset.raaAnimName || 'enter';
              const custom = this._parseAnimationConfig(el, animName);
              window.RaaAnimation.play(el, animName, custom);
            });
          } else if (eventType === 'manual') {
            // Tidak otomatis, hanya bisa dipanggil via RaaAnimation.trigger(el, ...)
          }
          // Bisa ditambahkan event lain (tap, dll.) dengan mudah
        });
      }, { root, element: el }));
      return;
    }

    // Fallback ke original untuk directive lain
    originalCreateBindingEffect(el, name, value, state, root);
  };

  // Override processForTemplate untuk animasi group
  Raa.processForTemplate = function (el, expr, state, root) {
    originalProcessForTemplate(el, expr, state, root);

    if (el.__raa_animation_group__ && el.__raa_for_blocks__) {
      const blocks = el.__raa_for_blocks__;
      const items = blocks.map(b => b.nodes[0]).filter(n => n && n.nodeType === 1);
      if (items.length) {
        const groupConfig = window.RaaAnimation.config.group;
        window.RaaAnimation.applyGroup(el, items, groupConfig);
      }
    }
  };

  // ═══════════════════════════════════════════════════
  //  HELPER: Parse data attributes -> config object
  // ═══════════════════════════════════════════════════
  Raa._parseAnimationConfig = function (el, animType) {
    const config = {};

    // Nama animasi (key di RaaAnimation.config)
    if (el.dataset.raaAnimName) {
      config.animationName = el.dataset.raaAnimName;
    }

    // Durasi
    const dur = el.dataset.raaAnimDuration;
    if (dur) config.duration = parseInt(dur);

    // Easing
    if (el.dataset.raaAnimEasing) config.easing = el.dataset.raaAnimEasing;

    // From / To (transition)
    try {
      if (el.dataset.raaAnimFrom) config.from = JSON.parse(el.dataset.raaAnimFrom);
      if (el.dataset.raaAnimTo) config.to = JSON.parse(el.dataset.raaAnimTo);
    } catch (e) {}

    // Type
    if (el.dataset.raaAnimType) config.type = el.dataset.raaAnimType;

    // Keyframes
    if (el.dataset.raaAnimKeyframes) {
      try {
        config.keyframes = JSON.parse(el.dataset.raaAnimKeyframes);
        config.type = 'keyframe';
      } catch (e) {}
    }

    // Iterations (untuk keyframe)
    if (el.dataset.raaAnimIterations) {
      const iter = el.dataset.raaAnimIterations;
      config.iterations = iter === 'infinite' ? Infinity : parseInt(iter);
    }

    // Delay (opsional)
    if (el.dataset.raaAnimDelay) {
      config.delay = parseInt(el.dataset.raaAnimDelay);
    }

    return config;
  };

  console.log('[RaaAnimation] v2.0 loaded. Directives: enter, leave, scroll, group, loop, trigger. Happy animating!');
})();