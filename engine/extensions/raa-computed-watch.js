/**
RaaJS Computed & Watch Extension | v3.1.0
File: raa-computed-watch.js
─────────────────────────────────────────────────────────────
🧬 ANATOMI & PERAN
Sebagai "Indra Keenam" (Sixth Sense). Ekstensi ini memberikan
kemampuan kognitif pada state untuk melahirkan kesimpulan baru
(computed) dan kepekaan untuk bereaksi terhadap setiap
perubahan sekecil apa pun (watch).
─────────────────────────────────────────────────────────────
⚙️ DIREKTIF & API UTAMA
computed   : Mendefinisikan state turunan yang efisien (hanya update jika perlu).
watch      : Menjalankan aksi otomatis saat variabel tertentu berubah.
$watch()   : API dinamis untuk memasang pengintai data di tengah jalan.
─────────────────────────────────────────────────────────────
⚖️ FILOSOFI TEKNIS
Reactive-derived, CSP-safe (No-eval), Lazy Evaluation,
Automatic Cleanup, Plugin-Native (v3.0.0+).
"Melihat adalah awal dari pemahaman, bereaksi adalah puncak kecerdasan."
─────────────────────────────────────────────────────────────
CHANGELOG
v3.1.0 (2026-05-23)
[BREAKING]  Monkey-patch pada Raa.define, Raa.compileRoot, Raa.destroyRoot
          diganti dengan Plugin System v3.0.0.
[FIX]       Patch static RaaJS.define (bukan instance raa.define).
[FIX]       Typo property: root.raa_computed_effects → root.__raa_computed_effects__
[FIX]       Typo atribut: 'raa -core:app' → 'raa-core:app'
[FIX]       Computed & watch setup via afterCompile hook — aman dari race condition.
[FIX]       Cleanup via beforeDestroy hook — dispose effect via raa instance.
[FIX]       console.log production leak dihapus.
v2.2.0 (baseline)
Original version — monkey-patching approach.
─────────────────────────────────────────────────────────────
*/
(function () {
'use strict';
if (typeof window === 'undefined') return;

// ═══════════════════════════════════════════════════════
//  GLOBAL API: window.RaaComputedWatch
// ═══════════════════════════════════════════════════════
window.RaaComputedWatch = {
  version: '3.0.0',
  _computedDefs: {},
  _watchDefs: {},
  _raa: null,

  /** Bandingkan dua nilai secara NaN-safe */
  isEqual(a, b) {
    return Object.is(a, b);
  },

  /**
   * Evaluasi path/expression terhadap state.
   * Menggunakan raa instance yang tersimpan saat install.
   */
  evaluate(path, state, root) {
    try {
      return this._raa?.evaluate(path, state, root);
    } catch (err) {
      console.error('[RaaComputedWatch] Failed evaluating:', path, err);
      return undefined;
    }
  }
};
const CW = window.RaaComputedWatch;

// ═══════════════════════════════════════════════════════
//  SETUP COMPUTED
// ═══════════════════════════════════════════════════════
CW.setupComputed = function (raa, root, state, defs) {
  if (!defs || typeof defs !== 'object') return;
  if (!root.__raa_computed_effects__) root.__raa_computed_effects__ = [];

  Object.keys(defs).forEach(key => {
    const getter = defs[key];
    if (typeof getter !== 'function') {
      console.warn(`[RaaComputedWatch] Computed "${key}" harus berupa fungsi.`);
      return;
    }

    let cachedValue;
    let initialized = false;

    try {
      Object.defineProperty(state, key, {
        enumerable: true,
        configurable: true,
        get() { return cachedValue; }
      });
    } catch (err) {
      console.error(`[RaaComputedWatch] Gagal mendefinisikan computed "${key}"`, err);
      return;
    }

    const effect = raa.createEffect(() => {
      let nextValue;
      try { nextValue = getter.call(state); }
      catch (err) {
        console.error(`[RaaComputedWatch] Error di computed "${key}"`, err);
        return;
      }
      if (!initialized || !CW.isEqual(nextValue, cachedValue)) {
        cachedValue = nextValue;
        initialized = true;
      }
    }, { root, element: root });

    root.__raa_computed_effects__.push(effect);
  });
};

// ═══════════════════════════════════════════════════════
//  SETUP WATCH
// ═══════════════════════════════════════════════════════
CW.setupWatch = function (raa, root, state, defs) {
  if (!defs || typeof defs !== 'object') return;
  if (!root.__raa_watch_effects__) root.__raa_watch_effects__ = [];

  Object.entries(defs).forEach(([path, callback]) => {
    if (typeof callback !== 'function') {
      console.warn(`[RaaComputedWatch] Watch "${path}" harus berupa fungsi.`);
      return;
    }
    const effect = CW.createWatcher(raa, root, state, path, callback);
    if (effect) root.__raa_watch_effects__.push(effect);
  });
};

// ═══════════════════════════════════════════════════════
//  CREATE WATCHER
// ═══════════════════════════════════════════════════════
CW.createWatcher = function (raa, root, state, path, callback) {
  let oldValue = CW.evaluate(path, state, root);
  return raa.createEffect(() => {
    const newValue = CW.evaluate(path, state, root);
    if (!CW.isEqual(newValue, oldValue)) {
      const previous = oldValue;
      oldValue = newValue;
      try { callback.call(state, newValue, previous); }
      catch (err) {
        console.error(`[RaaComputedWatch] Watch callback gagal untuk "${path}"`, err);
      }
    }
  }, { root, element: root });
};

// ═══════════════════════════════════════════════════════
//  PATCH STATIC RaaJS.define (v3.0.0 COMPATIBLE)
// ═══════════════════════════════════════════════════════
(function patchDefine() {
  if (typeof window.RaaJS === 'undefined') return;
  if (window.RaaJS.__cw_patched__) return;

  const origDefine = window.RaaJS.define.bind(window.RaaJS);
  window.RaaJS.define = function (name, factory) {
    const raw = typeof factory === 'function' ? (factory() || {}) : (factory || {});
    const app = { ...raw };

    // Ekstrak computed & watch ke registry
    CW._computedDefs[name] = app.computed || {};
    CW._watchDefs[name] = app.watch || {};

    // Hapus dari objek app agar core tidak bingung
    delete app.computed;
    delete app.watch;

    // Panggil define asli dengan factory yang sudah bersih
    return origDefine(name, () => app);
  };
  window.RaaJS.__cw_patched__ = true;
})();

// ═══════════════════════════════════════════════════════
//  PLUGIN DEFINITION (v3.0.0 Plugin System)
// ═══════════════════════════════════════════════════════
const RaaComputedWatchPlugin = {
  name: 'raa-computed-watch',
  
  install(raa) {
    // Simpan referensi raa untuk digunakan evaluate()
    CW._raa = raa;

    // ── 1. afterCompile: setup computed & watch pada setiap root baru ────
    raa.pluginManager.addHook('afterCompile', function (root, state) {
      if (!root || !state) return;

      const appName = root.getAttribute('raa-core:app');
      if (!appName) return;

      // Hindari double-setup
      if (root.__raa_computed_watch_initialized__) return;
      root.__raa_computed_watch_initialized__ = true;

      const computedDefs = CW._computedDefs[appName] || {};
      const watchDefs = CW._watchDefs[appName] || {};

      CW.setupComputed(raa, root, state, computedDefs);
      CW.setupWatch(raa, root, state, watchDefs);

      // Inject $watch() dinamis ke state
      if (!state.$watch) {
        Object.defineProperty(state, '$watch', {
          enumerable: false,
          configurable: true,
          value(path, callback) {
            return CW.createWatcher(raa, root, state, path, callback);
          }
        }); 
      }
    }, 'raa-computed-watch');

    // ── 2. beforeDestroy: dispose semua computed & watch effects ─────────
    raa.pluginManager.addHook('beforeDestroy', function (root) {
      if (root.__raa_computed_effects__) {
        root.__raa_computed_effects__.forEach(effect => {
          try { raa.disposeEffect(effect); } catch (_) {}
        });
        root.__raa_computed_effects__ = null;
      }

      if (root.__raa_watch_effects__) {
        root.__raa_watch_effects__.forEach(effect => {
          try { raa.disposeEffect(effect); } catch (_) {}
        });
        root.__raa_watch_effects__ = null;
      }

      root.__raa_computed_watch_initialized__ = false;
    }, 'raa-computed-watch');
  },

  uninstall(raa) {
    CW._raa = null;
  }
};

// ═══════════════════════════════════════════════════════
//  AUTO-INSTALL
// ═══════════════════════════════════════════════════════
function installPlugin() {
  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaComputedWatch] window.Raa tidak ditemukan. Muat raa-v3.0.0.js terlebih dahulu.');
    return;
  }
  window.Raa.use(RaaComputedWatchPlugin);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installPlugin);
} else {
  installPlugin();
}

})();