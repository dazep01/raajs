/**
 * RaaJS Event Bus Extension v1.1
 *
 * Philosophy:
 * - Scope-aware: global bus + per-root/app/island local bus
 * - Namespaced events: "domain:action" convention
 * - Minimal API: emit, on, off, once, clear
 * - Wildcard listener: "cart:*" matches "cart:updated", "cart:removed", etc.
 * - Directive adaptor: raa-on:event:* (thin wrapper)
 * - Auto cleanup when root destroyed
 *
 * Lifecycle contract:
 * - Manual listeners (emit/on/off/once) are static until explicitly removed or cleared.
 * - Directive listeners are static subscriptions tied to the DOM/root lifecycle.
 * - Handler execution is reactive to the latest state at emit-time, without re-subscribing.
 *
 * CSP-safe, no eval.
 */
(function () {
  if (typeof window === 'undefined') return;

  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaEventBus] RaaJS not found. Load raa.js first.');
    return;
  }

  const Raa = window.Raa;

  // ═══════════════════════════════════════════════════
  //  INTERNAL REGISTRIES
  // ═══════════════════════════════════════════════════
  const localBusMap = new WeakMap();      // root -> EventBus
  const elementListenerMap = new WeakMap(); // element -> Map(eventName -> record)

  // ═══════════════════════════════════════════════════
  //  EVENT BUS CORE
  // ═══════════════════════════════════════════════════
  class EventBus {
    constructor(label = 'global') {
      this._label = label;
      this._listeners = new Map();           // event name/pattern -> Set<listener>
      this._namespaceRegexCache = new Map(); // wildcard pattern cache
    }

    /**
     * Emit event
     * @param {string} name - e.g. "cart:updated"
     * @param {*} payload - plain object sederhana
     */
    emit(name, payload) {
      if (!name) return;

      // Exact match listeners
      this._dispatch(name, payload, name);

      // Wildcard listeners (e.g. "cart:*")
      for (const [pattern] of this._listeners) {
        if (!pattern.includes('*')) continue;
        if (!this._matchWildcard(pattern, name)) continue;
        this._dispatch(pattern, payload, name);
      }
    }

    /**
     * Listen event (exact or wildcard)
     * @param {string} name - "cart:updated" or "cart:*"
     * @param {function} handler
     * @param {object} options - { once, scope, owner, source }
     * @returns {object} { cancel() }
     */
    on(name, handler, options = {}) {
      if (!name || typeof handler !== 'function') {
        return { cancel: () => {} };
      }

      const listener = {
        handler,
        once: !!options.once,
        active: true,
        scope: options.scope || null,
        owner: options.owner || null,
        source: options.source || 'manual'
      };

      if (!this._listeners.has(name)) {
        this._listeners.set(name, new Set());
      }

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

    /**
     * Hapus listener
     * @param {string} name
     * @param {function} handler - jika tidak disertakan, hapus semua untuk name itu
     */
    off(name, handler) {
      if (!name) return;

      if (!handler) {
        this._listeners.delete(name);
        return;
      }

      const set = this._listeners.get(name);
      if (!set) return;

      for (const listener of set) {
        if (listener.handler === handler) {
          listener.active = false;
          set.delete(listener);
        }
      }

      if (set.size === 0) {
        this._listeners.delete(name);
      }
    }

    /**
     * Listen sekali
     */
    once(name, handler, options = {}) {
      return this.on(name, handler, { ...options, once: true });
    }

    /**
     * Hapus semua listener, atau hanya yang terkait scope tertentu
     * @param {object} scope - optional, misal root element
     */
    clear(scope) {
      if (!scope) {
        this._listeners.clear();
        return;
      }

      for (const [name, set] of this._listeners) {
        for (const listener of Array.from(set)) {
          if (listener.scope === scope) {
            listener.active = false;
            set.delete(listener);
          }
        }

        if (set.size === 0) {
          this._listeners.delete(name);
        }
      }
    }

    // ─── PRIVATE ─────────────────────────────────

    _dispatch(key, payload, emittedName = key) {
      const listeners = this._listeners.get(key);
      if (!listeners || listeners.size === 0) return;

      for (const listener of Array.from(listeners)) {
        if (!listener.active) {
          listeners.delete(listener);
          continue;
        }

        try {
          listener.handler(payload, emittedName);
        } catch (e) {
          console.error(`[RaaEventBus] Error in listener for "${emittedName}":`, e);
        }

        if (listener.once) {
          listener.active = false;
          listeners.delete(listener);
        }
      }

      if (listeners.size === 0) {
        this._listeners.delete(key);
      }
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

  // ═══════════════════════════════════════════════════
  //  GLOBAL BUS & LOCAL BUS FACTORY
  // ═══════════════════════════════════════════════════
  const globalBus = new EventBus('global');

  function isElementLike(root) {
    return !!root && typeof root === 'object' && (
      root.nodeType === 1 || root.nodeType === 9 || root.nodeType === 11
    );
  }

  function collectElements(root) {
    const nodes = [];
    if (!root) return nodes;

    if (root.nodeType === 1 || root.nodeType === 9 || root.nodeType === 11) {
      nodes.push(root);
    }

    if (typeof root.querySelectorAll === 'function') {
      nodes.push(...root.querySelectorAll('*'));
    }

    return nodes.filter(Boolean);
  }

  function getElementRegistry(el) {
    let registry = elementListenerMap.get(el);
    if (!registry) {
      registry = new Map();
      elementListenerMap.set(el, registry);
    }
    return registry;
  }

  function getDirectiveAttributes(el) {
    if (!el || !el.attributes) return [];

    return Array.from(el.attributes).filter((attr) => {
      return attr.name && attr.name.startsWith('raa-on:event:');
    });
  }

  function resolveBus(root, scopeMode) {
    if (scopeMode === 'global') return globalBus;
    return RaaEvents.local(root);
  }

  function cleanupElementListeners(root) {
    const elements = collectElements(root);

    for (const el of elements) {
      const registry = elementListenerMap.get(el);
      if (!registry) continue;

      for (const record of registry.values()) {
        if (record && typeof record.unsubscribe === 'function') {
          try {
            record.unsubscribe();
          } catch (_) {}
        }
      }

      registry.clear();
      elementListenerMap.delete(el);
    }
  }

  window.RaaEvents = {
    // Global bus methods
    emit: globalBus.emit.bind(globalBus),
    on: globalBus.on.bind(globalBus),
    off: globalBus.off.bind(globalBus),
    once: globalBus.once.bind(globalBus),
    clear: globalBus.clear.bind(globalBus),

    /**
     * Dapatkan bus lokal untuk root/app/island tertentu
     * @param {Element} root
     * @returns {EventBus}
     */
    local(root) {
      if (!isElementLike(root)) {
        console.warn('[RaaEventBus] Invalid root, returning global bus as fallback');
        return globalBus;
      }

      let bus = localBusMap.get(root);
      if (!bus) {
        bus = new EventBus('local');
        localBusMap.set(root, bus);
      }
      return bus;
    },

    /**
     * Pasang directive listeners di subtree.
     * Listener directive bersifat statis sebagai subscription,
     * tetapi ekspresi handler dievaluasi terhadap state terbaru saat event emit.
     */
    attach(root, state) {
      if (!root) return;

      const elements = collectElements(root);

      for (const el of elements) {
        const attrs = getDirectiveAttributes(el);
        if (attrs.length === 0) continue;

        const registry = getElementRegistry(el);

        for (const attr of attrs) {
          const eventName = attr.name.slice('raa-on:event:'.length).trim();
          if (!eventName) continue;

          const expr = attr.value || '';
          if (!expr) continue;

          const scopeAttrRaw = el.getAttribute ? el.getAttribute('raa-event-scope') : null;
          const scopeMode = String(scopeAttrRaw || 'local').toLowerCase() === 'global' ? 'global' : 'local';
          const bus = resolveBus(root, scopeMode);

          // Satu event name per elemen: kalau setup ulang, listener lama diganti.
          const existing = registry.get(eventName);
          if (existing && existing.expr === expr && existing.scopeMode === scopeMode) {
            continue;
          }

          if (existing && typeof existing.unsubscribe === 'function') {
            try {
              existing.unsubscribe();
            } catch (_) {}
          }

          const handler = (payload, emittedName) => {
            try {
              Raa.evaluate(expr, state, el, {
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

          const sub = bus.on(eventName, handler, {
            scope: root,
            owner: el,
            source: 'directive'
          });

          registry.set(eventName, {
            expr,
            scopeMode,
            bus,
            unsubscribe: sub.cancel
          });
        }
      }
    },

    /**
     * Detach semua listener yang terikat ke root ini.
     */
    detach(root) {
      if (!root) return;

      // Cleanup semua subscription directive pada elemen di subtree
      cleanupElementListeners(root);

      // Cleanup local bus milik root ini
      const localBus = localBusMap.get(root);
      if (localBus) {
        localBus.clear();
        localBusMap.delete(root);
      }

      // Cleanup scope-root pada bus global
      globalBus.clear(root);
    }
  };

  // ═══════════════════════════════════════════════════
  //  INTEGRATION WITH RaaJS
  // ═══════════════════════════════════════════════════
  if (typeof Raa.compileSubtree === 'function') {
    const originalCompileSubtree = Raa.compileSubtree.bind(Raa);

    Raa.compileSubtree = function (root, state) {
      const result = originalCompileSubtree(root, state);
      window.RaaEvents.attach(root, state);
      return result;
    };
  } else {
    console.warn('[RaaEventBus] Raa.compileSubtree not found. Directive auto-attach is disabled.');
  }

  if (typeof Raa.destroyRoot === 'function') {
    const originalDestroyRoot = Raa.destroyRoot.bind(Raa);

    Raa.destroyRoot = function (root) {
      // Cleanup dulu sebelum DOM hilang.
      window.RaaEvents.detach(root);
      return originalDestroyRoot(root);
    };
  } else {
    console.warn('[RaaEventBus] Raa.destroyRoot not found. Auto cleanup is disabled.');
  }

  console.log('[RaaEventBus] v1.1 loaded. Global & local buses ready. Directive: raa-on:event:*');
})();