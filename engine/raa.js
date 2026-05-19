// ═══════════════════════════════════════════════════════════════
// RaaJS v2 — Reactive Declarative Micro-Framework
// HTML-first · Directive-driven · Island-capable · No-build
// ═══════════════════════════════════════════════════════════════

const PRIORITY = Object.freeze({
  HIGH: 0,
  NORMAL: 1,
  LOW: 2,
  IDLE: 3
});

const ARRAY_MUTATION_METHODS = new Set([
  'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'
]);

class RaaLiteralParser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }
  consume() {
    return this.tokens[this.pos++];
  }
  expect(value) {
    if (this.peek()
      ?.value !== value) throw new Error(`Expected "${value}"`);
    this.consume();
  }

  parse() {
    const value = this.parseValue();
    if (this.peek()
      ?.type !== 'EOF') throw new Error('Unexpected token after data object');
    return value;
  }

  parseValue() {
    const token = this.peek();
    if (!token) throw new Error('Unexpected end of input');

    if (token.type === 'Literal') {
      this.consume();
      return token.value;
    }

    if (token.value === '{') return this.parseObject();
    if (token.value === '[') return this.parseArray();

    throw new Error(`Unexpected token ${JSON.stringify(token)}`);
  }

  parseObject() {
    const obj = {};
    this.expect('{');

    if (this.peek()
      .value === '}') {
      this.consume();
      return obj;
    }

    while (true) {
      const keyTok = this.peek();
      let key;

      if (keyTok.type === 'Literal' && typeof keyTok.value === 'string') {
        key = keyTok.value;
        this.consume();
      } else if (keyTok.type === 'Identifier') {
        key = keyTok.name;
        this.consume();
      } else {
        throw new Error('Invalid object key');
      }

      this.expect(':');
      obj[key] = this.parseValue();

      if (this.peek()
        .value === '}') {
        this.consume();
        break;
      }

      this.expect(',');
    }

    return obj;
  }

  parseArray() {
    const arr = [];
    this.expect('[');

    if (this.peek()
      .value === ']') {
      this.consume();
      return arr;
    }

    while (true) {
      arr.push(this.parseValue());

      if (this.peek()
        .value === ']') {
        this.consume();
        break;
      }

      this.expect(',');
    }

    return arr;
  }
}

class RaaJS {
  constructor(config = {}) {
    // ─── Config ───
    this.globalStore = config.store || {};
    this.rootSelector = config.rootSelector || '[raa-core\\:app]';
    this.debug = !!config.debug;
    this._trustHTML = !!config.trustHTML;
    this._sanitizer = config.sanitizer || null;

    // ─── Dependency Tracking ───
    this._depMap = new WeakMap();
    this._activeEffect = null;
    this._effectStack = [];
    this._runningEffects = new Set();

    // ─── Scheduler ───
    this._pendingEffects = new Set();
    this._flushPending = false;

    this._flushCycleId = 0;
    this._effectRunCount = new Map();
    this._maxEffectRunsPerFlush = 50;

    // ─── Root → Effects ───
    this._rootEffects = new WeakMap();

    // ─── Caches ───
    this._directiveCache = new WeakMap();
    this._reactiveCache = new WeakMap();

    this._astCache = new Map();
    this._assignPathCache = new Map();
    this._blockedCallProps = new Set(['constructor', '__proto__', 'prototype']);

    // ─── Safe Globals ───
    this._safeGlobals = {
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      WeakMap,
      WeakSet,
      Promise,
      Intl,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
      encodeURI,
      decodeURI,
      console
    };

    this._domObserver = null;
    this.observeDocument();

    this.init();
  }

  // ══════════════════════════════════════════════════════
  //  INIT & MOUNT
  // ══════════════════════════════════════════════════════

  init() {
    const roots = Array.from(document.querySelectorAll(this.rootSelector));
    roots.forEach(root => {
      const parentRoot = root.parentElement?.closest(this.rootSelector);
      if (parentRoot && parentRoot !== root && !root.hasAttribute('raa-eco:island')) {
        return;
      }
      this.compileRoot(root);
    });
  }


  /**
   * Register an extension module.
   * The module receives the Raa instance and can hook into lifecycle.
   * @param {(raa: RaaJS) => void} plugin
   */
  use(plugin) {
    plugin(this);
  }
  
  mount(target) {
    if (!target) return;
    const root = typeof target === 'string' ? document.querySelector(target) : target;
    if (root) this.compileRoot(root);
  }

  nextTick(fn) {
    return new Promise(resolve => {
      queueMicrotask(() => {
        if (fn) fn();
        resolve();
      });
    });
  }

  observeDocument() {
    if (this._domObserver || typeof MutationObserver === 'undefined') return;

    const scanRemoved = (node) => {
      if (!node || node.nodeType !== 1) return;

      if (node.__raa_compiled__) {
        this.destroyRoot(node);
      }

      if (node.querySelectorAll) {
        node.querySelectorAll(this.rootSelector)
          .forEach(root => {
            if (root.__raa_compiled__) this.destroyRoot(root);
          });
      }
    };

    this._domObserver = new MutationObserver(records => {
      for (const record of records) {
        record.removedNodes.forEach(scanRemoved);
      }
    });

    this._domObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // ══════════════════════════════════════════════════════
  //  DEPENDENCY TRACKING
  // ══════════════════════════════════════════════════════

  track(target, key) {
    if (!this._activeEffect) return;

    let depsMap = this._depMap.get(target);
    if (!depsMap) {
      depsMap = new Map();
      this._depMap.set(target, depsMap);
    }

    let dep = depsMap.get(key);
    if (!dep) {
      dep = new Set();
      depsMap.set(key, dep);
    }

    if (!dep.has(this._activeEffect)) {
      dep.add(this._activeEffect);
      this._activeEffect.deps.add(dep);
    }
  }

  trigger(target, key) {
    const depsMap = this._depMap.get(target);
    if (!depsMap) return;

    const dep = depsMap.get(key);
    if (!dep) return;

    const effects = [...dep];
    effects.forEach(effect => {
      if (effect.active && !this._runningEffects.has(effect)) {
        this.scheduleEffect(effect);
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  EFFECT SYSTEM
  // ══════════════════════════════════════════════════════

  createEffect(fn, options = {}) {
    const effect = {
      fn,
      deps: new Set(),
      active: true,
      priority: options.priority ?? PRIORITY.NORMAL,
      root: options.root || null,
      element: options.element || null,
    };

    if (effect.root) {
      if (!this._rootEffects.has(effect.root)) {
        this._rootEffects.set(effect.root, new Set());
      }
      this._rootEffects.get(effect.root)
        .add(effect);
    }

    this.runEffect(effect);
    return effect;
  }

  runEffect(effect) {
    if (!effect.active) return;

    this.cleanupEffect(effect);

    this._effectStack.push(effect);
    this._activeEffect = effect;
    this._runningEffects.add(effect);

    try {
      return effect.fn();
    } finally {
      this._runningEffects.delete(effect);
      this._effectStack.pop();
      this._activeEffect = this._effectStack[this._effectStack.length - 1] || null;
    }
  }

  cleanupEffect(effect) {
    effect.deps.forEach(dep => dep.delete(effect));
    effect.deps.clear();
  }

  disposeEffect(effect) {
    if (!effect.active) return;
    effect.active = false;
    this.cleanupEffect(effect);

    if (effect.root && this._rootEffects.has(effect.root)) {
      this._rootEffects.get(effect.root)
        .delete(effect);
    }
  }

  disposeElementEffects(el) {
    if (!el.__raa_effects__) return;
    el.__raa_effects__.forEach(effect => this.disposeEffect(effect));
    el.__raa_effects__ = null;
  }

  deepCleanup(el, visited = new WeakSet()) {
    if (!el || typeof el !== 'object') return;
    if (visited.has(el)) return;
    visited.add(el);

    this.disposeElementEffects(el);

    if (el.__raa_handlers__) {
      Object.entries(el.__raa_handlers__)
        .forEach(([eventType, handler]) => {
          try {
            el.removeEventListener(eventType, handler);
          } catch (_) {}
        });
      el.__raa_handlers__ = null;
    }

    if (el.__raa_lazy_observer__) {
      try {
        el.__raa_lazy_observer__.disconnect();
      } catch (_) {}
      el.__raa_lazy_observer__ = null;
    }

    if (el.__raa_if_node__) {
      const node = el.__raa_if_node__;
      el.__raa_if_node__ = null;
      this.deepCleanup(node, visited);
      if (node.isConnected) node.remove();
    }

    if (el.__raa_for_blocks__) {
      const blocks = el.__raa_for_blocks__;
      el.__raa_for_blocks__ = null;

      blocks.forEach(block => {
        const nodes = block?.nodes || [];
        this.destroyForBlock(block);

        nodes.forEach(node => {
          this.deepCleanup(node, visited);
          if (node.isConnected) node.remove();
        });

        block.nodes = null;
        block.meta = null;
      });
    }

    if (el.children && el.children.length) {
      Array.from(el.children)
        .forEach(child => this.deepCleanup(child, visited));
    }
  }

  // ══════════════════════════════════════════════════════
  //  SCHEDULER
  // ══════════════════════════════════════════════════════

  scheduleEffect(effect) {
    if (!effect.active) return;

    this._pendingEffects.add(effect);

    if (!this._flushPending) {
      this._flushPending = true;
      queueMicrotask(() => this.flushEffects());
    }
  }

  flushEffects() {
    this._flushPending = false;
    this._flushCycleId++;
    this._effectRunCount.clear();

    const toRun = [...this._pendingEffects]
      .filter(effect => effect.active)
      .sort((a, b) => a.priority - b.priority);

    this._pendingEffects.clear();

    for (const effect of toRun) {
      const count = (this._effectRunCount.get(effect) || 0) + 1;
      this._effectRunCount.set(effect, count);

      if (count > this._maxEffectRunsPerFlush) {
        if (this.debug) console.warn('RaaJS: effect loop detected, skipping effect', effect);
        continue;
      }

      this.runEffect(effect);
    }

    const touchedRoots = new Set();
    toRun.forEach(effect => {
      if (effect.root) touchedRoots.add(effect.root);
    });

    touchedRoots.forEach(root => {
      if (root.__raa_state__ && root.__raa_persist_key__) {
        this.savePersistedState(root, root.__raa_state__);
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  REACTIVE SYSTEM
  // ══════════════════════════════════════════════════════

  createReactive(root, target) {
    if (!this.isReactiveCandidate(target)) return target;

    const cached = this._reactiveCache.get(target);
    if (cached) return cached;

    const self = this;

    const proxy = new Proxy(target, {
      get(obj, key, receiver) {
        if (key === '__raa_raw__') return obj;
        if (key === '$refs') return obj.$refs || (obj.$refs = {});
        if (key === '$store') return self.globalStore;

        self.track(obj, key);

        const value = Reflect.get(obj, key, receiver);

        if (Array.isArray(obj) && ARRAY_MUTATION_METHODS.has(key) && typeof value === 'function') {
          return self.createArrayMutator(obj, key, value, root);
        }

        if (key === 'length' && Array.isArray(obj)) {
          return value;
        }

        return self.isReactiveCandidate(value) ? self.createReactive(root, value) : value;
      },

      set(obj, key, value, receiver) {
        if (value && typeof value === 'object' && value.__raa_raw__ !== undefined) {
          value = value.__raa_raw__;
        }

        const old = obj[key];
        const ok = Reflect.set(obj, key, value, receiver);

        if (ok && old !== value) {
          self.trigger(obj, key);

          if (Array.isArray(obj) && key !== 'length') {
            self.trigger(obj, 'length');
          }

          self.trigger(obj, Symbol.iterate);
        }

        return ok;
      },

      deleteProperty(obj, key) {
        const had = Object.prototype.hasOwnProperty.call(obj, key);
        const ok = Reflect.deleteProperty(obj, key);

        if (had && ok) {
          self.trigger(obj, key);

          if (Array.isArray(obj)) {
            self.trigger(obj, 'length');
          }

          self.trigger(obj, Symbol.iterate);
        }

        return ok;
      }
    });

    this._reactiveCache.set(target, proxy);
    return proxy;
  }

  createArrayMutator(obj, method, originalFn, root) {
    const self = this;
    return function (...args) {
      const oldLength = obj.length;
      const result = originalFn.apply(obj, args);
      const newLength = obj.length;

      self.trigger(obj, method);

      if (oldLength !== newLength) {
        self.trigger(obj, 'length');
      }

      self.trigger(obj, Symbol.iterate);

      if (method === 'splice') {
        const start = args[0] < 0 ? Math.max(0, obj.length + args[0]) : args[0];
        const count = args[1] !== undefined ? args[1] : obj.length - start;
        for (let i = start; i < start + count && i < obj.length; i++) {
          self.trigger(obj, String(i));
        }
      } else if (method === 'sort' || method === 'reverse') {
        for (let i = 0; i < obj.length; i++) {
          self.trigger(obj, String(i));
        }
      } else if (method === 'push' || method === 'unshift') {
        for (let i = oldLength; i < newLength; i++) {
          self.trigger(obj, String(i));
        }
      }

      return result;
    };
  }

  // ══════════════════════════════════════════════════════
  //  TYPE CHECKS
  // ══════════════════════════════════════════════════════

  isElement(node) {
    return !!node && node.nodeType === 1;
  }

  isDomNode(value) {
    return typeof Node !== 'undefined' && value instanceof Node;
  }

  isReactiveCandidate(value) {
    if (!value || typeof value !== 'object') return false;
    if (this.isDomNode(value)) return false;
    if (value instanceof Date || value instanceof RegExp || value instanceof Promise) return false;
    return Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype;
  }

  // ══════════════════════════════════════════════════════
  //  COMPILE PHASE
  // ══════════════════════════════════════════════════════

  compileRoot(root) {
    if (!this.isElement(root)) return;

    if (root.__raa_compiled__) {
      this.updateDOMFallback(root, root.__raa_state__);
      return root.__raa_state__;
    }

    root.__raa_compiled__ = true;
    root.__raa_compiling__ = true;

    // ──────────────────────────────────────────────
    // Resolve raa-core:app (custom app definition)
    // ──────────────────────────────────────────────
    let appMethods = null;
    let appInit = null;
    const appName = root.getAttribute('raa-core:app');

    if (appName) {
      const appFactory = RaaJS.apps[appName];
      if (!appFactory) {
        if (this.debug) console.warn(`[RaaJS] App "${appName}" is not defined.`);
      } else {
        const app = appFactory();
        const rawState = app.state || {};
        appMethods = app.methods || {};
        appInit = app.init;
        // override the data attribute with serialized state (functions are omitted, they will be added later)
        root.setAttribute('raa-core:data', JSON.stringify(rawState));
      }
    }

    let rawData = {};
    const dataString = root.getAttribute('raa-core:data');

    try {
      rawData = this.parseDataObject(dataString);
    } catch (e) {
      console.error('RaaJS: Invalid raa-core:data', e);
      root.__raa_compiling__ = false;
      return;
    }

    const state = this.createReactive(root, rawData);
    root.__raa_state__ = state;

    if (!state.$refs) state.$refs = {};

    this.loadPersistedState(root, state);

    // Attach app methods and call init after state is ready (and after persisted load)
    if (appMethods) {
      Object.keys(appMethods).forEach(key => {
        if (typeof appMethods[key] === 'function') {
          state[key] = appMethods[key].bind(state);
        }
      });
    }
    if (appInit) {
      queueMicrotask(() => {
        appInit.call(state);
      });
    }

    this.compileSubtree(root, state);

    this.setupNetwork(root, state);
    this.setupRouter(root, state);

    root.__raa_compiling__ = false;
    return state;
  }

  compileSubtree(root, state) {
    const elements = this.getManagedElements(root);

    // Pass 1: refs, inits, events
    elements.forEach(el => {
      el.__raa_root__ = root;

      const refName = el.getAttribute?.('raa-core:ref');
      if (refName) this.registerRef(state.$refs, refName, el);

      if (!el.__raa_handlers__) el.__raa_handlers__ = {};
      this.bindEventsOnElement(el, state);

      const initExpr = el.getAttribute?.('raa-core:init');
      if (initExpr && !el.__raa_init_done__) {
        el.__raa_init_done__ = true;
        this.evaluate(initExpr, state, el);
      }
    });

    // Pass 2: binding effects
    elements.forEach(el => {
      if (!el.__raa_effects__) el.__raa_effects__ = [];
      this.compileDirectives(el, state, root);
    });
  }

  compileDirectives(el, state, root) {
    const directives = this.getDirectives(el);
    const isLazy = el.hasAttribute?.('raa-ux:lazy');
    const deferred = [];

    for (const {
        name,
        value
      }
      of directives) {
      if (
        name === 'raa-core:data' ||
        name === 'raa-core:ref' ||
        name === 'raa-core:init'
      ) continue;

      if (isLazy && this._isReactiveDirective(name)) {
        deferred.push({
          name,
          value
        });
        continue;
      }

      this.createBindingEffect(el, name, value, state, root);
    }

    if (isLazy) {
      el.classList.add('raa-loading');
      el.setAttribute('aria-busy', 'true');

      el.__raa_lazy_observer__ = new IntersectionObserver((entries, obs) => {
        if (entries.some(entry => entry.isIntersecting)) {
          obs.disconnect();
          el.__raa_lazy_observer__ = null;
          el.classList.remove('raa-loading');
          el.removeAttribute('aria-busy');

          deferred.forEach(({
            name,
            value
          }) => {
            this.createBindingEffect(el, name, value, state, root);
          });
        }
      });
      el.__raa_lazy_observer__.observe(el);
    }
  }

  _isReactiveDirective(name) {
    return (
      name.startsWith('raa-bind:') ||
      name.startsWith('raa-flow:') ||
      name === 'raa-eco:auth' ||
      name === 'raa-ux:focus' ||
      name === 'raa-ux:loading' ||
      name === 'raa-ux:disable'
    );
  }

  createBindingEffect(el, name, value, state, root) {
    if (name === 'raa-bind:text') {
      el.__raa_effects__.push(this.createEffect(() => {
        this.applyTextBinding(el, this.evaluate(value, state, el));
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-bind:html') {
      el.__raa_effects__.push(this.createEffect(() => {
        this.applyHTMLBinding(el, this.evaluate(value, state, el));
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-bind:model') {
      el.__raa_effects__.push(this.createEffect(() => {
        this.applyModelBinding(el, this.evaluate(value, state, el), state);
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-bind:class') {
      el.__raa_effects__.push(this.createEffect(() => {
        this.applyClassBinding(el, this.evaluate(value, state, el));
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-bind:style') {
      el.__raa_effects__.push(this.createEffect(() => {
        this.applyStyleBinding(el, this.evaluate(value, state, el));
      }, {
        root,
        element: el
      }));
    } else if (name.startsWith('raa-bind:')) {
      const attrName = name.slice('raa-bind:'.length);
      el.__raa_effects__.push(this.createEffect(() => {
        this.applyAttrBinding(el, attrName, this.evaluate(value, state, el));
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-flow:show') {
      el.__raa_effects__.push(this.createEffect(() => {
        this.applyShow(el, !!this.evaluate(value, state, el));
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-flow:if' && el.tagName.toLowerCase() === 'template') {
      el.__raa_effects__.push(this.createEffect(() => {
        this.processIfTemplate(el, value, state, root);
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-flow:for' && el.tagName.toLowerCase() === 'template') {
      el.__raa_effects__.push(this.createEffect(() => {
        this.processForTemplate(el, value, state, root);
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-eco:auth') {
      el.__raa_effects__.push(this.createEffect(() => {
        const allowed = !!this.evaluate(value, state, el);
        el.style.display = allowed ? '' : 'none';
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-ux:focus') {
      if (!el.__raa_focused__) {
        el.__raa_focused__ = true;
        queueMicrotask(() => {
          try {
            el.focus();
          } catch (_) {}
        });
      }
    } else if (name === 'raa-ux:loading') {
      el.__raa_effects__.push(this.createEffect(() => {
        const loading = !!this.evaluate(value, state, el);
        el.classList.toggle('raa-loading', loading);
        if (loading) el.setAttribute('aria-busy', 'true');
        else el.removeAttribute('aria-busy');
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-ux:disable') {
      el.__raa_effects__.push(this.createEffect(() => {
        el.disabled = !!this.evaluate(value, state, el);
      }, {
        root,
        element: el
      }));
    } else if (name === 'raa-ux:lazy') {
      // handled in compileDirectives
    }
  }

  destroyRoot(root) {
    if (!root || !root.__raa_compiled__) return;

    if (root.__raa_socket__) {
      try {
        root.__raa_socket__.close();
      } catch (_) {}
      root.__raa_socket__ = null;
    }

    if (root.__raa_router_handler__) {
      window.removeEventListener('hashchange', root.__raa_router_handler__);
      root.__raa_router_handler__ = null;
    }

    const rootEffects = this._rootEffects.get(root);
    if (rootEffects) {
      rootEffects.forEach(effect => this.disposeEffect(effect));
      this._rootEffects.delete(root);
    }

    this.deepCleanup(root);

    root.__raa_compiled__ = false;
    root.__raa_state__ = null;
    root.__raa_if_node__ = null;
    root.__raa_for_nodes__ = null;
  }
  
  /**
   * Daftarkan global function yang aman diakses dari expression
   * @param {string} name
   * @param {function} getter
   */
  static defineGlobal(name, getter) {
    if (!this.prototype.__safeGlobalsExtras__) {
    this.prototype.__safeGlobalsExtras__ = {};
    }
    this.prototype.__safeGlobalsExtras__[name] = getter;
  }

  // ══════════════════════════════════════════════════════
  //  SCOPE & EVALUATION
  // ══════════════════════════════════════════════════════
  parseAssignablePath(expr) {
    const input = String(expr)
      .trim();
    if (!input) return null;

    const parts = [];
    let i = 0;

    const skipWs = () => {
      while (i < input.length && /\s/.test(input[i])) i++;
    };

    const readIdent = () => {
      skipWs();
      const m = /^[A-Za-z_$][\w$]*/.exec(input.slice(i));
      if (!m) return null;
      i += m[0].length;
      return m[0];
    };

    const readBracketKey = () => {
      skipWs();
      if (input[i] !== '[') return null;
      i++;
      skipWs();

      let key;

      if (input[i] === '"' || input[i] === "'") {
        const quote = input[i++];
        let out = '';

        while (i < input.length) {
          const ch = input[i];
          if (ch === '\\' && i + 1 < input.length) {
            out += input[i + 1];
            i += 2;
            continue;
          }
          if (ch === quote) break;
          out += ch;
          i++;
        }

        if (input[i] !== quote) return null;
        i++;
        key = out;
      } else {
        const m = /^-?\d+/.exec(input.slice(i));
        if (!m) return null;
        key = Number(m[0]);
        i += m[0].length;
      }

      skipWs();
      if (input[i] !== ']') return null;
      i++;
      return key;
    };

    const first = readIdent();
    if (!first) return null;
    parts.push(first);

    while (i < input.length) {
      skipWs();

      if (input[i] === '.') {
        i++;
        const ident = readIdent();
        if (!ident) return null;
        parts.push(ident);
        continue;
      }

      const bracketKey = readBracketKey();
      if (bracketKey !== null) {
        parts.push(bracketKey);
        continue;
      }

      return null;
    }

    return parts;
  }

  assignByPath(scope, parts, value) {
    if (!parts || !parts.length) return;

    let target = scope;

    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      const nextKey = parts[i + 1];

      if (target[key] == null) {
        target[key] = typeof nextKey === 'number' ? [] : {};
      }

      target = target[key];
    }

    target[parts[parts.length - 1]] = value;
  }

  collectAncestorLocals(el) {
    const chain = [];
    let node = el;

    while (node && node.nodeType === 1) {
      if (node.__raa_locals__) chain.push(node.__raa_locals__);
      node = node.parentElement;
    }

    chain.reverse();
    return Object.assign({}, ...chain);
  }

  // ══════════════════════════════════════════════════════  
  //  AST EXPRESSION PARSER & EVALUATOR (CSP-safe)  
  // ══════════════════════════════════════════════════════  
  _tokenize(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
      const ch = expr[i];

      // whitespace
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // strings
      if (ch === "'" || ch === '"') {
        const quote = ch;
        let val = '';
        i++;

        while (i < expr.length) {
          const c = expr[i];

          if (c === '\\' && i + 1 < expr.length) {
            val += expr[i + 1];
            i += 2;
            continue;
          }

          if (c === quote) {
            i++;
            break;
          }

          val += c;
          i++;
        }

        tokens.push({
          type: 'Literal',
          value: val
        });

        continue;
      }

      // numbers
      if (/[0-9]/.test(ch)) {
        let num = '';

        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          num += expr[i++];
        }

        if (!/^\d+(\.\d+)?$/.test(num)) {
          throw new Error(`Invalid number "${num}"`);
        }

        tokens.push({
          type: 'Literal',
          value: Number(num)
        });

        continue;
      }

      // identifiers
      if (/[a-zA-Z_$]/.test(ch)) {
        let id = '';

        while (i < expr.length && /[\w$]/.test(expr[i])) {
          id += expr[i++];
        }

        if (id === 'true') {
          tokens.push({
            type: 'Literal',
            value: true
          });
        } else if (id === 'false') {
          tokens.push({
            type: 'Literal',
            value: false
          });
        } else if (id === 'null') {
          tokens.push({
            type: 'Literal',
            value: null
          });
        } else if (id === 'undefined') {
          tokens.push({
            type: 'Literal',
            value: undefined
          });
        } else {
          tokens.push({
            type: 'Identifier',
            name: id
          });
        }

        continue;
      }

      // optional chaining not supported
      if (expr.substr(i, 2) === '?.') {
        throw new Error('Optional chaining is not supported');
      }

      // 3-char operators
      const threeChar = expr.substr(i, 3);

      if (['===', '!=='].includes(threeChar)) {
        tokens.push({
          type: 'Punctuator',
          value: threeChar
        });

        i += 3;
        continue;
      }

      // 2-char operators
      const twoChar = expr.substr(i, 2);

      if ([
          '<=',
          '>=',
          '==',
          '!=',
          '&&',
          '||'
        ].includes(twoChar)) {

        tokens.push({
          type: 'Punctuator',
          value: twoChar
        });

        i += 2;
        continue;
      }

      // single-char punctuation/operators
      if ('?:!<>=+-*/%()[].,'.includes(ch)) {
        tokens.push({
          type: 'Punctuator',
          value: ch
        });

        i++;
        continue;
      }

      throw new Error(`Unexpected character "${ch}"`);
    }

    tokens.push({
      type: 'EOF'
    });

    return tokens;
  }

  _tokenizeData(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
      const ch = expr[i];

      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      if (ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === ':' || ch === ',') {
        tokens.push({
          type: 'Punctuator',
          value: ch
        });
        i++;
        continue;
      }

      if (ch === "'" || ch === '"') {
        const quote = ch;
        let val = '';
        i++;

        while (i < expr.length) {
          const c = expr[i];
          if (c === '\\' && i + 1 < expr.length) {
            val += expr[i + 1];
            i += 2;
            continue;
          }
          if (c === quote) {
            i++;
            break;
          }
          val += c;
          i++;
        }

        tokens.push({
          type: 'Literal',
          value: val
        });
        continue;
      }

      if (/[0-9]/.test(ch)) {
        let num = '';
        let dotCount = 0;

        while (i < expr.length && /[0-9.]/.test(expr[i])) {
          const current = expr[i];

          if (current === '.') {
            dotCount++;
            if (dotCount > 1) {
              throw new Error(`Invalid number "${num + current}"`);
            }
          }

          num += current;
          i++;
        }

        if (!/^\d+(\.\d+)?$/.test(num)) {
          throw new Error(`Invalid number "${num}"`);
        }

        tokens.push({
          type: 'Literal',
          value: Number(num)
        });
        continue;
      }

      if (/[a-zA-Z_$]/.test(ch)) {
        let id = '';
        while (i < expr.length && /[\w$]/.test(expr[i])) id += expr[i++];

        if (id === 'true') tokens.push({
          type: 'Literal',
          value: true
        });
        else if (id === 'false') tokens.push({
          type: 'Literal',
          value: false
        });
        else if (id === 'null') tokens.push({
          type: 'Literal',
          value: null
        });
        else if (id === 'undefined') tokens.push({
          type: 'Literal',
          value: undefined
        });
        else tokens.push({
          type: 'Identifier',
          name: id
        });

        continue;
      }

      throw new Error(`Unexpected character "${ch}"`);
    }

    tokens.push({
      type: 'EOF'
    });
    return tokens;
  }

  _parseExpression(tokens) {
    let pos = 0;

    const peek = () => tokens[pos];

    const consume = () => tokens[pos++];

    const expect = (value) => {
      if (peek()
        .value !== value) {
        throw new Error(`Expected "${value}"`);
      }

      return consume();
    };

    const parseConditional = () => {
      let node = parseLogicalOr();

      if (peek()
        .value === '?') {
        consume();

        const consequent = parseConditional();

        expect(':');

        const alternate = parseConditional();

        node = {
          type: 'ConditionalExpression',
          test: node,
          consequent,
          alternate
        };
      }

      return node;
    };

    const parseLogicalOr = () => {
      let node = parseLogicalAnd();

      while (peek()
        .value === '||') {
        consume();

        node = {
          type: 'BinaryExpression',
          operator: '||',
          left: node,
          right: parseLogicalAnd()
        };
      }

      return node;
    };

    const parseLogicalAnd = () => {
      let node = parseEquality();

      while (peek()
        .value === '&&') {
        consume();

        node = {
          type: 'BinaryExpression',
          operator: '&&',
          left: node,
          right: parseEquality()
        };
      }

      return node;
    };

    const parseEquality = () => {
      let node = parseRelational();

      while (
        peek()
        .value === '==' ||
        peek()
        .value === '!=' ||
        peek()
        .value === '===' ||
        peek()
        .value === '!=='
      ) {

        const op = consume()
          .value;

        node = {
          type: 'BinaryExpression',
          operator: op,
          left: node,
          right: parseRelational()
        };
      }

      return node;
    };

    const parseRelational = () => {
      let node = parseAdditive();

      while (
        peek()
        .value === '<' ||
        peek()
        .value === '>' ||
        peek()
        .value === '<=' ||
        peek()
        .value === '>='
      ) {

        const op = consume()
          .value;

        node = {
          type: 'BinaryExpression',
          operator: op,
          left: node,
          right: parseAdditive()
        };
      }

      return node;
    };

    const parseAdditive = () => {
      let node = parseMultiplicative();

      while (
        peek()
        .value === '+' ||
        peek()
        .value === '-'
      ) {

        const op = consume()
          .value;

        node = {
          type: 'BinaryExpression',
          operator: op,
          left: node,
          right: parseMultiplicative()
        };
      }

      return node;
    };

    const parseMultiplicative = () => {
      let node = parseUnary();

      while (
        peek()
        .value === '*' ||
        peek()
        .value === '/' ||
        peek()
        .value === '%'
      ) {

        const op = consume()
          .value;

        node = {
          type: 'BinaryExpression',
          operator: op,
          left: node,
          right: parseUnary()
        };
      }

      return node;
    };

    const parseUnary = () => {
      if (
        peek()
        .value === '!' ||
        peek()
        .value === '-'
      ) {

        const op = consume()
          .value;

        return {
          type: 'UnaryExpression',
          operator: op,
          argument: parseUnary()
        };
      }

      return parsePrimary();
    };

    const parsePrimary = () => {
      const token = peek();

      // literal
      if (token.type === 'Literal') {
        consume();

        return {
          type: 'Literal',
          value: token.value
        };
      }

      // identifier
      if (token.type === 'Identifier') {
        consume();

        let node = {
          type: 'Identifier',
          name: token.name
        };

        while (true) {

          // member access
          if (peek()
            .value === '.') {
            consume();

            const prop = consume();

            if (prop.type !== 'Identifier') {
              throw new Error('Expected property name');
            }

            node = {
              type: 'MemberExpression',
              object: node,
              property: {
                type: 'Identifier',
                name: prop.name
              },
              computed: false
            };

            continue;
          }

          // computed access
          if (peek()
            .value === '[') {
            consume();

            const property = parseConditional();

            expect(']');

            node = {
              type: 'MemberExpression',
              object: node,
              property,
              computed: true
            };

            continue;
          }

          // function call
          if (peek()
            .value === '(') {
            consume();

            const args = [];

            if (peek()
              .value !== ')') {
              args.push(parseConditional());

              while (peek()
                .value === ',') {
                consume();
                args.push(parseConditional());
              }
            }

            expect(')');

            node = {
              type: 'CallExpression',
              callee: node,
              arguments: args
            };

            continue;
          }

          break;
        }

        return node;
      }

      // grouped expression
      if (token.value === '(') {
        consume();

        const node = parseConditional();

        expect(')');

        return node;
      }

      throw new Error(`Unexpected token ${JSON.stringify(token)}`);
    };

    const ast = parseConditional();

    if (peek()
      .type !== 'EOF') {
      throw new Error('Unexpected token after expression');
    }

    return ast;
  }

  _parseAndCache(expr) {
    if (this._astCache.has(expr)) {
      return this._astCache.get(expr);
    }

    const tokens = this._tokenize(expr);

    const ast = this._parseExpression(tokens);

    this._astCache.set(expr, ast);

    return ast;
  }

  _evaluateNode(node, scope) {
    switch (node.type) {

    case 'Literal':
      return node.value;

    case 'Identifier':
      return scope[node.name];

    case 'MemberExpression': {
      const obj = this._evaluateNode(node.object, scope);

      if (obj == null) {
        return undefined;
      }

      const prop = node.computed ?
        this._evaluateNode(node.property, scope) :
        node.property.name;

      return obj[prop];
    }

    case 'CallExpression': {
      let thisArg = undefined;
      let calleeNode = node.callee;

      if (calleeNode.type === 'MemberExpression') {
        const prop = calleeNode.computed ?
          this._evaluateNode(calleeNode.property, scope) :
          calleeNode.property.name;

        if (this._blockedCallProps.has(prop)) {
          throw new Error(`Blocked function call "${prop}"`);
        }

        thisArg = this._evaluateNode(calleeNode.object, scope);
        if (thisArg == null) throw new Error('Target object is null/undefined');
      }

      const callee = this._evaluateNode(calleeNode, scope);
      if (typeof callee !== 'function') throw new Error('Target is not callable');

      const args = node.arguments.map(arg => this._evaluateNode(arg, scope));
      return thisArg !== undefined ? callee.apply(thisArg, args) : callee(...args);
    }

    case 'UnaryExpression': {
      const value = this._evaluateNode(node.argument, scope);

      switch (node.operator) {
      case '!':
        return !value;

      case '-':
        return -value;

      default:
        throw new Error(`Unknown unary operator "${node.operator}"`);
      }
    }

    case 'BinaryExpression': {

      const left = this._evaluateNode(node.left, scope);

      // short-circuit
      if (node.operator === '&&') {
        return left ?
          this._evaluateNode(node.right, scope) :
          left;
      }

      if (node.operator === '||') {
        return left ?
          left :
          this._evaluateNode(node.right, scope);
      }

      const right = this._evaluateNode(node.right, scope);

      switch (node.operator) {

      case '+':
        return left + right;

      case '-':
        return left - right;

      case '*':
        return left * right;

      case '/':
        return left / right;

      case '%':
        return left % right;

      case '==':
        return left == right;

      case '!=':
        return left != right;

      case '===':
        return left === right;

      case '!==':
        return left !== right;

      case '<':
        return left < right;

      case '>':
        return left > right;

      case '<=':
        return left <= right;

      case '>=':
        return left >= right;

      default:
        throw new Error(`Unknown operator "${node.operator}"`);
      }
    }

    case 'ConditionalExpression':
      return this._evaluateNode(node.test, scope) ?
        this._evaluateNode(node.consequent, scope) :
        this._evaluateNode(node.alternate, scope);

    default:
      throw new Error(`Unknown AST node "${node.type}"`);
    }
  }

  _evaluateExpression(expr, scope) {
    const ast = this._parseAndCache(expr);
    return this._evaluateNode(ast, scope);
  }

  buildScope(state, el, extraLocals = {}) {
    const locals = this.collectAncestorLocals(el);
    Object.assign(locals, extraLocals);

    const globals = Object.assign({}, this._safeGlobals, this.__safeGlobalsExtras__ || {});
    const store = this.globalStore;

    return new Proxy(Object.create(null), {
      has: (_, key) => {
        if (key === Symbol.unscopables) return false;
        if (key === '$store' || key === '$refs' || key === '$el' || key === '$state' || key === '$locals') return true;
        if (Object.prototype.hasOwnProperty.call(extraLocals, key)) return true;
        if (Object.prototype.hasOwnProperty.call(locals, key)) return true;
        if (key in state) return true;
        if (key in globals) return true;
        return false;
      },

      get: (_, key) => {
        if (key === Symbol.unscopables) return undefined;
        if (key === '$store') return store;
        if (key === '$refs') return state.$refs || {};
        if (key === '$el') return el;
        if (key === '$state') return state;
        if (key === '$locals') return locals;

        if (Object.prototype.hasOwnProperty.call(extraLocals, key)) return extraLocals[key];
        if (Object.prototype.hasOwnProperty.call(locals, key)) return locals[key];
        if (key in state) return state[key];
        if (key in globals) return globals[key];

        return undefined;
      },

      set: (_, key, value) => {
        if (Object.prototype.hasOwnProperty.call(extraLocals, key)) {
          extraLocals[key] = value;
          return true;
        }

        if (Object.prototype.hasOwnProperty.call(locals, key)) {
          locals[key] = value;
          return true;
        }

        state[key] = value;
        return true;
      },

      ownKeys: () => {
        return Array.from(new Set([
          ...Object.keys(locals),
          ...Object.keys(state),
          '$store', '$refs', '$el', '$state', '$locals'
        ]));
      },

      getOwnPropertyDescriptor: (_, key) => {
        return {
          configurable: true,
          enumerable: true,
          value: this.buildScopeValue(state, el, locals, extraLocals, key)
        };
      }
    });
  }

  buildScopeValue(state, el, locals, extraLocals, key) {
    if (key === '$store') return this.globalStore;
    if (key === '$refs') return state.$refs || {};
    if (key === '$el') return el;
    if (key === '$state') return state;
    if (key === '$locals') return locals;
    if (Object.prototype.hasOwnProperty.call(extraLocals, key)) return extraLocals[key];
    if (Object.prototype.hasOwnProperty.call(locals, key)) return locals[key];
    if (key in state) return state[key];
    if (key in this._safeGlobals) return this._safeGlobals[key];
    return undefined;
  }

  parseDataValue(input) {
    const expr = String(input || '')
      .trim();
    if (!expr) return {};
    const tokens = this._tokenizeData(expr);
    const parser = new RaaLiteralParser(tokens);
    const value = parser.parse();
    if (!this.isReactiveCandidate(value)) {
      throw new Error('raa-core:data must produce an object or array.');
    }
    return value;
  }

  evaluate(expr, state, el, extraLocals = {}) {
    if (typeof expr !== 'string' || !expr.trim()) {
      return undefined;
    }

    try {
      const scope = this.buildScope(state, el, extraLocals);

      return this._evaluateExpression(expr, scope);
    } catch (e) {
      if (this.debug) {
        console.error(`RaaJS Eval Error: "${expr}"`, e);
      }

      return undefined;
    }
  }

  assign(expr, value, state, el, extraLocals = {}) {
    if (typeof expr !== 'string' || !expr.trim()) {
      return;
    }

    try {
      let path = this._assignPathCache.get(expr);

      if (!path) {
        path = this.parseAssignablePath(expr);

        if (!path) {
          throw new Error(`Invalid assignment target "${expr}"`);
        }

        this._assignPathCache.set(expr, path);
      }

      const scope = this.buildScope(state, el, extraLocals);

      this.assignByPath(scope, path, value);
    } catch (e) {
      if (this.debug) {
        console.error(`RaaJS Assign Error: "${expr}"`, e);
      }
    }
  }

  // ══════════════════════════════════════════════════════
  //  BINDING APPLY
  // ══════════════════════════════════════════════════════

  applyTextBinding(el, value) {
    const next = value ?? '';
    if (el.textContent !== String(next)) el.textContent = String(next);
  }

  applyHTMLBinding(el, value) {
    const next = value ?? '';
    const sanitized = this.sanitizeHTML(String(next));
    if (el.innerHTML !== sanitized) el.innerHTML = sanitized;
  }

  applyModelBinding(el, value, state) {
    if (el.type === 'checkbox') {
      el.checked = !!value;
      return;
    }

    if (el.type === 'radio') {
      el.checked = el.value === String(value);
      return;
    }

    if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const next = value ?? '';
      if (el.value !== String(next)) el.value = String(next);
      return;
    }

    el.value = value ?? '';
  }

  applyClassBinding(el, value) {
    const next = (value && typeof value === 'object') ? value : {};
    const prev = el.__raa_class_prev__ || {};

    Object.keys(prev)
      .forEach(cls => {
        if (!(cls in next)) el.classList.remove(cls);
      });

    Object.keys(next)
      .forEach(cls => {
        el.classList.toggle(cls, !!next[cls]);
      });

    el.__raa_class_prev__ = {
      ...next
    };
  }

  applyStyleBinding(el, value) {
    const next = (value && typeof value === 'object') ? value : {};
    const prev = el.__raa_style_prev__ || {};

    Object.keys(prev)
      .forEach(prop => {
        if (!(prop in next)) el.style[prop] = '';
      });

    Object.keys(next)
      .forEach(prop => {
        el.style[prop] = next[prop] ?? '';
      });

    el.__raa_style_prev__ = {
      ...next
    };
  }

  applyAttrBinding(el, attrName, value) {
    if (value === false || value === null || value === undefined) {
      el.removeAttribute(attrName);
      return;
    }
    el.setAttribute(attrName, String(value));
  }

  applyShow(el, visible) {
    if (visible) {
      if (el.__raa_prev_display__ !== undefined) {
        el.style.display = el.__raa_prev_display__;
      } else {
        el.style.display = '';
      }
    } else {
      if (el.style.display !== 'none') {
        el.__raa_prev_display__ = el.style.display;
      }
      el.style.display = 'none';
    }
  }

  // ══════════════════════════════════════════════════════
  //  CONTROL FLOW
  // ══════════════════════════════════════════════════════

  processIfTemplate(el, expr, state, root) {
    const visible = !!this.evaluate(expr, state, el);

    if (visible) {
      if (!el.__raa_if_nodes__) {
        const nodes = this.cloneTemplateFragment(el);
        if (!nodes.length) return;

        el.__raa_if_nodes__ = nodes;
        this.insertFragmentNodes(el.parentNode, el, nodes);

        nodes.forEach(node => {
          if (node.nodeType === 1) {
            node.__raa_root__ = root;
            this.compileSubtree(node, state);
          }
        });
      }
    } else if (el.__raa_if_nodes__) {
      el.__raa_if_nodes__.forEach(node => this.deepCleanup(node));
      el.__raa_if_nodes__.forEach(node => node.remove());
      el.__raa_if_nodes__ = null;
    }
  }

  processForTemplate(el, expr, state, root) {
    const parts = expr.split(/\s+in\s+/);

    if (parts.length !== 2) return;

    const [itemDef, arrayExpr] = parts;

    const rawItemDef = itemDef.trim();

    const arrayData = this.evaluate(arrayExpr, state, el);

    if (!Array.isArray(arrayData)) return;

    const templateContent = el.content;

    const keyExpr = el.getAttribute('raa-key');

    const prevBlocks = el.__raa_for_blocks__ || [];

    const existingKeyMap = new Map();

    const seenKeys = new Set();

    prevBlocks.forEach(block => {
      if (block.key !== undefined) {
        existingKeyMap.set(block.key, block);
      }
    });

    const newBlocks = [];

    let anchor = el;

    const [itemVarRaw, indexVarRaw] = rawItemDef
      .split(',')
      .map(s => s.trim());

    const itemVar = itemVarRaw || 'item';

    const indexVar = indexVarRaw || '$index';

    arrayData.forEach((item, idx) => {

      const locals = this.makeLoopLocals(rawItemDef, item, idx);

      let key = idx;

      if (keyExpr) {
        key = this.evaluate(keyExpr, state, el, locals);
      }

      if (key === undefined || key === null) {
        key = idx;
      }

      if (typeof key === 'object' || typeof key === 'function') {
        if (this.debug) {
          console.warn('RaaJS: raa-key should resolve to a primitive value. Falling back to index.', key);
        }
        key = idx;
      }

      if (seenKeys.has(key)) {
        if (this.debug) {
          console.warn('RaaJS: duplicate raa-key detected inside the same raa-flow:for render pass. Falling back to a synthetic key.', {
            key,
            idx,
            item
          });
        }
        key = `${String(key)}__dup_${idx}`;
      }

      seenKeys.add(key);

      let block = existingKeyMap.get(key);

      // ─────────────────────────────
      // REUSE BLOCK
      // ─────────────────────────────

      if (block) {

        existingKeyMap.delete(key);

        block.key = key;
        block.locals = locals;

        if (block.meta) {
          const previousIndex = block.meta.index;

          block.meta.key = key;
          block.meta.index = idx;
          block.meta.lastIndex = previousIndex;

          block.meta.locals = locals;
          block.meta.nodes = block.nodes;

          block.meta.updatedAt = Date.now();
          block.meta.reuseCount += 1;

          block.meta.reused = true;
          block.meta.detached = false;
          block.meta.destroyed = false;

          block.meta.moved = previousIndex !== idx;
        }

        block.nodes.forEach(node => {
          node.__raa_locals__ = locals;

          if (block.meta) {
            node.__raa_for_meta__ = block.meta;
          }
        });

        // rerun effects for full subtree
        block.nodes.forEach(node => {
          this.rerunSubtreeEffects(node);
        });

        // reorder dom
        anchor = this.moveRenderedNodesAfterAnchor(el.parentNode, anchor, block.nodes);

        newBlocks.push(block);

        return;
      }

      // ─────────────────────────────
      // CREATE BLOCK
      // ─────────────────────────────

      const nodes =
        this.cloneTemplateFragment(templateContent);

      if (!nodes.length) return;

      nodes.forEach(node => {
        if (node.nodeType === 1) {
          node.__raa_locals__ = locals;
          node.__raa_root__ = root;
        }
      });

      anchor = this.insertFragmentNodes(
        el.parentNode,
        anchor,
        nodes
      );

      nodes.forEach(node => {
        if (node.nodeType === 1) {
          this.compileSubtree(node, state);
        }
      });

      block = {
        key,
        locals,
        nodes,
        meta: this.createForBlockMeta(key, locals, nodes, root, idx)
      };

      newBlocks.push(block);
    });

    // ─────────────────────────────
    // CLEANUP OLD BLOCKS
    // ─────────────────────────────

    existingKeyMap.forEach(block => {
      const nodes = block.nodes || [];
      this.destroyForBlock(block);
      this.removeRenderedNodes(nodes);
      block.nodes = null;
      block.meta = null;
    });

    el.__raa_for_blocks__ = newBlocks;
  }

  cloneTemplateFragment(templateContent) {
    const fragment = templateContent.cloneNode(true);
    return Array.from(fragment.childNodes);
  }

  insertFragmentNodes(parent, anchor, nodes) {
    let last = anchor;

    nodes.forEach(node => {
      parent.insertBefore(node, last.nextSibling);
      last = node;
    });

    return last;
  }

  moveRenderedNodesAfterAnchor(parent, anchor, nodes) {
    let last = anchor;

    nodes.forEach(node => {
      if (node.parentNode !== parent || node.previousSibling !== last) {
        parent.insertBefore(node, last.nextSibling);
      }

      last = node;
    });

    return last;
  }

  removeRenderedNodes(nodes) {
    nodes.forEach(node => this.deepCleanup(node));

    nodes.forEach(node => {
      if (node.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
  }

  makeLoopLocals(rawItemDef, item, idx) {
    const locals = {};
    const parts = rawItemDef.split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const itemVar = parts[0];
    const indexVar = parts[1] || '$index';

    locals[itemVar] = item;
    locals[indexVar] = idx;
    locals.$index = idx;

    return locals;
  }

  createForBlockMeta(key, locals, nodes, root, idx) {
    this._forBlockSeq = (this._forBlockSeq || 0) + 1;

    return {
      id: `forblock_${this._forBlockSeq}`,
      type: 'raa-flow:for',
      key,
      index: idx,
      locals,
      nodes,
      root,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      reuseCount: 0
    };
  }

  destroyForBlock(block) {
    if (!block) return;

    if (block.meta) {
      block.meta.destroyed = true;
      block.meta.destroyedAt = Date.now();
      block.meta.updatedAt = Date.now();
    }

    block.key = null;
    block.locals = null;
  }

  touchForBlock(block, patch = {}) {
    if (!block || !block.meta) return;

    block.meta.updatedAt = Date.now();
    block.meta.renderCount = (block.meta.renderCount || 0) + 1;

    Object.assign(block.meta, patch);
  }

  rerunSubtreeEffects(node) {
    if (!node || node.nodeType !== 1) return;

    if (node.__raa_effects__) {
      node.__raa_effects__.forEach(effect => {
        if (effect.active) {
          this.scheduleEffect(effect);
        }
      });
    }

    Array.from(node.children || [])
      .forEach(child => {
        this.rerunSubtreeEffects(child);
      });
  }

  // ══════════════════════════════════════════════════════
  //  XSS PROTECTION
  // ══════════════════════════════════════════════════════

  sanitizeHTML(html) {
    if (this._trustHTML) return html;
    if (this._sanitizer) return this._sanitizer(html);

    const template = document.createElement('template');
    template.innerHTML = String(html);

    const allowedTags = new Set([
      'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'hr', 'i', 'img',
      'li', 'ol', 'p', 'pre', 'section', 'span', 'strong', 'sub', 'sup',
      'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'small',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ]);

    const allowedAttrs = new Set([
      'class', 'id', 'title', 'alt', 'href', 'src', 'width', 'height',
      'colspan', 'rowspan', 'target', 'rel', 'role'
    ]);

    const urlAttrs = new Set(['href', 'src']);
    const blockedTags = new Set(['script', 'iframe', 'object', 'embed', 'applet', 'base', 'form', 'link', 'meta']);

    const cleanNode = (node) => {
      for (const child of Array.from(node.children)) {
        const tag = child.tagName.toLowerCase();

        if (blockedTags.has(tag) || !allowedTags.has(tag)) {
          child.remove();
          continue;
        }

        for (const attr of Array.from(child.attributes)) {
          const name = attr.name.toLowerCase();
          const value = attr.value.trim();

          if (name.startsWith('on')) {
            child.removeAttribute(attr.name);
            continue;
          }

          if (!(allowedAttrs.has(name) || name.startsWith('aria-') || name.startsWith('data-'))) {
            child.removeAttribute(attr.name);
            continue;
          }

          if (urlAttrs.has(name) && /^(javascript:|data:text\/html)/i.test(value)) {
            child.removeAttribute(attr.name);
            continue;
          }

          if (name === 'target' && value === '_blank') {
            child.setAttribute('rel', 'noopener noreferrer');
          }
        }

        cleanNode(child);
      }
    };

    cleanNode(template.content);
    return template.innerHTML;
  }

  // ══════════════════════════════════════════════════════
  //  EVENTS
  // ══════════════════════════════════════════════════════

  getDirectives(el) {
    if (this._directiveCache.has(el)) return this._directiveCache.get(el);

    const directives = [];
    if (!el.attributes) {
      this._directiveCache.set(el, directives);
      return directives;
    }

    Array.from(el.attributes)
      .forEach(attr => {
        directives.push({
          name: attr.name,
          value: attr.value
        });
      });

    this._directiveCache.set(el, directives);
    return directives;
  }

  bindEventsOnElement(el, state) {
    const directives = this.getDirectives(el);

    directives.forEach(({
      name,
      value
    }) => {
      if (name.startsWith('raa-on:')) {
        const rest = name.slice('raa-on:'.length);
        const dotIdx = rest.indexOf('.');
        const eventType = dotIdx !== -1 ? rest.substring(0, dotIdx) : rest;
        const modifiers = dotIdx !== -1 ? rest.substring(dotIdx + 1)
          .split('.') : [];
        const handlerKey = `__raa_ev_${eventType}_${modifiers.join('_')}`;

        if (!el.__raa_handlers__[handlerKey]) {
          const handler = (e) => {
            if (modifiers.includes('self') && e.target !== el) return;
            if (modifiers.includes('prevent')) e.preventDefault();
            if (modifiers.includes('stop')) e.stopPropagation();

            this.evaluate(value, state, el, {
              $event: e
            });
          };

          el.addEventListener(eventType, handler);
          el.__raa_handlers__[handlerKey] = handler;
        }
      }

      if (name === 'raa-bind:model' && !el.__raa_model_bound__) {
        const eventType =
          (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') ?
          'change' :
          'input';

        const handler = () => {
          let newValue;

          if (el.type === 'checkbox') {
            newValue = el.checked;
          } else if (el.type === 'radio') {
            if (!el.checked) return;
            newValue = el.value;
          } else {
            newValue = el.value;
          }

          this.assign(value, newValue, state, el);
        };

        el.addEventListener(eventType, handler);
        el.__raa_handlers__[`${eventType}__model`] = handler;
        el.__raa_model_bound__ = true;
      }
    });
  }

  // ══════════════════════════════════════════════════════
  //  NETWORK
  // ══════════════════════════════════════════════════════

  setupNetwork(root, state) {
    const fetchAttr = root.getAttribute('raa-net:fetch');
    if (fetchAttr) {
      const arrowIdx = fetchAttr.lastIndexOf('->');
      if (arrowIdx !== -1) {
        const urlExpr = fetchAttr.substring(0, arrowIdx)
          .trim();
        const target = fetchAttr.substring(arrowIdx + 2)
          .trim();
        const url = this.evaluate(urlExpr, state, root);

        if (url && target) {
          fetch(url)
            .then(res => res.json())
            .then(data => {
              state[target] = data;
            })
            .catch(err => {
              if (this.debug) console.error('RaaJS Fetch Error:', err);
            });
        }
      }
    }

    const syncAttr = root.getAttribute('raa-net:sync');
    if (syncAttr) {
      const arrowIdx = syncAttr.lastIndexOf('->');
      if (arrowIdx !== -1) {
        const wsUrlExpr = syncAttr.substring(0, arrowIdx)
          .trim();
        const target = syncAttr.substring(arrowIdx + 2)
          .trim();
        const wsUrl = this.evaluate(wsUrlExpr, state, root);

        if (wsUrl && target) {
          const socket = new WebSocket(wsUrl);
          root.__raa_socket__ = socket;

          socket.onmessage = (e) => {
            try {
              state[target] = JSON.parse(e.data);
            } catch (ex) {
              if (this.debug) console.error('RaaJS WS Parse Error:', ex);
            }
          };

          socket.onerror = (e) => {
            if (this.debug) console.error('RaaJS WebSocket Error:', e);
          };
        }
      }
    }
  }

  // ══════════════════════════════════════════════════════
  //  ROUTER
  // ══════════════════════════════════════════════════════

  setupRouter(root, state) {
    if (!root.hasAttribute('raa-eco:router')) return;

    const routes = {};
    root.querySelectorAll('[raa-eco\\:route]')
      .forEach(el => {
        const path = el.getAttribute('raa-eco:route');
        routes[path] = el;
        el.style.display = 'none';
      });

    const renderRoute = () => {
      const hash = window.location.hash.slice(1) || '/';
      let matched = null;

      Object.entries(routes)
        .forEach(([path, el]) => {
          const regex = new RegExp('^' + path.replace(/:[^/]+/g, '([^/]+)') + '$');
          const match = hash.match(regex);

          if (match && !matched) {
            matched = {
              el,
              params: match.slice(1)
            };
          }
        });

      Object.values(routes)
        .forEach(el => {
          el.style.display = 'none';
        });

      if (matched) {
        matched.el.style.display = '';
        state.$routeParams = matched.params;
      }
    };

    const handler = () => renderRoute();
    root.__raa_router_handler__ = handler;
    window.addEventListener('hashchange', handler);
    renderRoute();
  }

  // ══════════════════════════════════════════════════════
  //  UTILITIES
  // ══════════════════════════════════════════════════════
  parseDataObject(dataString) {
    return this.parseDataValue(dataString);
  }

  getManagedElements(root) {
    const all = [root, ...Array.from(root.querySelectorAll('*'))];
    return all.filter(el => {
      if (!this.isElement(el)) return false;

      if (el !== root) {
        const inTemplate = el.closest('template') && el.tagName.toLowerCase() !== 'template';
        if (inTemplate) return false;

        const island = el.closest('[raa-eco\\:island]');
        if (island && island !== root) return false;
      }

      return true;
    });
  }

  registerRef(refs, name, el) {
    if (!name) return;
    const current = refs[name];

    if (!current) {
      refs[name] = el;
      return;
    }

    if (Array.isArray(current)) {
      if (!current.includes(el)) current.push(el);
      return;
    }

    if (current !== el) {
      refs[name] = [current, el];
    }
  }

  safeSerialize(value) {
    const seen = new WeakSet();

    return JSON.stringify(value, (key, val) => {
      if (key === '$refs') return undefined;
      if (typeof val === 'function') return undefined;
      if (this.isDomNode(val)) return undefined;

      if (val && typeof val === 'object') {
        if (seen.has(val)) return undefined;
        seen.add(val);
      }

      return val;
    });
  }

  loadPersistedState(root, state) {
    const persistKey = root.getAttribute('raa-eco:persist');
    if (!persistKey) return;

    root.__raa_persist_key__ = persistKey;

    const stored = localStorage.getItem(persistKey);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      Object.assign(state, parsed);
    } catch (e) {
      if (this.debug) console.error('RaaJS Persist Load Error:', e);
    }
  }

  savePersistedState(root, state) {
    const persistKey = root.__raa_persist_key__;
    if (!persistKey) return;

    try {
      localStorage.setItem(persistKey, this.safeSerialize(state));
    } catch (e) {
      if (this.debug) console.error('RaaJS Persist Save Error:', e);
    }
  }

  // ══════════════════════════════════════════════════════
  //  FALLBACK (full subtree scan — for re-mount)
  // ══════════════════════════════════════════════════════
  rerunRootEffects(root) {
    const rootEffects = this._rootEffects.get(root);
    if (!rootEffects) return;

    rootEffects.forEach(effect => {
      if (effect.active) this.scheduleEffect(effect);
    });
  }

  updateDOMFallback(root, state) {
    if (!root || !state) return;
    this.rerunRootEffects(root);
  }
}

// ═══════════════════════════════════════════════════════════════
// RaaJS App Registry
// Minimal runtime app-definition system
// No-build • No-vDOM • CSP-aware
// ═══════════════════════════════════════════════════════════════

RaaJS.apps = Object.create(null);

/**
 * Register app definition
 * @example
 * RaaJS.define('todoApp', () => ({
 *   state: { count: 0 },
 *   methods: {
 *     inc() { this.count++; }
 *   },
 *   init() {
 *     console.log('ready');
 *   }
 * }));
 */
RaaJS.define = function(name, factory) {
    if (typeof name !== 'string' || !name.trim()) {
        throw new Error('[RaaJS] App name must be a non-empty string.');
    }

    if (typeof factory !== 'function') {
        throw new Error('[RaaJS] App factory must be a function.');
    }

    RaaJS.apps[name] = factory;
};

// ══════════════════════════════════════════════════════
//  AUTO-INIT
// ══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  window.Raa = new RaaJS();
});