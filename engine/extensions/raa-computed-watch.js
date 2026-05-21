/**
 * RaaJS Computed & Watch Extension | v2.2.0
 * File: raa-computed-watch.js
 * ─────────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Indra Keenam" (Sixth Sense). Ekstensi ini memberikan 
 * kemampuan kognitif pada state untuk melahirkan kesimpulan baru 
 * (computed) dan kepekaan untuk bereaksi terhadap setiap 
 * perubahan sekecil apa pun (watch) [7].
 * ─────────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - computed : Mendefinisikan state turunan yang efisien (hanya update jika perlu) [7, 8].
 * - watch    : Menjalankan aksi otomatis saat variabel tertentu berubah [7, 9].
 * - $watch() : API dinamis untuk memasang pengintai data di tengah jalan [10, 11].
 * ─────────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Reactive-derived, CSP-safe (No-eval), Lazy Evaluation, 
 *   Automatic Cleanup [7, 12].
 * 
 * "Melihat adalah awal dari pemahaman, bereaksi adalah puncak kecerdasan."
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaComputedWatch] RaaJS not found. Load raa.js first.');
    return;
  }

  // ═══════════════════════════════════════════════════
  //  GLOBAL API
  // ═══════════════════════════════════════════════════
  window.RaaComputedWatch = {
    version: '1.0.0',

    // Registry computed & watch definitions
    computedDefs: {},
    watchDefs: {},

    /**
     * Compare values safely
     */
    isEqual(a, b) {
      return Object.is(a, b);
    },

    /**
     * Safe expression evaluation
     */
    evaluate(path, state, root) {
      try {
        return window.Raa.evaluate(path, state, root);
      } catch (err) {
        console.error('[RaaComputedWatch] Failed evaluating:', path, err);
        return undefined;
      }
    }
  };

  // ═══════════════════════════════════════════════════
  //  SHORTCUTS
  // ═══════════════════════════════════════════════════
  const Raa = window.Raa;
  const CW = window.RaaComputedWatch;

  // ═══════════════════════════════════════════════════
  //  OVERRIDE Raa.define
  //  Simpan computed & watch definitions
  // ═══════════════════════════════════════════════════
  const originalDefine = Raa.define.bind(Raa);

  Raa.define = function (name, factory) {
    const raw = typeof factory === 'function'
      ? (factory() || {})
      : (factory || {});

    // Clone agar tidak mutate object asli
    const app = { ...raw };

    CW.computedDefs[name] = app.computed || {};
    CW.watchDefs[name] = app.watch || {};

    delete app.computed;
    delete app.watch;

    return originalDefine(name, () => app);
  };

  // ═══════════════════════════════════════════════════
  //  OVERRIDE compileRoot
  //  Setup computed & watch
  // ═══════════════════════════════════════════════════
  const originalCompileRoot = Raa.compileRoot.bind(Raa);

  Raa.compileRoot = function (root) {
    const state = originalCompileRoot(root);

    if (!root || !state) return state;

    const appName = root.getAttribute('raa-core:app');
    if (!appName) return state;

    // Hindari setup berulang
    if (root.__raa_computed_watch_initialized__) {
      return state;
    }

    root.__raa_computed_watch_initialized__ = true;

    const computedDefs = CW.computedDefs[appName] || {};
    const watchDefs = CW.watchDefs[appName] || {};

    // Setup computed
    CW.setupComputed(root, state, computedDefs);

    // Setup watch
    CW.setupWatch(root, state, watchDefs);

    // Dynamic watcher API
    if (!state.$watch) {
      Object.defineProperty(state, '$watch', {
        enumerable: false,
        configurable: true,
        value(path, callback) {
          return CW.createWatcher(root, state, path, callback);
        }
      });
    }

    return state;
  };

  // ═══════════════════════════════════════════════════
  //  COMPUTED SETUP
  // ═══════════════════════════════════════════════════
  CW.setupComputed = function (root, state, defs) {
    if (!defs || typeof defs !== 'object') return;

    if (!root.__raa_computed_effects__) {
      root.__raa_computed_effects__ = [];
    }

    Object.keys(defs).forEach(key => {
      const getter = defs[key];

      if (typeof getter !== 'function') {
        console.warn(`[RaaComputedWatch] Computed "${key}" must be a function.`);
        return;
      }

      let cachedValue;
      let initialized = false;

      // Define getter pada state
      try {
        Object.defineProperty(state, key, {
          enumerable: true,
          configurable: true,
          get() {
            return cachedValue;
          }
        });
      } catch (err) {
        console.error(`[RaaComputedWatch] Failed defining computed "${key}"`, err);
        return;
      }

      // Reactive effect
      const effect = Raa.createEffect(() => {
        let nextValue;

        try {
          nextValue = getter.call(state);
        } catch (err) {
          console.error(`[RaaComputedWatch] Error in computed "${key}"`, err);
          return;
        }

        if (!initialized || !CW.isEqual(nextValue, cachedValue)) {
          cachedValue = nextValue;
          initialized = true;
        }
      }, {
        root,
        element: root
      });

      root.__raa_computed_effects__.push(effect);
    });
  };

  // ═══════════════════════════════════════════════════
  //  WATCH SETUP
  // ═══════════════════════════════════════════════════
  CW.setupWatch = function (root, state, defs) {
    if (!defs || typeof defs !== 'object') return;

    if (!root.__raa_watch_effects__) {
      root.__raa_watch_effects__ = [];
    }

    Object.entries(defs).forEach(([path, callback]) => {
      if (typeof callback !== 'function') {
        console.warn(`[RaaComputedWatch] Watch "${path}" must be a function.`);
        return;
      }

      const effect = CW.createWatcher(root, state, path, callback);

      if (effect) {
        root.__raa_watch_effects__.push(effect);
      }
    });
  };

  // ═══════════════════════════════════════════════════
  //  CREATE WATCHER
  // ═══════════════════════════════════════════════════
  CW.createWatcher = function (root, state, path, callback) {
    let oldValue = CW.evaluate(path, state, root);

    const effect = Raa.createEffect(() => {
      const newValue = CW.evaluate(path, state, root);

      if (!CW.isEqual(newValue, oldValue)) {
        const previous = oldValue;
        oldValue = newValue;

        try {
          callback.call(state, newValue, previous);
        } catch (err) {
          console.error(`[RaaComputedWatch] Watch callback failed for "${path}"`, err);
        }
      }
    }, {
      root,
      element: root
    });

    return effect;
  };

  // ═══════════════════════════════════════════════════
  //  CLEANUP
  // ═══════════════════════════════════════════════════
  const originalDestroyRoot = Raa.destroyRoot.bind(Raa);

  Raa.destroyRoot = function (root) {
    // Cleanup computed effects
    if (root.__raa_computed_effects__) {
      root.__raa_computed_effects__.forEach(effect => {
        try {
          Raa.disposeEffect(effect);
        } catch (_) {}
      });

      root.__raa_computed_effects__ = null;
    }

    // Cleanup watch effects
    if (root.__raa_watch_effects__) {
      root.__raa_watch_effects__.forEach(effect => {
        try {
          Raa.disposeEffect(effect);
        } catch (_) {}
      });

      root.__raa_watch_effects__ = null;
    }

    root.__raa_computed_watch_initialized__ = false;

    return originalDestroyRoot(root);
  };

  console.log('[RaaComputedWatch] v1.0 loaded. Computed & Watch ready.');
})();