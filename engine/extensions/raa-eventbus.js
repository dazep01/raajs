/**
 * RaaJS Event Bus Extension | v3.1.0
 * File: raa-eventbus.js
 * ─────────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Radio Komunitas" (Community Radio). Ekstensi ini adalah
 * infrastruktur komunikasi antar-komponen yang cerdas, memungkinkan
 * pertukaran pesan tanpa perlu keterikatan fisik (decoupled) melalui
 * sistem siaran lokal maupun global.
 * ─────────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - raa-on:event:*   : Direktif untuk mendengarkan siaran pesan di HTML.
 * - $bus             : Akses instan ke jalur komunikasi di dalam expression.
 * - RaaEvents.emit   : Mengirimkan pesan (siaran) ke seluruh pendengar.
 * - RaaEvents.on     : Mendaftarkan pendengar untuk pesan tertentu (exact/wildcard).
 * - RaaEvents.local  : Membuat frekuensi khusus untuk satu Root/Island tertentu.
 * ─────────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Scope-aware, Namespaced (domain:action), Wildcard Support (*),
 *   Auto-cleanup Lifecycle, Plugin-Native (v3.1.0+).
 *
 * "Komunikasi yang jernih adalah fondasi dari ekosistem yang harmonis."
 * ─────────────────────────────────────────────────────────────
 * CHANGELOG
 * v3.1.0 (2026-05-23)
 *   [BREAKING]  Monkey-patch pada Raa.compileSubtree (tidak ada di v3.1.0)
 *               dan Raa.destroyRoot diganti dengan Plugin System v3.1.0.
 *   [FIX]       Direktif raa-on:event:* kini terdaftar sebagai custom directive
 *               sehingga tidak memicu warning "unknown directive" di core.
 *   [FIX]       Auto-attach via afterCompile hook. Auto-detach via beforeDestroy hook.
 *   [FIX]       console.log production leak dihapus.
 *
 * v2.2.0 (baseline)
 *   Original version — monkey-patching compileSubtree & destroyRoot.
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ═══════════════════════════════════════════════════════
  //  INTERNAL REGISTRIES
  // ═══════════════════════════════════════════════════════
  const localBusMap = new WeakMap();        // root → EventBus
  const elementListenerMap = new WeakMap(); // element → Map(eventName → record)

  // ═══════════════════════════════════════════════════════
  //  EVENT BUS CORE
  // ═══════════════════════════════════════════════════════
  class EventBus {
    constructor(label = 'global') {
      this._label = label;
      this._listeners = new Map();
      this._namespaceRegexCache = new Map();
    }

    /**
     * Kirim event ke semua listener yang cocok (exact & wildcard).
     * @param {string} name   - e.g. "cart:updated"
     * @param {*}      payload
     */
    emit(name, payload) {
      if (!name) return;
      this._dispatch(name, payload, name);
      for (const [pattern] of this._listeners) {
        if (!pattern.includes('*')) continue;
        if (!this._matchWildcard(pattern, name)) continue;
        this._dispatch(pattern, payload, name);
      }
    }

    /**
     * Daftarkan listener (exact atau wildcard).
     * @param {string}   name    - "cart:updated" atau "cart:*"
     * @param {function} handler
     * @param {object}   options - { once, scope, owner, source }
     * @returns {{ cancel() }}
     */
    on(name, handler, options = {}) {
      if (!name || typeof handler !== 'function') return { cancel: () => {} };
      const listener = {
        handler,
        once: !!options.once,
        active: true,
        scope: options.scope || null,
        owner: options.owner || null,
        source: options.source || 'manual'
      };
      if (!this._listeners.has(name)) this._listeners.set(name, new Set());
      this._listeners.get(name).add(listener);
      return {
        cancel: () => {
          listener.active = false;
          const set = this._listeners.get(name);
          if (!set) return;
          set.delete(listener);
          if (set.size === 0) this._listeners.delete(name);
        }
      };
    }

    /** Hapus listener. Tanpa `handler` → hapus semua untuk nama itu. */
    off(name, handler) {
      if (!name) return;
      if (!handler) { this._listeners.delete(name); return; }
      const set = this._listeners.get(name);
      if (!set) return;
      for (const listener of set) {
        if (listener.handler === handler) { listener.active = false; set.delete(listener); }
      }
      if (set.size === 0) this._listeners.delete(name);
    }

    /** Daftarkan listener sekali pakai. */
    once(name, handler, options = {}) {
      return this.on(name, handler, { ...options, once: true });
    }

    /**
     * Hapus semua listener, atau hanya yang terkait scope tertentu.
     * @param {object} scope - optional (e.g. root element)
     */
    clear(scope) {
      if (!scope) { this._listeners.clear(); return; }
      for (const [name, set] of this._listeners) {
        for (const listener of Array.from(set)) {
          if (listener.scope === scope) { listener.active = false; set.delete(listener); }
        }
        if (set.size === 0) this._listeners.delete(name);
      }
    }

    // ── Private ─────────────────────────────────────────

    _dispatch(key, payload, emittedName = key) {
      const listeners = this._listeners.get(key);
      if (!listeners || listeners.size === 0) return;
      for (const listener of Array.from(listeners)) {
        if (!listener.active) { listeners.delete(listener); continue; }
        try { listener.handler(payload, emittedName); }
        catch (e) { console.error(`[RaaEventBus] Error in listener for "${emittedName}":`, e); }
        if (listener.once) { listener.active = false; listeners.delete(listener); }
      }
      if (listeners.size === 0) this._listeners.delete(key);
    }

    _escapeRegex(str) {
      return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    _matchWildcard(pattern, name) {
      if (!this._namespaceRegexCache.has(pattern)) {
        const regexStr = '^' + this._escapeRegex(pattern).replace(/\\\*/g, '.*') + '$';
        this._namespaceRegexCache.set(pattern, new RegExp(regexStr));
      }
      return this._namespaceRegexCache.get(pattern).test(name);
    }
  }

  // ═══════════════════════════════════════════════════════
  //  GLOBAL BUS & LOCAL BUS FACTORY
  // ═══════════════════════════════════════════════════════
  const globalBus = new EventBus('global');

  function isElementLike(root) {
    return !!root && typeof root === 'object' &&
      (root.nodeType === 1 || root.nodeType === 9 || root.nodeType === 11);
  }

  function collectElements(root) {
    const nodes = [];
    if (!root) return nodes;
    if (root.nodeType === 1) nodes.push(root);
    if (typeof root.querySelectorAll === 'function') nodes.push(...root.querySelectorAll('*'));
    return nodes.filter(Boolean);
  }

  function getElementRegistry(el) {
    let registry = elementListenerMap.get(el);
    if (!registry) { registry = new Map(); elementListenerMap.set(el, registry); }
    return registry;
  }

  function cleanupElementListeners(root) {
    collectElements(root).forEach(el => {
      const registry = elementListenerMap.get(el);
      if (!registry) return;
      for (const record of registry.values()) {
        if (record && typeof record.unsubscribe === 'function') {
          try { record.unsubscribe(); } catch (_) {}
        }
      }
      registry.clear();
      elementListenerMap.delete(el);
    });
  }

  // ═══════════════════════════════════════════════════════
  //  GLOBAL API: window.RaaEvents
  // ═══════════════════════════════════════════════════════
  window.RaaEvents = {
    emit:  globalBus.emit.bind(globalBus),
    on:    globalBus.on.bind(globalBus),
    off:   globalBus.off.bind(globalBus),
    once:  globalBus.once.bind(globalBus),
    clear: globalBus.clear.bind(globalBus),

    /** Dapatkan (atau buat) bus lokal untuk sebuah root element. */
    local(root) {
      if (!isElementLike(root)) {
        console.warn('[RaaEventBus] Root tidak valid, mengembalikan global bus sebagai fallback.');
        return globalBus;
      }
      let bus = localBusMap.get(root);
      if (!bus) { bus = new EventBus('local'); localBusMap.set(root, bus); }
      return bus;
    },

    /**
     * Pasang directive listeners di seluruh subtree.
     * Handler dievaluasi terhadap state terbaru saat event di-emit.
     * @param {HTMLElement} root
     * @param {object} state
     * @param {RaaJS} raa   Instance RaaJS untuk memanggil evaluate()
     */
    attach(root, state, raa) {
      if (!root) return;
      collectElements(root).forEach(el => {
        const attrs = Array.from(el.attributes || [])
          .filter(a => a.name && a.name.startsWith('raa-on:event:'));
        if (attrs.length === 0) return;

        const registry = getElementRegistry(el);
        attrs.forEach(attr => {
          const eventName = attr.name.slice('raa-on:event:'.length).trim();
          if (!eventName) return;
          const expr = attr.value || '';
          if (!expr) return;

          const scopeMode = String(el.getAttribute?.('raa-event-scope') || 'local').toLowerCase() === 'global' ? 'global' : 'local';
          const bus = scopeMode === 'global' ? globalBus : window.RaaEvents.local(root);

          // Hindari duplikasi listener pada expression + scope yang sama
          const existing = registry.get(eventName);
          if (existing && existing.expr === expr && existing.scopeMode === scopeMode) return;
          if (existing && typeof existing.unsubscribe === 'function') {
            try { existing.unsubscribe(); } catch (_) {}
          }

          const handler = (payload, emittedName) => {
            try {
              raa.evaluate(expr, state, el, {
                $event: payload,
                $eventName: emittedName,
                $el: el,
                $state: state,
                $root: root,
                $bus: bus
              });
            } catch (e) {
              console.error(`[RaaEventBus] Error in directive "${attr.name}":`, e);
            }
          };

          const sub = bus.on(eventName, handler, { scope: root, owner: el, source: 'directive' });
          registry.set(eventName, { expr, scopeMode, bus, unsubscribe: sub.cancel });
        });
      });
    },

    /** Detach semua listener yang terikat ke root ini. */
    detach(root) {
      if (!root) return;
      cleanupElementListeners(root);
      const localBus = localBusMap.get(root);
      if (localBus) { localBus.clear(); localBusMap.delete(root); }
      globalBus.clear(root);
    }
  };

  // ═══════════════════════════════════════════════════════
  //  PLUGIN DEFINITION (v3.1.0 Plugin System)
  // ═══════════════════════════════════════════════════════
  const RaaEventBusPlugin = {
    name: 'raa-eventbus',

    install(raa) {
      // ── 1. Daftarkan custom directive raa-on:event:* ─────────────────────
      // Direktif ini bersifat deklaratif — handler-nya dipasang via attach().
      // Kita daftarkan agar core tidak memunculkan warning "unknown directive".
      raa.__raa_custom_directives__.push([
        'raa-on:event:*',
        function handleEventDirective(el, name, value, state, root) {
          // Attach event subscription saat directive diproses
          const eventName = name.slice('raa-on:event:'.length).trim();
          if (!eventName || !value) return;

          const scopeMode = String(el.getAttribute?.('raa-event-scope') || 'local').toLowerCase() === 'global' ? 'global' : 'local';
          const bus = scopeMode === 'global' ? globalBus : window.RaaEvents.local(root);
          const registry = getElementRegistry(el);
          const existing = registry.get(eventName);
          if (existing && existing.expr === value && existing.scopeMode === scopeMode) return;
          if (existing?.unsubscribe) { try { existing.unsubscribe(); } catch (_) {} }

          const handler = (payload, emittedName) => {
            try {
              raa.evaluate(value, state, el, {
                $event: payload, $eventName: emittedName,
                $el: el, $state: state, $root: root, $bus: bus
              });
            } catch (e) {
              console.error(`[RaaEventBus] Error in directive "${name}":`, e);
            }
          };
          const sub = bus.on(eventName, handler, { scope: root, owner: el, source: 'directive' });
          registry.set(eventName, { expr: value, scopeMode, bus, unsubscribe: sub.cancel });
        }
      ]);

      // ── 2. afterCompile: pastikan $bus tersedia di state ────────────────
      raa.pluginManager.addHook('afterCompile', function (root, state) {
        if (!state || state.$bus) return;
        const localBus = window.RaaEvents.local(root);
        Object.defineProperty(state, '$bus', {
          enumerable: false,
          configurable: true,
          get() { return localBus; }
        });
      }, 'raa-eventbus');

      // ── 3. beforeDestroy: lepas semua subscription pada root ─────────────
      raa.pluginManager.addHook('beforeDestroy', function (root) {
        window.RaaEvents.detach(root);
      }, 'raa-eventbus');
    },

    uninstall(raa) {}
  };

  // ═══════════════════════════════════════════════════════
  //  AUTO-INSTALL
  // ═══════════════════════════════════════════════════════
  function installPlugin() {
    if (typeof window.Raa === 'undefined') {
      console.warn('[RaaEventBus] window.Raa tidak ditemukan. Muat raa-v3.1.0.js terlebih dahulu.');
      return;
    }
    window.Raa.use(RaaEventBusPlugin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPlugin);
  } else {
    installPlugin();
  }

})();
