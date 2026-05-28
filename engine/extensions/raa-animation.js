/**
 * RaaJS Animation Extension | v3.1.0
 * File: raa-animation.js
 * ─────────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai sistem "Bahasa Tubuh" (Body Language) aplikasi. Ekstensi
 * ini memberikan dimensi ruang dan waktu pada elemen HTML,
 * mengubah transisi status yang kaku menjadi gerakan organik yang
 * reaktif melalui Web Animations API.
 * ─────────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-animation:enter   : Animasi saat elemen lahir/masuk ke DOM.
 * - raa-animation:leave   : Gerakan elegan saat elemen dihapus/keluar.
 * - raa-animation:scroll  : Memicu aksi saat elemen masuk ke pandangan (Viewport).
 * - raa-animation:loop    : Gerakan repetitif/siklus tanpa henti (seperti napas).
 * - raa-animation:trigger : Animasi yang meledak saat ada interaksi klik.
 * - raa-animation:group   : Orkestrasi animasi massal (stagger/parallel).
 * - raa-animation:config  : Rem kendali untuk durasi, easing, dan delay.
 * - window.RaaAnimation   : API global untuk kontrol manual & kustomisasi preset.
 * ─────────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Multi-plugin Safe, Wildcard Pattern (*), High-Performance, Declarative,
 *   Plugin-Native (v3.1.0+).
 *
 * "Gerakan adalah cara aplikasi menceritakan emosinya."
 * ─────────────────────────────────────────────────────────────
 * CHANGELOG
 * v3.0.0 (2026-05-23)
 *   [BREAKING]  Tidak lagi mematch `RaaJS.prototype` — class ada di IIFE.
 *               Seluruh instalasi kini lewat Plugin System v3.0.0.
 *   [FIX]       deepCleanup tidak lagi di-monkey-patch. Cleanup observer
 *               dan listener kini dijalankan via beforeDestroy hook yang
 *               mengiterasi seluruh subtree root.
 *   [FIX]       console.log production leak dihapus.
 *   [IMPROVE]   uninstall() meng-cleanup semua observer & listener yang
 *               tersisa saat plugin di-uninstall secara programatik.
 *
 * v2.2.0 (baseline)
 *   Original version — RaaJS.prototype.init patching approach.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ═══════════════════════════════════════════════════════
  //  GLOBAL ANIMATION API
  // ═══════════════════════════════════════════════════════
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

    /** Mainkan animasi bernama (atau preset) pada elemen */
    play(el, name, cfg) {
      if (!el || typeof el.animate !== 'function') return null;
      const merged = { ...(this.config[name] || this.config.enter), ...cfg };
      if (merged.type === 'transition') return this._playTransition(el, merged);
      return this._playKeyframe(el, merged);
    },

    _playTransition(el, cfg) {
      const style = el.style;
      for (const prop in cfg.transitions) style[prop] = cfg.transitions[prop];
      style.transition = `all ${cfg.duration}ms ${cfg.easing} ${cfg.delay || 0}ms`;
      const done = () => { style.transition = ''; el.removeEventListener('transitionend', done); };
      el.addEventListener('transitionend', done);
      return { cancel: () => done() };
    },

    _playKeyframe(el, cfg) {
      return el.animate(cfg.keyframes || this.config.enter.keyframes, {
        duration: cfg.duration,
        easing: cfg.easing,
        delay: cfg.delay || 0,
        fill: cfg.fill || 'forwards',
        iterations: cfg.iterations || 1
      });
    },

    /** Orkestrasi group animasi (stagger/parallel/sequence) */
    applyGroup(container, items, cfg) {
      const mode = cfg.mode || 'parallel';
      const stagger = cfg.stagger || 0;
      const animCfg = { ...cfg };
      delete animCfg.mode;
      delete animCfg.stagger;

      if (mode === 'sequence') {
        let promise = Promise.resolve();
        items.forEach((item, idx) => {
          promise = promise.then(() => new Promise(resolve => {
            setTimeout(() => {
              const anim = this.play(item, 'enter', animCfg);
              if (anim && anim.finished) anim.finished.then(resolve);
              else setTimeout(resolve, animCfg.duration || 400);
            }, idx * stagger);
          }));
        });
      } else {
        items.forEach((item, idx) => {
          setTimeout(() => { this.play(item, 'enter', animCfg); }, idx * stagger);
        });
      }
    }
  };

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════

  const PRESETS = {
    'fade-up':   [{ opacity: 0, transform: 'translateY(30px)' },  { opacity: 1, transform: 'translateY(0)' }],
    'fade-down': [{ opacity: 0, transform: 'translateY(-30px)' }, { opacity: 1, transform: 'translateY(0)' }],
    'fade-left': [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'translateX(0)' }],
    'fade-right':[{ opacity: 0, transform: 'translateX(30px)' },  { opacity: 1, transform: 'translateX(0)' }],
    'fade-in':   [{ opacity: 0 }, { opacity: 1 }],
    'scale-in':  [{ opacity: 0, transform: 'scale(0.8)' },  { opacity: 1, transform: 'scale(1)' }],
    'zoom-in':   [{ opacity: 0, transform: 'scale(0.5)' },  { opacity: 1, transform: 'scale(1)' }],
    'flip-up':   [
      { opacity: 0, transform: 'perspective(400px) rotateX(90deg)' },
      { opacity: 1, transform: 'perspective(400px) rotateX(0deg)' }
    ]
  };

  function resolveConfig(el, state, defaults) {
    let cfg = { ...defaults };
    const attr = el.getAttribute?.('raa-animation:config');
    if (attr) { try { Object.assign(cfg, JSON.parse(attr)); } catch (_) {} }
    if (state) {
      const src = state.$anim || state.anim;
      if (src && typeof src === 'object' && !Array.isArray(src)) Object.assign(cfg, src);
    }
    return cfg;
  }

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

  /** Lepas semua resource animasi dari satu elemen */
  function cleanupElement(el) {
    if (!el) return;
    if (el.__raa_anim_scroll_obs__) {
      el.__raa_anim_scroll_obs__.disconnect();
      el.__raa_anim_scroll_obs__ = null;
    }
    if (el.__raa_anim_enter_obs__) {
      el.__raa_anim_enter_obs__.disconnect();
      el.__raa_anim_enter_obs__ = null;
    }
    if (el.__raa_anim_trigger_handler__) {
      try { el.removeEventListener('click', el.__raa_anim_trigger_handler__); } catch (_) {}
      el.__raa_anim_trigger_handler__ = null;
    }
    el.__raa_anim_enter_done__ = false;
    el.__raa_anim_loop_done__ = false;
  }

  // ═══════════════════════════════════════════════════════
  //  PLUGIN DEFINITION (v3.0.0 Plugin System)
  // ═══════════════════════════════════════════════════════

  const RaaAnimationPlugin = {
    name: 'raa-animation',

    install(raa) {
      // ── 1. Daftarkan wildcard directive ─────────────────────────────────
      raa.__raa_custom_directives__.push([
        'raa-animation:*',
        function handleAnimationDirective(el, name, value, state, root) {
          const part = name.split(':')[1]; // 'enter', 'leave', 'scroll', 'loop', 'trigger', 'group', 'config'
          if (part === 'config') return; // Hanya penanda konfigurasi — dibaca via getAttribute

          // --- ENTER (termasuk tanpa modifier) ---
          if (part === 'enter' || !part) {
            const cfg = resolveConfig(el, state, window.RaaAnimation.config.enter);
            cfg.keyframes = parseAnim(value, cfg.keyframes).keyframes;
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
          if (part === 'leave') {
            const cfg = resolveConfig(el, state, window.RaaAnimation.config.leave);
            cfg.keyframes = parseAnim(value, cfg.keyframes).keyframes;
            window.RaaAnimation.play(el, 'leave', cfg);
            return;
          }

          // --- SCROLL ---
          if (part === 'scroll') {
            const cfg = resolveConfig(el, state, window.RaaAnimation.config.scroll);
            cfg.keyframes = parseAnim(value, cfg.keyframes).keyframes;
            if (el.__raa_anim_scroll_obs__) el.__raa_anim_scroll_obs__.disconnect();
            const observer = new IntersectionObserver((entries, obs) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  window.RaaAnimation.play(el, 'scroll', cfg);
                  if (cfg.once) {
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
                if (cfg.once && el.__raa_anim_scroll_obs__) {
                  el.__raa_anim_scroll_obs__.unobserve(el);
                  el.__raa_anim_scroll_obs__ = null;
                }
              }
            });
            return;
          }

          // --- LOOP ---
          if (part === 'loop') {
            const cfg = resolveConfig(el, state, window.RaaAnimation.config.loop);
            cfg.keyframes = parseAnim(value, cfg.keyframes).keyframes;
            cfg.iterations = cfg.iterations || Infinity;
            const animation = window.RaaAnimation.play(el, 'loop', cfg);
            if (animation?.finished && cfg.iterations !== Infinity) {
              animation.finished.then(() => { el.__raa_anim_loop_done__ = true; });
            }
            return;
          }

          // --- TRIGGER (click) ---
          if (part === 'trigger') {
            const cfg = resolveConfig(el, state, window.RaaAnimation.config.trigger);
            cfg.keyframes = parseAnim(value, cfg.keyframes).keyframes;
            if (el.__raa_anim_trigger_handler__) {
              el.removeEventListener('click', el.__raa_anim_trigger_handler__);
            }
            const handler = () => { window.RaaAnimation.play(el, 'trigger', cfg); };
            el.addEventListener('click', handler);
            el.__raa_anim_trigger_handler__ = handler;
            return;
          }

          // --- GROUP ---
          if (part === 'group') {
            const cfg = resolveConfig(el, state, window.RaaAnimation.config.group);
            const items = (value && value.trim())
              ? Array.from(el.querySelectorAll(value))
              : Array.from(el.children);
            window.RaaAnimation.applyGroup(el, items, cfg);
            return;
          }

          console.warn(`[RaaAnimation] Unknown directive modifier: "${part}"`);
        }
      ]);

      // ── 2. beforeDestroy: lepas semua observer & listener dalam root ─────
      raa.pluginManager.addHook('beforeDestroy', function(root) {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        const all = [root, ...Array.from(root.querySelectorAll('*'))];
        all.forEach(cleanupElement);
      }, 'raa-animation');
    },

    uninstall(raa) {
      // PluginManager membersihkan hooks dan directives secara otomatis.
    }
  };

  // ═══════════════════════════════════════════════════════
  //  AUTO-INSTALL
  // ═══════════════════════════════════════════════════════
  function installPlugin() {
    if (typeof window.Raa === 'undefined') {
      console.warn('[RaaAnimation] window.Raa tidak ditemukan. Muat raa-v3.0.0.js terlebih dahulu.');
      return;
    }
    window.Raa.use(RaaAnimationPlugin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPlugin);
  } else {
    installPlugin();
  }

})();
