/**
 * RaaJS Animation Extension | v2.2.0
 * File: raa-animation.js
 * ─────────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai sistem "Bahasa Tubuh" (Body Language) aplikasi. Ekstensi 
 * ini memberikan dimensi ruang dan waktu pada elemen HTML, 
 * mengubah transisi status yang kaku menjadi gerakan organik yang 
 * reaktif melalui Web Animations API.
 * ─────────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-animation:enter  : Animasi saat elemen lahir/masuk ke DOM.
 * - raa-animation:leave  : Gerakan elegan saat elemen dihapus/keluar.
 * - raa-animation:scroll : Memicu aksi saat elemen masuk ke pandangan (Viewport).
 * - raa-animation:loop   : Gerakan repetitif/siklus tanpa henti (seperti napas).
 * - raa-animation:trigger: Animasi yang meledak saat ada interaksi klik.
 * - raa-animation:group  : Orkestrasi animasi massal (stagger/parallel).
 * - raa-animation:config : Rem kendali untuk durasi, easing, dan delay.
 * - window.RaaAnimation  : API global untuk kontrol manual & kustomisasi preset.
 * ─────────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Multi-plugin Safe, Wildcard Pattern (*), High-Performance, Declarative.
 * 
 * "Gerakan adalah cara aplikasi menceritakan emosinya."
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  if (!window.RaaJS || !window.RaaJS.prototype) return;

  const RaaJS = window.RaaJS;

  // ═══════════════════════════════════════
  //  GLOBAL ANIMATION API
  // ═══════════════════════════════════════
  window.RaaAnimation = {
    config: {
      enter: {
        keyframes: [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        duration: 400,
        easing: 'ease-out',
        delay: 0,
        fill: 'forwards',
        type: 'keyframe'
      },
      leave: {
        keyframes: [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(10px)' }
        ],
        duration: 300,
        easing: 'ease-in',
        delay: 0,
        fill: 'forwards',
        type: 'keyframe'
      },
      group: {
        stagger: 0,
        mode: 'parallel',
        duration: 400,
        easing: 'ease-out'
      },
      scroll: {
        keyframes: [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        duration: 500,
        easing: 'ease-out',
        threshold: 0.2,
        once: false,
        type: 'keyframe'
      },
      loop: {
        keyframes: [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0.5, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        duration: 1000,
        easing: 'ease-in-out',
        iterations: Infinity,
        type: 'keyframe'
      },
      trigger: {
        keyframes: [
          { transform: 'scale(1)' },
          { transform: 'scale(1.05)' },
          { transform: 'scale(1)' }
        ],
        duration: 200,
        easing: 'ease-out',
        type: 'keyframe'
      }
    },

    play(el, name, cfg) {
      if (!el || typeof el.animate !== 'function') return null;
      const merged = { ...this.config[name], ...cfg };
      if (merged.type === 'transition') {
        return this._playTransition(el, merged);
      }
      return this._playKeyframe(el, merged);
    },

    _playTransition(el, cfg) {
      const style = el.style;
      for (const prop in cfg.transitions) {
        style[prop] = cfg.transitions[prop];
      }
      style.transition = `all ${cfg.duration}ms ${cfg.easing} ${cfg.delay || 0}ms`;
      const done = () => {
        style.transition = '';
        el.removeEventListener('transitionend', done);
      };
      el.addEventListener('transitionend', done);
      return { cancel: () => done() };
    },

    _playKeyframe(el, cfg) {
      const keyframes = cfg.keyframes || this.config.enter.keyframes;
      const options = {
        duration: cfg.duration,
        easing: cfg.easing,
        delay: cfg.delay || 0,
        fill: cfg.fill || 'forwards',
        iterations: cfg.iterations || 1
      };
      return el.animate(keyframes, options);
    },

    applyGroup(container, items, cfg) {
      const mode = cfg.mode || 'parallel';
      const stagger = cfg.stagger || 0;
      const animationCfg = { ...cfg };
      delete animationCfg.mode;
      delete animationCfg.stagger;

      if (mode === 'sequence') {
        let promise = Promise.resolve();
        items.forEach((item, idx) => {
          promise = promise.then(() => {
            return new Promise(resolve => {
              setTimeout(() => {
                const anim = this.play(item, 'enter', animationCfg);
                if (anim && anim.finished) anim.finished.then(resolve);
                else setTimeout(resolve, animationCfg.duration || 400);
              }, idx * stagger);
            });
          });
        });
      } else {
        items.forEach((item, idx) => {
          setTimeout(() => {
            this.play(item, 'enter', animationCfg);
          }, idx * stagger);
        });
      }
    }
  };

  // ═══════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════
  function resolveConfig(el, state, defaults) {
    let cfg = { ...defaults };
    const attr = el.getAttribute?.('raa-animation:config');
    if (attr) {
      try { Object.assign(cfg, JSON.parse(attr)); } catch (_) {}
    }
    if (state) {
      const src = state.$anim || state.anim;
      if (src && typeof src === 'object' && !Array.isArray(src)) {
        Object.assign(cfg, src);
      }
    }
    return cfg;
  }

  const PRESETS = {
    'fade-up': [{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'translateY(0)' }],
    'fade-down': [{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'translateY(0)' }],
    'fade-left': [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'translateX(0)' }],
    'fade-right': [{ opacity: 0, transform: 'translateX(30px)' }, { opacity: 1, transform: 'translateX(0)' }],
    'fade-in': [{ opacity: 0 }, { opacity: 1 }],
    'scale-in': [{ opacity: 0, transform: 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)' }],
    'zoom-in': [{ opacity: 0, transform: 'scale(0.5)' }, { opacity: 1, transform: 'scale(1)' }],
    'flip-up': [{ opacity: 0, transform: 'perspective(400px) rotateX(90deg)' }, { opacity: 1, transform: 'perspective(400px) rotateX(0deg)' }]
  };

  function parseAnim(value, fallbackKeyframes) {
    if (!value || !value.trim()) return { keyframes: fallbackKeyframes };
    const raw = value.trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { keyframes: parsed };
      if (parsed && typeof parsed === 'object' && parsed.keyframes) return parsed;
    } catch (_) {}
    const kf = PRESETS[raw];
    if (kf) return { keyframes: kf };
    console.warn(`[RaaAnimation] Preset "${raw}" tidak dikenal, pakai fallback.`);
    return { keyframes: fallbackKeyframes };
  }

  // ═══════════════════════════════════════
  //  INSTALL FUNCTION – wildcard version
  // ═══════════════════════════════════════
  function install(instance) {
    if (!Array.isArray(instance.__raa_custom_directives__)) {
      instance.__raa_custom_directives__ = [];
    }

    // Daftarkan SATU wildcard untuk semua variasi
    instance.__raa_custom_directives__.push(['raa-animation:*', function (el, name, value, state, root) {
      const directivePart = name.split(':')[1]; // 'enter', 'leave', 'scroll', 'loop', 'trigger', 'group', atau undefined

      // --- ENTER (termasuk tanpa modifier) ---
      if (directivePart === 'enter' || !directivePart) {
        const cfg = resolveConfig(el, state, window.RaaAnimation.config.enter);
        const { keyframes } = parseAnim(value, cfg.keyframes);
        cfg.keyframes = keyframes;
        const run = () => {
          if (el.__raa_anim_enter_done__) return;
          el.__raa_anim_enter_done__ = true;
          window.RaaAnimation.play(el, 'enter', cfg);
        };
        if (el.isConnected) {
          requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(run)));
        } else {
          const obs = new MutationObserver(() => {
            if (el.isConnected) {
              obs.disconnect();
              requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(run)));
            }
          });
          obs.observe(document.documentElement, { childList: true, subtree: true });
          el.__raa_anim_enter_obs__ = obs;
        }
        return;
      }

      // --- LEAVE ---
      if (directivePart === 'leave') {
        const cfg = resolveConfig(el, state, window.RaaAnimation.config.leave);
        const { keyframes } = parseAnim(value, cfg.keyframes);
        cfg.keyframes = keyframes;
        window.RaaAnimation.play(el, 'leave', cfg);
        return;
      }

      // --- SCROLL ---
      if (directivePart === 'scroll') {
        const cfg = resolveConfig(el, state, window.RaaAnimation.config.scroll);
        const { keyframes } = parseAnim(value, cfg.keyframes);
        cfg.keyframes = keyframes;
        const once = cfg.once;
        if (el.__raa_anim_scroll_obs__) el.__raa_anim_scroll_obs__.disconnect();
        const observer = new IntersectionObserver((entries, obs) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              window.RaaAnimation.play(el, 'scroll', cfg);
              if (once) {
                obs.unobserve(el);
                el.__raa_anim_scroll_obs__ = null;
              }
            }
          });
        }, { threshold: cfg.threshold });
        observer.observe(el);
        el.__raa_anim_scroll_obs__ = observer;
        requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const wh = window.innerHeight || document.documentElement.clientHeight;
          if (rect.top < wh && rect.bottom > 0) {
            window.RaaAnimation.play(el, 'scroll', cfg);
            if (once && el.__raa_anim_scroll_obs__) {
              el.__raa_anim_scroll_obs__.unobserve(el);
              el.__raa_anim_scroll_obs__ = null;
            }
          }
        });
        return;
      }

      // --- LOOP ---
      if (directivePart === 'loop') {
        const cfg = resolveConfig(el, state, window.RaaAnimation.config.loop);
        const { keyframes } = parseAnim(value, cfg.keyframes);
        cfg.keyframes = keyframes;
        cfg.iterations = cfg.iterations || Infinity;
        const animation = window.RaaAnimation.play(el, 'loop', cfg);
        if (animation && animation.finished) {
          animation.finished.then(() => {
            if (cfg.iterations !== Infinity) el.__raa_anim_loop_done__ = true;
          });
        }
        return;
      }

      // --- TRIGGER (click) ---
      if (directivePart === 'trigger') {
        const cfg = resolveConfig(el, state, window.RaaAnimation.config.trigger);
        const { keyframes } = parseAnim(value, cfg.keyframes);
        cfg.keyframes = keyframes;
        const handler = () => {
          window.RaaAnimation.play(el, 'trigger', cfg);
        };
        el.addEventListener('click', handler);
        el.__raa_anim_trigger_handler__ = handler;
        return;
      }

      // --- GROUP ---
      if (directivePart === 'group') {
        const cfg = resolveConfig(el, state, window.RaaAnimation.config.group);
        let items = [];
        if (value && value.trim()) {
          items = Array.from(el.querySelectorAll(value));
        } else {
          items = Array.from(el.children);
        }
        window.RaaAnimation.applyGroup(el, items, cfg);
        return;
      }

      console.warn(`[RaaAnimation] Unknown directive modifier: ${directivePart}`);
    }]);

    // ─── Cleanup extension ───
    const origDeepCleanup = instance.deepCleanup.bind(instance);
    instance.deepCleanup = function (el, visited = new WeakSet()) {
      if (!el || typeof el !== 'object') return;
      if (visited.has(el)) return;
      visited.add(el);
      if (el.__raa_anim_scroll_obs__) {
        el.__raa_anim_scroll_obs__.disconnect();
        el.__raa_anim_scroll_obs__ = null;
      }
      if (el.__raa_anim_enter_obs__) {
        el.__raa_anim_enter_obs__.disconnect();
        el.__raa_anim_enter_obs__ = null;
      }
      if (el.__raa_anim_trigger_handler__) {
        el.removeEventListener('click', el.__raa_anim_trigger_handler__);
        el.__raa_anim_trigger_handler__ = null;
      }
      origDeepCleanup(el, visited);
    };

    console.log('[RaaAnimation] installed (v2.2 wildcard)');
  }

  // ═══════════════════════════════════════
  //  PROTOTYPE INIT CHAINING
  // ═══════════════════════════════════════
  const originalInit = RaaJS.prototype.init;
  RaaJS.prototype.init = function () {
    if (!this.__raa_anim_installed__) {
      install(this);
      this.__raa_anim_installed__ = true;
    }
    return originalInit.call(this);
  };

  console.log('[RaaAnimation] Prototype init patched (v2.2 wildcard).');
})();