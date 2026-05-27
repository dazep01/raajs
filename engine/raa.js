// =============================================================================
//  RaaJS v3.1.0 — Reactive Micro Frontend Framework
// =============================================================================
//
//  RaaJS is a no-build, zero-dependency, reactive micro frontend framework
//  designed for progressive enhancement of HTML documents. It provides
//  Proxy-based reactivity, a custom AST expression evaluator, template
//  directives, effect scheduling, and a plugin system — all in a single
//  self-contained IIFE that runs directly in the browser.
//
// ─────────────────────────────────────────────────────────────────────────────
//  🧬 ANATOMI & PERAN
// ─────────────────────────────────────────────────────────────────────────────
//
//  Mesin pusat (Core Engine) yang mengubah HTML pasif menjadi kanvas reaktif.
//  Secara filosofis, file ini adalah "jembatan kognitif" yang menghubungkan
//  niat pengembang (Directives) dengan realitas visual (DOM) melalui
//  Proxy-based State dan Priority Scheduler yang presisi.
//
//  "Kesederhanaan adalah kekuatan yang didisiplinkan."
//
// ─────────────────────────────────────────────────────────────────────────────
//  ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────────────
//
//  ReactiveSystem      — Proxy-based dependency tracking & change notification
//                         (Object.is for NaN-safe comparison, no Symbol.iterate)
//  EffectScheduler     — Microtask-batched effect execution with priority queue,
//                         loop detection, and root-scoped effect grouping
//  ScopeEvaluator      — AST tokenizer/parser/evaluator, scope Proxy with
//                         restricted visibility, assignByPath for two-way binding
//  BindingApplier      — DOM binding primitives (text, html, model, class, style,
//                         attr, show)
//  ControlFlow         — Template directives: raa-flow:if (conditional render)
//                         and raa-flow:for (keyed loop with diffing + debug warnings)
//  NetworkRouter       — Fetch with AbortController, WebSocket, hash-based router
//  PersistAndRefs      — localStorage persistence with safe serialization,
//                         ref registration
//  PluginManager       — Plugin registration with dependency chain, lifecycle
//                         hooks (beforeCompile, afterCompile, beforeDestroy,
//                         afterDestroy), error isolation, uninstall with
//                         custom directive cleanup, backward compat for
//                         function-style plugins (v2.2.0 extensions)
//
// ─────────────────────────────────────────────────────────────────────────────
//  ⚙️ DIREKTIF & API UTAMA
// ─────────────────────────────────────────────────────────────────────────────
//
//  raa-core:app="appName"       — Bind root to an app factory (RaaJS.define)
//  raa-core:ref="name"          — Register element in $refs
//  raa-core:init="expression"   — Evaluate once on compile
//
//  raa-bind:text="expression"   — One-way text binding
//  raa-bind:html="expression"   — One-way HTML binding (sanitized)
//  raa-bind:model="path"        — Two-way binding (input <-> state)
//  raa-bind:class="expression"  — Class map binding ({ active: true })
//  raa-bind:style="expression"  — Style map binding ({ color: 'red' })
//  raa-bind:attr="expression"   — Generic attribute binding
//
//  raa-flow:if="expression"     — Conditional template rendering
//  raa-flow:for="item in arr"   — Loop rendering with keyed diffing
//  raa-flow:show="expression"   — CSS display toggle
//
//  raa-on:event.modifiers="fn"  — Event binding (.prevent .stop .self)
//  raa-eco:auth="expression"    — Auth-gated visibility
//  raa-eco:persist="key"        — Persist state to localStorage
//  raa-eco:island               — Isolate compilation boundary
//  raa-eco:router               — Enable hash-based router
//
//  raa-net:fetch="url -> target"— Fetch JSON on mount, abort on destroy
//  raa-net:sync="wsUrl -> tgt"  — WebSocket sync on mount, close on destroy
//
//  raa-ux:lazy                  — Defer reactive directives until visible
//  raa-ux:focus                 — Auto-focus element
//  raa-ux:loading="expression"  — Toggle loading state
//  raa-ux:disable="expression"  — Toggle disabled state
//
// ─────────────────────────────────────────────────────────────────────────────
//  EXPRESSION LANGUAGE
// ─────────────────────────────────────────────────────────────────────────────
//
//  The template expression evaluator supports a deliberately limited subset
//  of JavaScript. This is by design — not a bug. The restriction ensures
//  scope safety (no access to window/document/globalThis), debuggability
//  (every evaluation failure is caught and reported with the expression
//  string), and deterministic behavior (no side-effectful expressions).
//
//  SUPPORTED:
//    Literals:        strings, numbers, true, false, null, undefined
//    Object literal:  { key: expr, 'key': expr } — for raa-bind:class/style
//    Array literal:   [expr, expr] — for raa-bind:class with arrays
//    Identifiers:     variable names resolved through scope chain
//    Member access:   a.b, a["b"], a[0]
//    Optional chain:  a?.b, a?.["b"], a?.[0], a?.fn()
//    Function calls:  fn(args...), obj.method(args...)
//    Unary:           !x, -x
//    Binary:          +, -, *, /, %, ==, !=, ===, !==, <, >, <=, >=
//    Logical:         &&, || (short-circuit)
//    Ternary:         a ? b : c (single-level; nested not recommended)
//    Safe globals:    Math, Date, JSON, Array, Object, String, Number,
//                     Boolean, RegExp, Map, Set, Intl, console, etc.
//
//  NOT SUPPORTED:
//    Nullish coalescing (??) — use ternary: x != null ? x : default
//    Template literals (backtick strings) — use string concatenation (+)
//    Destructuring, spread, comma operator
//    Assignment (=, +=, etc.) — use raa-bind:model for two-way binding
//    new, typeof, instanceof, void, delete
//    Arrow functions, async/await
//
// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
//
//  RaaJS.define(name, factory)        — Register app factory
//  RaaJS.defineGlobal(name, getter)   — Register safe global
//  new RaaJS(config?)                 — Create instance & auto-compile
//  raa.mount(target)                  — Compile a root element
//  raa.use(plugin, options?)          — Install plugin (object or function)
//  raa.nextTick(fn?)                  — Schedule after microtask
//
// ─────────────────────────────────────────────────────────────────────────────
//  ⚖️ FILOSOFI TEKNIS
// ─────────────────────────────────────────────────────────────────────────────
//
//  HTML-First, Reactive (Proxy), No-Build, CSP-Safe (AST Parser),
//  Island-Capable, Plugin-Extensible.
//
// ─────────────────────────────────────────────────────────────────────────────
//  CHANGELOG
// ─────────────────────────────────────────────────────────────────────────────
//
//  v3.1.0 (2026-05-24) — "Data Liberation"
//    [REMOVED]       raa-core:data attribute and all supporting code.
//                    (RaaLiteralParser, _tokenizeData, parseDataValue,
//                     parseDataObject). Use raa-core:init or app factory instead.
//    [DEV WARNING]   Debug-mode warning if raa-core:data is still used.
//
//  v3.0.0 (2026-05-23) — "The Perfect Union"
//
//  ═══════════════════════════════════════════════════════════════════════════
//  POST-AUDIT FIXES (applied after audit of The Perfect Union)
//  ═══════════════════════════════════════════════════════════════════════════
//
//    [FIX #1 HIGH]    applyClassBinding: array values now correctly apply class
//                     names instead of numeric indices ("0", "1").
//                     raa-bind:class="['active', flag ? 'bold' : '']" works.
//    [FIX #2 HIGH]    CallExpression: eliminated double evaluation of method
//                     object. callee is now accessed directly via thisArg[prop]
//                     instead of a second _evaluateNode(calleeNode) call.
//                     Reduces redundant reactive tracking on every method call.
//    [FIX #3 MEDIUM]  PluginManager: function-style plugins now receive a unique
//                     name (anonymous_1, anonymous_2 …) via _anonSeq counter.
//                     Previously all function plugins shared 'anonymous' and
//                     only the first one was installed.
//    [FIX #4 MEDIUM]  Parser: numeric literal keys in object expressions now
//                     supported — { 0: 'zero', 1: 'one' } no longer throws.
//    [FIX #5 MEDIUM]  RaaDiagnostics: all structured warnings now consistently
//                     routed through RaaDiagnostics.warn() with error codes:
//                     EFFECT_LOOP, EVAL_FAIL, UNKNOWN_KEY, PLUGIN_DUP,
//                     PLUGIN_NOT_FOUND, HOOK_UNKNOWN.
//    [FIX #6 LOW]     Parser: trailing comma in object literals now tolerated —
//                     { a: 1, } no longer throws "Invalid object key".
//
//  ─────────────────────────────────────────────────────────────────────────────
//  ESCAPE SEQUENCE AUDIT FIX (applied after escape bug report)
//  ─────────────────────────────────────────────────────────────────────────────
//
//    [FIX ESC-1 HIGH] Both tokenizers (_tokenize & _tokenizeData) had a
//                     non-compliant escape sequence handler:
//                       BEFORE: val += expr[i+1]  (blindly copies next char)
//                       AFTER:  val += _unescapeChar(expr[i+1])  (ECMAScript table)
//                     Effect: \n → newline, \t → tab, \r → CR, \0 → null, etc.
//                     Previously \n → literal 'n', causing:
//                       markdown: "# Halo\nTulis..."  →  "# HalonTulis..."
//    [FIX ESC-2 HIGH] compileRoot app factory path: eliminated the lossy
//                     JSON.stringify → setAttribute → _tokenizeData round-trip.
//                     Raw JS state object is now used directly via
//                     root.__raa_app_raw_state__ temp ref. The attribute is
//                     still set for DevTools inspection but no longer parsed.
//                     Effect: string values with \n \t etc. from RaaJS.define()
//                     factories are now preserved exactly as written.
//
//  ═══════════════════════════════════════════════════════════════════════════
//  MERGE: COMPLETE, ROBUST & UNIQUE
//  ═══════════════════════════════════════════════════════════════════════════
//
//  This version is a deliberate merge of v2.2.0 (raa.js), v2.3.2, and
//  v2.3.3 — taking the best of each:
//
//  FROM v2.3.3 (completeness baseline):
//    [FEATURE]      Object literals in template expressions:
//                   raa-bind:class="{ active: tab === 1, bold: isBold }"
//                   raa-bind:style="{ color: 'red', fontSize: size + 'px' }"
//    [FEATURE]      Array literals in template expressions:
//                   raa-bind:class="['active', isBold ? 'bold' : '']"
//    [FIX]          Plugin use() backward compatibility: function plugins
//                   auto-wrapped as { name: 'anonymous', install: fn }
//    [FIX]          raa-ux:lazy no-op guard in createBindingEffect
//    [FIX]          touchForBlock() restored
//
//  FROM v2.3.2 (robustness baseline):
//    [CRITICAL FIX] processIfTemplate passes el.content (DocumentFragment)
//    [CRITICAL FIX] Root selector colon escaping [raa-core\\:app]
//    [CRITICAL FIX] Optional chaining (?.) parser mismatch fixed
//    [FEATURE]      Optional chaining fully supported: a?.b, a?.[expr], a?.fn()
//    [FEATURE]      Evaluator always-warns on evaluation failure
//    [FEATURE]      Object.is() NaN-safe reactive comparison
//    [FEATURE]      PluginManager: dependency chain, lifecycle hooks,
//                   error isolation, uninstall API with directive cleanup
//    [FEATURE]      AbortController for fetch (aborted on destroyRoot)
//    [MINOR FIX]    buildScope: explicit set trap debug warning
//    [MINOR FIX]    buildScope: ownKeys includes extraLocals
//    [MINOR FIX]    console.log leak removed from buildScope
//    [MINOR FIX]    MemberExpression explicit optional:false
//
//  FROM v2.2.0 (uniqueness baseline):
//    [RESTORED]     Rich philosophical header: Anatomi & Peran
//    [RESTORED]     Debug warnings in processForTemplate for invalid raa-key:
//                   non-primitive keys and duplicate keys emit console.warn
//                   in debug mode, aiding template debugging.
//    [RESTORED]     destroyForBlock now also updates block.meta.updatedAt
//                   to timestamp the exact moment of destruction.
//    [RETAINED]     Verbose inline documentation style & section headers.
//
//  ═══════════════════════════════════════════════════════════════════════════
//  KNOWN LIMITATIONS (documented, not bugs)
//  ═══════════════════════════════════════════════════════════════════════════
//
//  [LIMIT]        Nullish coalescing (??) not supported. Use ternary.
//  [LIMIT]        Template literals not supported. Use string concatenation.
//  [LIMIT]        Nested ternary expressions work but are not recommended.
//  [LIMIT]        Assignment path (raa-bind:model) supports only dot notation
//                 and bracket with string literal or number.
//  [LIMIT]        Plugin uninstall does not reverse mutations made by
//                 plugin.install() to the RaaJS instance itself.
//
//  v2.3.3 (2026-05-23) — "Expression Completeness"
//    [FEATURE]      Object & array literals in template expressions
//    [FIX]          Plugin use() backward compatibility (function-style)
//    [FIX]          raa-ux:lazy no-op guard restored
//    [FIX]          touchForBlock() restored from v2.2.0
//
//  v2.3.2 (2026-05-23) — "The Audit Awakening"
//    [CRITICAL FIX] processIfTemplate: pass el.content not el
//    [CRITICAL FIX] Root selector colon escaping: [raa-core\\:app]
//    [CRITICAL FIX] Optional chaining parser mismatch fixed
//    [FEATURE]      Optional chaining (?.) fully supported
//    [FEATURE]      Evaluator always-warns on evaluation failure
//    [FEATURE]      Plugin error isolation + uninstall API
//    [MINOR FIX]    MemberExpression explicit optional:false
//    [MINOR FIX]    buildScope set trap debug warning
//    [MINOR FIX]    buildScope ownKeys includes extraLocals
//    [MINOR FIX]    console.log leak removed
//
//  v2.3.1 (2026-05-22)
//    [FIX] Restored parseAssignablePath and assignByPath
//    [FIX] Unified __raa_if_nodes__ (plural)
//    [FIX] Removed dead __raa_for_nodes__ from destroyRoot
//
//  v2.3.0 (2026-05-21)
//    [REFACTOR] Class-based architecture
//    [FIX] NaN false trigger: Object.is()
//    [FIX] Removed Symbol.iterate tracking
//    [FIX] Stale DOM on null array
//    [FIX] Fetch abort on destroy
//    [FIX] Race condition appInit/flushEffects
//    [FIX] Scope pollution: buildScope Proxy traps
//    [FIX] Persist delegation
//
//  v2.2.0 (baseline)
//    Original monolithic version — the philosophical foundation.
//
// ─────────────────────────────────────────────────────────────────────────────
//  LICENSE: MIT
// ─────────────────────────────────────────────────────────────────────────────

(function(global) {
  "use strict";

  // =========================================================================
  // 1. CONSTANTS & UTILITIES
  // =========================================================================

  /** Effect execution priority levels (lower number = higher priority) */
  const PRIORITY = Object.freeze({ HIGH: 0, NORMAL: 1, LOW: 2, IDLE: 3 });

  /** Array methods that mutate the array and need reactivity triggers */
  const ARRAY_MUTATION_METHODS = new Set([
    'push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'
  ]);

  /**
   * Compute Levenshtein edit distance between two strings.
   * Used for "did you mean?" suggestions on unknown app names.
   */
  function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i-1] === a[j-1]) matrix[i][j] = matrix[i-1][j-1];
        else matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Suggest the closest matching name from candidates within edit distance 3.
   * Returns null if no close match is found.
   */
  function suggestClosest(target, candidates) {
    let best = null, score = Infinity;
    for (const name of candidates) {
      const dist = levenshtein(target, name);
      if (dist < score) { score = dist; best = name; }
    }
    return score <= 3 ? best : null;
  }

  /** Centralized diagnostic output (warn/error) with structured codes */
  const RaaDiagnostics = {
    warn(code, message, meta = {}) {
      console.warn(`[RaaJS warn:${code}]`, message);
      if (meta.suggestion) console.info(`Did you mean "${meta.suggestion}" ?`);
      if (meta.element) console.info("Element:", meta.element);
    },
    error(code, message, meta = {}) {
      console.error(`[RaaJS error:${code}]`, message);
      if (meta.element) console.info("Element:", meta.element);
    }
  };

  // =========================================================================
  // 2. INTERNAL CLASSES
  // =========================================================================

  // ---------------------------------------------------------------------------
  // ReactiveSystem — Proxy-based dependency tracking & change notification
  //
  // Key design decisions:
  //   * Object.is() for NaN-safe comparison (NaN !== NaN would re-trigger)
  //   * No Symbol.iterate tracking (prevents dep map contamination from for...of)
  //   * deleteProperty triggers length for arrays
  // ---------------------------------------------------------------------------
  class ReactiveSystem {
    constructor(raa) {
      this.raa = raa;
      this._depMap = new WeakMap();
      this._reactiveCache = new WeakMap();
    }

    track(target, key, activeEffect) {
      if (!activeEffect) return;
      let depsMap = this._depMap.get(target);
      if (!depsMap) { depsMap = new Map(); this._depMap.set(target, depsMap); }
      let dep = depsMap.get(key);
      if (!dep) { dep = new Set(); depsMap.set(key, dep); }
      if (!dep.has(activeEffect)) { dep.add(activeEffect); activeEffect.deps.add(dep); }
    }

    trigger(target, key) {
      const depsMap = this._depMap.get(target);
      if (!depsMap) return;
      const dep = depsMap.get(key);
      if (!dep) return;
      const effects = [...dep];
      effects.forEach(effect => {
        if (effect.active && !this.raa._runningEffects?.has(effect)) {
          this.raa.scheduleEffect?.(effect);
        }
      });
    }

    isReactiveCandidate(value) {
      if (!value || typeof value !== 'object') return false;
      if (this.raa.isDomNode?.(value)) return false;
      if (value instanceof Date || value instanceof RegExp || value instanceof Promise) return false;
      return Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype;
    }

    createReactive(root, target) {
      if (!this.isReactiveCandidate(target)) return target;
      const cached = this._reactiveCache.get(target);
      if (cached) return cached;
      const self = this;
      const raa = this.raa;
      const proxy = new Proxy(target, {
        get(obj, key, receiver) {
          if (key === '__raa_raw__') return obj;
          if (key === '$refs') return obj.$refs || (obj.$refs = {});
          if (key === '$store') return raa.globalStore;
          self.track(obj, key, raa._activeEffect);
          const value = Reflect.get(obj, key, receiver);
          if (Array.isArray(obj) && ARRAY_MUTATION_METHODS.has(key) && typeof value === 'function') {
            return self.createArrayMutator(obj, key, value, root, raa);
          }
          if (key === 'length' && Array.isArray(obj)) return value;
          return self.isReactiveCandidate(value) ? self.createReactive(root, value) : value;
        },
        set(obj, key, value, receiver) {
          if (value && typeof value === 'object' && value.__raa_raw__ !== undefined) value = value.__raa_raw__;
          const old = obj[key];
          const ok = Reflect.set(obj, key, value, receiver);
          // Object.is() ensures NaN->NaN does not re-trigger effects
          if (ok && !Object.is(old, value)) {
            self.trigger(obj, key);
            if (Array.isArray(obj) && key !== 'length') self.trigger(obj, 'length');
          }
          return ok;
        },
        deleteProperty(obj, key) {
          const had = Object.prototype.hasOwnProperty.call(obj, key);
          const ok = Reflect.deleteProperty(obj, key);
          if (had && ok) {
            self.trigger(obj, key);
            if (Array.isArray(obj)) self.trigger(obj, 'length');
          }
          return ok;
        }
      });
      this._reactiveCache.set(target, proxy);
      return proxy;
    }

    createArrayMutator(obj, method, originalFn, root, raa) {
      const self = this;
      return function(...args) {
        const oldLength = obj.length;
        const result = originalFn.apply(obj, args);
        const newLength = obj.length;
        self.trigger(obj, method);
        if (oldLength !== newLength) self.trigger(obj, 'length');
        if (method === 'splice') {
          const start = args[0] < 0 ? Math.max(0, obj.length + args[0]) : args[0];
          const count = args[1] !== undefined ? args[1] : obj.length - start;
          for (let i = start; i < start + count && i < obj.length; i++) self.trigger(obj, String(i));
        } else if (method === 'sort' || method === 'reverse') {
          for (let i = 0; i < obj.length; i++) self.trigger(obj, String(i));
        } else if (method === 'push' || method === 'unshift') {
          for (let i = oldLength; i < newLength; i++) self.trigger(obj, String(i));
        }
        return result;
      };
    }
  }

  // ---------------------------------------------------------------------------
  // EffectScheduler — Microtask-batched effect execution with loop detection
  //
  // Effects are sorted by priority before execution. Loop detection limits
  // any single effect to _maxEffectRunsPerFlush runs per flush cycle.
  // rerunRootEffects() allows forceful re-scheduling of a root's entire
  // effect set (used by updateDOMFallback when re-mounting a compiled root).
  // ---------------------------------------------------------------------------
  class EffectScheduler {
    constructor(raa) {
      this.raa = raa;
      this._activeEffect = null;
      this._effectStack = [];
      this._runningEffects = new Set();
      this._pendingEffects = new Set();
      this._flushPending = false;
      this._flushCycleId = 0;
      this._effectRunCount = new Map();
      this._maxEffectRunsPerFlush = 50;
      this._rootEffects = new WeakMap();
    }

    createEffect(fn, options = {}) {
      const effect = {
        fn, deps: new Set(), active: true,
        priority: options.priority ?? PRIORITY.NORMAL,
        root: options.root || null, element: options.element || null,
      };
      if (effect.root) {
        if (!this._rootEffects.has(effect.root)) this._rootEffects.set(effect.root, new Set());
        this._rootEffects.get(effect.root).add(effect);
      }
      this.runEffect(effect);
      return effect;
    }

    runEffect(effect) {
      if (!effect.active) return;
      this.cleanupEffect(effect);
      this._effectStack.push(effect);
      this.raa._activeEffect = effect;
      this._runningEffects.add(effect);
      try { return effect.fn(); }
      finally {
        this._runningEffects.delete(effect);
        this._effectStack.pop();
        this.raa._activeEffect = this._effectStack[this._effectStack.length - 1] || null;
      }
    }

    cleanupEffect(effect) { effect.deps.forEach(dep => dep.delete(effect)); effect.deps.clear(); }

    disposeEffect(effect) {
      if (!effect.active) return;
      effect.active = false;
      this.cleanupEffect(effect);
      if (effect.root && this._rootEffects.has(effect.root)) this._rootEffects.get(effect.root).delete(effect);
    }

    scheduleEffect(effect) {
      if (!effect.active) return;
      this._pendingEffects.add(effect);
      if (!this._flushPending) { this._flushPending = true; queueMicrotask(() => this.flushEffects()); }
    }

    flushEffects() {
      this._flushPending = false;
      this._flushCycleId++;
      this._effectRunCount.clear();
      const toRun = [...this._pendingEffects].filter(e => e.active).sort((a, b) => a.priority - b.priority);
      this._pendingEffects.clear();
      for (const effect of toRun) {
        const count = (this._effectRunCount.get(effect) || 0) + 1;
        this._effectRunCount.set(effect, count);
        if (count > this._maxEffectRunsPerFlush) {
          // Fix #5: use RaaDiagnostics for consistent structured warning
          RaaDiagnostics.warn("EFFECT_LOOP", "Effect loop detected — skipping effect to prevent infinite cycle.", { element: effect.element || null });
          continue;
        }
        this.runEffect(effect);
      }
      // Delegate persist to PersistAndRefs subsystem after flush
      const touchedRoots = new Set();
      toRun.forEach(effect => { if (effect.root) touchedRoots.add(effect.root); });
      touchedRoots.forEach(root => {
        if (root.__raa_state__ && root.__raa_persist_key__ && this.raa.persist) {
          this.raa.persist.savePersistedState(root, root.__raa_state__);
        }
      });
    }

    disposeElementEffects(el) {
      if (!el.__raa_effects__) return;
      el.__raa_effects__.forEach(e => this.disposeEffect(e));
      el.__raa_effects__ = null;
    }

    /** Re-schedule all active effects for a root (used by updateDOMFallback) */
    rerunRootEffects(root) {
      const rootEffects = this._rootEffects.get(root);
      if (!rootEffects) return;
      rootEffects.forEach(effect => { if (effect.active) this.scheduleEffect(effect); });
    }
  }

  // ---------------------------------------------------------------------------
  // ScopeEvaluator — AST expression evaluator with scoped variable access
  //
  // Supports: identifiers, literals, member/computed/optional access, calls,
  //           unary/binary/conditional, object literals, array literals.
  //
  // Scope resolution order:
  //   1. Special keys: $store, $refs, $el, $state, $locals
  //   2. extraLocals (e.g. $event, $index from loop/event context)
  //   3. Ancestor locals (from raa-flow:for parent loops)
  //   4. Reactive state
  //   5. Safe globals (Math, JSON, console, etc.)
  //
  // The has/get traps restrict visibility — variables not in any of these
  // layers are inaccessible, preventing access to window/document/globalThis.
  // ---------------------------------------------------------------------------
  class ScopeEvaluator {
    constructor(raa) {
      this.raa = raa;
      this._astCache = new Map();
      this._assignPathCache = new Map();
      this._blockedCallProps = new Set(['constructor', '__proto__', 'prototype']);
      this._safeGlobals = {
        Math, Date, JSON, Array, Object, String, Number, Boolean, RegExp,
        Map, Set, WeakMap, WeakSet, Promise, Intl,
        parseInt, parseFloat, isNaN, isFinite,
        encodeURIComponent, decodeURIComponent, encodeURI, decodeURI,
        console
      };
    }

    // ── Tokenizer ──────────────────────────────────────────────────────────

    /**
     * Interpret a single ECMAScript escape character into its actual value.
     * Used by _tokenize for expression strings.
     * e.g. 'n' → '\n', 't' → '\t', unknown → char itself (per spec loose mode)
     */
    _unescapeChar(c) {
      switch (c) {
        case 'n':  return '\n';
        case 't':  return '\t';
        case 'r':  return '\r';
        case '\\': return '\\';
        case "'":  return "'";
        case '"':  return '"';
        case '0':  return '\0';
        case 'b':  return '\b';
        case 'f':  return '\f';
        case 'v':  return '\v';
        default:   return c; // unknown escape sequence → keep character (e.g. \s → s)
      }
    }

    /** Tokenize a template expression string into a token stream */
    _tokenize(expr) {
      const tokens = [];
      let i = 0;
      while (i < expr.length) {
        const ch = expr[i];
        // Whitespace
        if (/\s/.test(ch)) { i++; continue; }
        // Strings
        if (ch === "'" || ch === '"') {
          const quote = ch;
          let val = '';
          i++;
          while (i < expr.length) {
            const c = expr[i];
            // Properly interpret escape sequences
            if (c === '\\' && i+1 < expr.length) { val += this._unescapeChar(expr[i+1]); i+=2; continue; }
            if (c === quote) { i++; break; }
            val += c; i++;
          }
          tokens.push({ type: 'Literal', value: val });
          continue;
        }
        // Numbers
        if (/[0-9]/.test(ch)) {
          let num = '';
          while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
          if (!/^\d+(\.\d+)?$/.test(num)) throw new Error(`Invalid number "${num}"`);
          tokens.push({ type: 'Literal', value: Number(num) });
          continue;
        }
        // Identifiers & keywords
        if (/[a-zA-Z_$]/.test(ch)) {
          let id = '';
          while (i < expr.length && /[\w$]/.test(expr[i])) id += expr[i++];
          if (id === 'true') tokens.push({ type: 'Literal', value: true });
          else if (id === 'false') tokens.push({ type: 'Literal', value: false });
          else if (id === 'null') tokens.push({ type: 'Literal', value: null });
          else if (id === 'undefined') tokens.push({ type: 'Literal', value: undefined });
          else tokens.push({ type: 'Identifier', name: id });
          continue;
        }
        // Optional chaining: recognized as a single token to avoid parser ambiguity
        if (expr.substr(i, 2) === '?.') {
          tokens.push({ type: 'Punctuator', value: '?.' });
          i += 2;
          continue;
        }
        // 3-char operators
        const threeChar = expr.substr(i, 3);
        if (['===', '!=='].includes(threeChar)) {
          tokens.push({ type: 'Punctuator', value: threeChar });
          i += 3; continue;
        }
        // 2-char operators
        const twoChar = expr.substr(i, 2);
        if (['<=', '>=', '==', '!=', '&&', '||'].includes(twoChar)) {
          tokens.push({ type: 'Punctuator', value: twoChar });
          i += 2; continue;
        }
        // Single-char punctuation — includes { } for object literals
        if ('{}?:!<>=+-*/%()[].,'.includes(ch)) {
          tokens.push({ type: 'Punctuator', value: ch });
          i++; continue;
        }
        throw new Error(`Unexpected character "${ch}"`);
      }
      tokens.push({ type: 'EOF' });
      return tokens;
    }

    // ── Parser ─────────────────────────────────────────────────────────────

    /** Parse a token stream into an AST */
    _parseExpression(tokens) {
      let pos = 0;
      const peek = () => tokens[pos];
      const consume = () => tokens[pos++];
      const expect = (value) => {
        if (peek().value !== value) throw new Error(`Expected "${value}"`);
        return consume();
      };

      const parseConditional = () => {
        let node = parseLogicalOr();
        if (peek().value === '?') {
          consume();
          const consequent = parseConditional();
          expect(':');
          const alternate = parseConditional();
          node = { type: 'ConditionalExpression', test: node, consequent, alternate };
        }
        return node;
      };

      const parseLogicalOr = () => {
        let node = parseLogicalAnd();
        while (peek().value === '||') {
          consume();
          node = { type: 'BinaryExpression', operator: '||', left: node, right: parseLogicalAnd() };
        }
        return node;
      };

      const parseLogicalAnd = () => {
        let node = parseEquality();
        while (peek().value === '&&') {
          consume();
          node = { type: 'BinaryExpression', operator: '&&', left: node, right: parseEquality() };
        }
        return node;
      };

      const parseEquality = () => {
        let node = parseRelational();
        while (['==', '!=', '===', '!=='].includes(peek().value)) {
          const op = consume().value;
          node = { type: 'BinaryExpression', operator: op, left: node, right: parseRelational() };
        }
        return node;
      };

      const parseRelational = () => {
        let node = parseAdditive();
        while (['<', '>', '<=', '>='].includes(peek().value)) {
          const op = consume().value;
          node = { type: 'BinaryExpression', operator: op, left: node, right: parseAdditive() };
        }
        return node;
      };

      const parseAdditive = () => {
        let node = parseMultiplicative();
        while (['+', '-'].includes(peek().value)) {
          const op = consume().value;
          node = { type: 'BinaryExpression', operator: op, left: node, right: parseMultiplicative() };
        }
        return node;
      };

      const parseMultiplicative = () => {
        let node = parseUnary();
        while (['*', '/', '%'].includes(peek().value)) {
          const op = consume().value;
          node = { type: 'BinaryExpression', operator: op, left: node, right: parseUnary() };
        }
        return node;
      };

      const parseUnary = () => {
        if (['!', '-'].includes(peek().value)) {
          const op = consume().value;
          return { type: 'UnaryExpression', operator: op, argument: parseUnary() };
        }
        return parsePostfix(parsePrimary());
      };

      /**
       * parsePrimary — handles literals, identifiers, grouped expressions,
       * object literals ({ key: expr }), and array literals ([expr, ...]).
       */
      const parsePrimary = () => {
        const token = peek();

        // Literal
        if (token.type === 'Literal') {
          consume();
          return { type: 'Literal', value: token.value };
        }

        // Identifier (starts a member/call/optional chain — handled in parsePostfix)
        if (token.type === 'Identifier') {
          consume();
          return { type: 'Identifier', name: token.name };
        }

        // Grouped expression
        if (token.value === '(') {
          consume();
          const node = parseConditional();
          expect(')');
          return node;
        }

        // Object literal: { key: expr, 'key': expr }
        if (token.value === '{') {
          consume();
          const properties = [];
          if (peek().value !== '}') {
            while (true) {
              const keyTok = peek();
              let key;
              if (keyTok.type === 'Identifier') { key = keyTok.name; consume(); }
              else if (keyTok.type === 'Literal' && typeof keyTok.value === 'string') { key = keyTok.value; consume(); }
              // Fix #4: numeric literal keys — { 0: 'zero', 1: 'one' }
              else if (keyTok.type === 'Literal' && typeof keyTok.value === 'number') { key = String(keyTok.value); consume(); }
              else throw new Error(`Invalid object key in expression: ${JSON.stringify(keyTok)}`);
              expect(':');
              const value = parseConditional();
              properties.push({ type: 'Property', key, value });
              if (peek().value === '}') break;
              expect(',');
              // Fix #6: tolerate trailing comma — { a: 1, }
              if (peek().value === '}') break;
            }
          }
          expect('}');
          return { type: 'ObjectExpression', properties };
        }

        // Array literal: [expr, ...]
        if (token.value === '[') {
          consume();
          const elements = [];
          if (peek().value !== ']') {
            while (true) {
              elements.push(parseConditional());
              if (peek().value === ']') break;
              expect(',');
            }
          }
          expect(']');
          return { type: 'ArrayExpression', elements };
        }

        throw new Error(`Unexpected token ${JSON.stringify(token)}`);
      };

      /**
       * parsePostfix — handles member access (.), computed ([]), optional (?.)
       * and function call (()) chains after a primary expression.
       */
      const parsePostfix = (node) => {
        while (true) {
          const tok = peek();

          // Standard member access: a.b
          if (tok.value === '.') {
            consume();
            const prop = consume();
            if (prop.type !== 'Identifier') throw new Error('Expected property name after "."');
            node = { type: 'MemberExpression', object: node, property: { type: 'Identifier', name: prop.name }, computed: false, optional: false };
            continue;
          }

          // Computed access: a[expr]
          if (tok.value === '[') {
            consume();
            const property = parseConditional();
            expect(']');
            node = { type: 'MemberExpression', object: node, property, computed: true, optional: false };
            continue;
          }

          // Function call: fn(args)
          if (tok.value === '(') {
            consume();
            const args = [];
            if (peek().value !== ')') {
              args.push(parseConditional());
              while (peek().value === ',') { consume(); args.push(parseConditional()); }
            }
            expect(')');
            node = { type: 'CallExpression', callee: node, arguments: args };
            continue;
          }

          // Optional chaining: a?.b, a?.[expr], a?.fn()
          if (tok.value === '?.') {
            consume();
            const next = peek();
            if (next.value === '[') {
              // a?.[expr]
              consume();
              const property = parseConditional();
              expect(']');
              node = { type: 'MemberExpression', object: node, property, computed: true, optional: true };
            } else if (next.value === '(') {
              // a?.fn() — callee is the whole preceding node, mark optional
              consume();
              const args = [];
              if (peek().value !== ')') {
                args.push(parseConditional());
                while (peek().value === ',') { consume(); args.push(parseConditional()); }
              }
              expect(')');
              // Mark the callee node as optional so the evaluator can short-circuit
              node = { type: 'CallExpression', callee: Object.assign({}, node, { optional: true }), arguments: args };
            } else if (next.type === 'Identifier') {
              // a?.b
              const prop = consume();
              node = { type: 'MemberExpression', object: node, property: { type: 'Identifier', name: prop.name }, computed: false, optional: true };
            } else {
              throw new Error('Expected property, computed access, or call after "?."');
            }
            continue;
          }

          break;
        }
        return node;
      };

      const ast = parseConditional();
      if (peek().type !== 'EOF') throw new Error('Unexpected token after expression');
      return ast;
    }

    _parseAndCache(expr) {
      if (this._astCache.has(expr)) return this._astCache.get(expr);
      const tokens = this._tokenize(expr);
      const ast = this._parseExpression(tokens);
      this._astCache.set(expr, ast);
      return ast;
    }

    // ── Evaluator ──────────────────────────────────────────────────────────

    _evaluateNode(node, scope) {
      switch (node.type) {
        case 'Literal':
          return node.value;

        case 'Identifier':
          return scope[node.name];

        case 'MemberExpression': {
          const obj = this._evaluateNode(node.object, scope);
          // Optional short-circuit: a?.b returns undefined if a is null/undefined
          if (node.optional && (obj === null || obj === undefined)) return undefined;
          // Non-optional: throw naturally (TypeError propagates to evaluate() for single warning)
          const prop = node.computed ? this._evaluateNode(node.property, scope) : node.property.name;
          return obj[prop];
        }

        case 'CallExpression': {
          // Fix #2: avoid double-evaluating the object for method calls.
          let thisArg = undefined;
          let callee;
          const calleeNode = node.callee;
          if (calleeNode.type === 'MemberExpression') {
            const prop = calleeNode.computed
              ? this._evaluateNode(calleeNode.property, scope)
              : calleeNode.property.name;
            if (this._blockedCallProps.has(prop)) throw new Error(`Blocked function call "${prop}"`);
            thisArg = this._evaluateNode(calleeNode.object, scope);
            // Optional call short-circuit: a?.fn() returns undefined if a is null/undefined
            if (calleeNode.optional && (thisArg === null || thisArg === undefined)) return undefined;
            if (thisArg == null) throw new Error('Target object is null/undefined');
            callee = thisArg[prop];
          } else {
            callee = this._evaluateNode(calleeNode, scope);
          }
          if (typeof callee !== 'function') throw new Error('Target is not callable');
          const args = node.arguments.map(arg => this._evaluateNode(arg, scope));
          return thisArg !== undefined ? callee.apply(thisArg, args) : callee(...args);
        }

        case 'UnaryExpression': {
          const value = this._evaluateNode(node.argument, scope);
          if (node.operator === '!') return !value;
          if (node.operator === '-') return -value;
          throw new Error(`Unknown unary operator "${node.operator}"`);
        }

        case 'BinaryExpression': {
          const left = this._evaluateNode(node.left, scope);
          // Short-circuit logical operators
          if (node.operator === '&&') return left ? this._evaluateNode(node.right, scope) : left;
          if (node.operator === '||') return left ? left : this._evaluateNode(node.right, scope);
          const right = this._evaluateNode(node.right, scope);
          switch (node.operator) {
            case '+':   return left + right;
            case '-':   return left - right;
            case '*':   return left * right;
            case '/':   return left / right;
            case '%':   return left % right;
            case '==':  return left == right;
            case '!=':  return left != right;
            case '===': return left === right;
            case '!==': return left !== right;
            case '<':   return left < right;
            case '>':   return left > right;
            case '<=':  return left <= right;
            case '>=':  return left >= right;
            default:    throw new Error(`Unknown operator "${node.operator}"`);
          }
        }

        case 'ConditionalExpression':
          return this._evaluateNode(node.test, scope)
            ? this._evaluateNode(node.consequent, scope)
            : this._evaluateNode(node.alternate, scope);

        case 'ObjectExpression': {
          const obj = {};
          for (const prop of node.properties) {
            obj[prop.key] = this._evaluateNode(prop.value, scope);
          }
          return obj;
        }

        case 'ArrayExpression':
          return node.elements.map(el => this._evaluateNode(el, scope));

        default:
          throw new Error(`Unknown AST node "${node.type}"`);
      }
    }

    _evaluateExpression(expr, scope) {
      const ast = this._parseAndCache(expr);
      return this._evaluateNode(ast, scope);
    }

    // ── Scope Builder ──────────────────────────────────────────────────────

    /**
     * Build a scope Proxy that resolves variable names in this order:
     *   1. Special keys: $store, $refs, $el, $state, $locals
     *   2. extraLocals (e.g. $event, $index from loop/event context)
     *   3. Ancestor locals (from raa-flow:for parent loops)
     *   4. Reactive state
     *   5. Safe globals (Math, JSON, console, etc.)
     */
    buildScope(state, el, extraLocals = {}) {
      const locals = this.raa.collectAncestorLocals?.(el) || {};
      Object.assign(locals, extraLocals);
      const globals = Object.assign({}, this._safeGlobals, (global.RaaJS?.__safeGlobalsExtras__ || {}));
      const store = this.raa.globalStore;
      const self = this;
      return new Proxy(Object.create(null), {
        has: (_, key) => {
          if (key === Symbol.unscopables) return false;
          if (['$store', '$refs', '$el', '$state', '$locals'].includes(key)) return true;
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
          if (Object.prototype.hasOwnProperty.call(extraLocals, key)) { extraLocals[key] = value; return true; }
          if (Object.prototype.hasOwnProperty.call(locals, key)) { locals[key] = value; return true; }
          // Debug warning for unknown state keys (helps catch template typos)
          if (!(key in state) && self.raa.debug) {
            // Fix #5: use RaaDiagnostics for consistent structured warning
            RaaDiagnostics.warn("UNKNOWN_KEY", `Assigning to unknown key "${key}" on state. If this is a typo, fix the template expression.`, { element: el });
          }
          state[key] = value;
          return true;
        },
        // Include extraLocals so Object.keys(scope) correctly lists transient keys ($event, $index, etc.)
        ownKeys: () => Array.from(new Set([
          ...Object.keys(extraLocals),
          ...Object.keys(locals),
          ...Object.keys(state),
          '$store', '$refs', '$el', '$state', '$locals'
        ])),
        getOwnPropertyDescriptor: (_, key) => ({
          configurable: true, enumerable: true,
          value: self.buildScopeValue(state, el, locals, extraLocals, key)
        })
      });
    }

    /** Helper for getOwnPropertyDescriptor — mirrors get trap logic */
    buildScopeValue(state, el, locals, extraLocals, key) {
      if (key === '$store') return this.raa.globalStore;
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

    // ── Public Evaluate / Assign ───────────────────────────────────────────

    /** Evaluate an expression string with error handling */
    evaluate(expr, state, el, extraLocals = {}) {
      if (typeof expr !== 'string' || !expr.trim()) return undefined;
      try {
        const scope = this.buildScope(state, el, extraLocals);
        return this._evaluateExpression(expr, scope);
      } catch (e) {
        // Fix #5: use RaaDiagnostics for consistent structured warning
        RaaDiagnostics.warn("EVAL_FAIL", `Expression evaluation failed: "${expr}" — ${e.message}`, { element: el });
        if (this.raa.debug) console.error(`[RaaJS] Full error for "${expr}":`, e);
        return undefined;
      }
    }

    /** Assign a value to a path expression (e.g. "user.name") via scope */
    assign(expr, value, state, el, extraLocals = {}) {
      if (typeof expr !== 'string' || !expr.trim()) return;
      try {
        let path = this._assignPathCache.get(expr);
        if (!path) {
          path = this.parseAssignablePath(expr);
          if (!path) throw new Error(`Invalid assignment target "${expr}"`);
          this._assignPathCache.set(expr, path);
        }
        const scope = this.buildScope(state, el, extraLocals);
        this.assignByPath(scope, path, value);
      } catch (e) {
        if (this.raa.debug) console.error(`RaaJS Assign Error: "${expr}"`, e);
      }
    }

    /**
     * Walk a path array on scope, auto-creating intermediate objects/arrays,
     * then assign the value to the leaf key. Used by raa-bind:model.
     */
    assignByPath(scope, parts, value) {
      if (!parts || !parts.length) return;
      let target = scope;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        const nextKey = parts[i + 1];
        if (target[key] == null) target[key] = typeof nextKey === 'number' ? [] : {};
        target = target[key];
      }
      target[parts[parts.length - 1]] = value;
    }

    /**
     * Parse an assignable expression into path parts array.
     * Supports dot notation, bracket with string, and bracket with number.
     * Examples: "user.name" -> ['user','name']
     *           "items[0]"  -> ['items', 0]
     *           "data['k']" -> ['data', 'k']
     */
    parseAssignablePath(expr) {
      const input = String(expr).trim();
      if (!input) return null;
      const parts = [];
      let i = 0;
      const skipWs = () => { while (i < input.length && /\s/.test(input[i])) i++; };
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
        i++; skipWs();
        let key;
        if (input[i] === '"' || input[i] === "'") {
          const quote = input[i++]; let out = '';
          while (i < input.length) {
            const ch = input[i];
            if (ch === '\\' && i+1 < input.length) { out += input[i+1]; i+=2; continue; }
            if (ch === quote) break;
            out += ch; i++;
          }
          if (input[i] !== quote) return null;
          i++; key = out;
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
          parts.push(ident); continue;
        }
        const bracketKey = readBracketKey();
        if (bracketKey !== null) { parts.push(bracketKey); continue; }
        return null;
      }
      return parts;
    }
  }

  // ---------------------------------------------------------------------------
  // BindingApplier — DOM binding primitives
  //
  // Each method applies a specific binding type. They are called inside
  // reactive effects so they auto-rerun when dependencies change.
  // ---------------------------------------------------------------------------
  class BindingApplier {
    constructor(raa) { this.raa = raa; }

    applyTextBinding(el, value) {
      const next = value ?? '';
      if (el.textContent !== String(next)) el.textContent = String(next);
    }

    applyHTMLBinding(el, value) {
      const next = value ?? '';
      const sanitized = this.raa.sanitizeHTML(String(next));
      if (el.innerHTML !== sanitized) el.innerHTML = sanitized;
    }

    applyModelBinding(el, value) {
      if (el.type === 'checkbox') { el.checked = !!value; return; }
      if (el.type === 'radio') { el.checked = el.value === String(value); return; }
      if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        const next = value ?? '';
        if (el.value !== String(next)) el.value = String(next);
        return;
      }
      el.value = value ?? '';
    }

    applyClassBinding(el, value) {
      // Fix #1: support array values — ['active', 'bold'] → { active: true, bold: true }
      let next;
      if (Array.isArray(value)) {
        next = {};
        for (const cls of value) { if (cls) next[cls] = true; }
      } else {
        next = (value && typeof value === 'object') ? value : {};
      }
      const prev = el.__raa_class_prev__ || {};
      Object.keys(prev).forEach(cls => { if (!(cls in next)) el.classList.remove(cls); });
      Object.keys(next).forEach(cls => { el.classList.toggle(cls, !!next[cls]); });
      el.__raa_class_prev__ = { ...next };
    }

    applyStyleBinding(el, value) {
      const next = (value && typeof value === 'object') ? value : {};
      const prev = el.__raa_style_prev__ || {};
      Object.keys(prev).forEach(prop => { if (!(prop in next)) el.style[prop] = ''; });
      Object.keys(next).forEach(prop => { el.style[prop] = next[prop] ?? ''; });
      el.__raa_style_prev__ = { ...next };
    }

    applyAttrBinding(el, attrName, value) {
      if (value === false || value === null || value === undefined) { el.removeAttribute(attrName); return; }
      el.setAttribute(attrName, String(value));
    }

    applyShow(el, visible) {
      if (visible) {
        if (el.__raa_prev_display__ !== undefined) el.style.display = el.__raa_prev_display__;
        else el.style.display = '';
      } else {
        if (el.style.display !== 'none') el.__raa_prev_display__ = el.style.display;
        el.style.display = 'none';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // ControlFlow — Template directives: raa-flow:if and raa-flow:for
  //
  // Critical notes:
  //   * processIfTemplate passes el.content (DocumentFragment) to
  //     cloneTemplateFragment — NOT el itself. Per HTML spec, <template>
  //     children live in el.content, not el.childNodes.
  //   * processForTemplate includes debug warnings (restored from v2.2.0)
  //     for non-primitive raa-key values and duplicate keys.
  // ---------------------------------------------------------------------------
  class ControlFlow {
    constructor(raa) { this.raa = raa; }

    /**
     * Process raa-flow:if directive.
     * When visible: clone template content, insert into DOM, compile subtree.
     * When hidden: deep-cleanup nodes, remove from DOM.
     */
    processIfTemplate(el, expr, state, root) {
      const visible = !!this.raa.evaluate(expr, state, el);
      if (visible) {
        if (!el.__raa_if_nodes__) {
          // CRITICAL: pass el.content (DocumentFragment), not el (template element)
          const nodes = this.raa.cloneTemplateFragment(el.content);
          if (!nodes.length) return;
          el.__raa_if_nodes__ = nodes;
          this.raa.insertFragmentNodes(el.parentNode, el, nodes);
          nodes.forEach(node => {
            if (node.nodeType === 1) {
              node.__raa_root__ = root;
              this.raa.compileSubtree(node, state);
            }
          });
        }
      } else if (el.__raa_if_nodes__) {
        el.__raa_if_nodes__.forEach(node => this.raa.deepCleanup(node));
        el.__raa_if_nodes__.forEach(node => node.remove());
        el.__raa_if_nodes__ = null;
      }
    }

    /**
     * Process raa-flow:for directive with keyed diffing.
     * Supports: "item in array", "item, index in array"
     * Optional raa-key attribute for stable key-based diffing.
     */
    processForTemplate(el, expr, state, root) {
      const parts = expr.split(/\s+in\s+/);
      if (parts.length !== 2) return;
      const [itemDef, arrayExpr] = parts;
      const rawItemDef = itemDef.trim();
      const arrayData = this.raa.evaluate(arrayExpr, state, el);
      const prevBlocks = el.__raa_for_blocks__ || [];

      // Clean up previous DOM if arrayData is not an array (null, undefined, etc.)
      if (!Array.isArray(arrayData)) {
        prevBlocks.forEach(block => {
          const nodes = block.nodes || [];
          this.raa.destroyForBlock(block);
          this.raa.removeRenderedNodes(nodes);
          block.nodes = null; block.meta = null;
        });
        el.__raa_for_blocks__ = [];
        return;
      }

      const templateContent = el.content;
      const keyExpr = el.getAttribute('raa-key');
      const existingKeyMap = new Map();
      const seenKeys = new Set();
      prevBlocks.forEach(block => { if (block.key !== undefined) existingKeyMap.set(block.key, block); });
      const newBlocks = [];
      let anchor = el;

      arrayData.forEach((item, idx) => {
        const locals = this.raa.makeLoopLocals(rawItemDef, item, idx);
        let key = idx;
        if (keyExpr) key = this.raa.evaluate(keyExpr, state, el, locals);
        if (key === undefined || key === null) key = idx;

        if (typeof key === 'object' || typeof key === 'function') {
          if (this.raa.debug) console.warn('RaaJS: raa-key should resolve to a primitive value. Falling back to index.', key);
          key = idx;
        }

        if (seenKeys.has(key)) {
          if (this.raa.debug) console.warn('RaaJS: duplicate raa-key detected inside the same raa-flow:for render pass.', { key, idx, item });
          key = `${String(key)}__dup_${idx}`;
        }
        seenKeys.add(key);

        let block = existingKeyMap.get(key);
        if (block) {
          existingKeyMap.delete(key);
          block.key = key; block.locals = locals;
          if (block.meta) {
            const previousIndex = block.meta.index;
            block.meta.key = key; block.meta.index = idx; block.meta.lastIndex = previousIndex;
            block.meta.locals = locals; block.meta.nodes = block.nodes; block.meta.updatedAt = Date.now();
            block.meta.reuseCount++; block.meta.reused = true; block.meta.detached = false;
            block.meta.destroyed = false; block.meta.moved = previousIndex !== idx;
          }
          block.nodes.forEach(node => {
            node.__raa_locals__ = locals;
            if (block.meta) node.__raa_for_meta__ = block.meta;
          });
          block.nodes.forEach(node => this.raa.rerunSubtreeEffects(node));
          anchor = this.raa.moveRenderedNodesAfterAnchor(el.parentNode, anchor, block.nodes);
          newBlocks.push(block);
          return;
        }

        const nodes = this.raa.cloneTemplateFragment(templateContent);
        if (!nodes.length) return;
        nodes.forEach(node => {
          if (node.nodeType === 1) { node.__raa_locals__ = locals; node.__raa_root__ = root; }
        });
        anchor = this.raa.insertFragmentNodes(el.parentNode, anchor, nodes);
        nodes.forEach(node => { if (node.nodeType === 1) this.raa.compileSubtree(node, state); });
        block = { key, locals, nodes, meta: this.raa.createForBlockMeta(key, locals, nodes, root, idx) };
        newBlocks.push(block);
      });

      existingKeyMap.forEach(block => {
        const nodes = block.nodes || [];
        this.raa.destroyForBlock(block);
        this.raa.removeRenderedNodes(nodes);
        block.nodes = null; block.meta = null;
      });
      el.__raa_for_blocks__ = newBlocks;
    }
  }

  // ---------------------------------------------------------------------------
  // NetworkRouter — Fetch, WebSocket, and hash-based routing
  // ---------------------------------------------------------------------------
  class NetworkRouter {
    constructor(raa) { this.raa = raa; }

    setupNetwork(root, state) {
      const fetchAttr = root.getAttribute('raa-net:fetch');
      if (fetchAttr) {
        const arrowIdx = fetchAttr.lastIndexOf('->');
        if (arrowIdx !== -1) {
          const urlExpr = fetchAttr.substring(0, arrowIdx).trim();
          const target = fetchAttr.substring(arrowIdx + 2).trim();
          const url = this.raa.evaluate(urlExpr, state, root);
          if (url && target) {
            const controller = new AbortController();
            root.__raa_fetch_abort__ = controller;
            fetch(url, { signal: controller.signal })
              .then(res => res.json())
              .then(data => {
                if (!root.__raa_compiled__) return;
                state[target] = data;
              })
              .catch(err => {
                if (err.name === 'AbortError') return;
                if (this.raa.debug) console.error('RaaJS Fetch Error:', err);
              });
          }
        }
      }

      const syncAttr = root.getAttribute('raa-net:sync');
      if (syncAttr) {
        const arrowIdx = syncAttr.lastIndexOf('->');
        if (arrowIdx !== -1) {
          const wsUrlExpr = syncAttr.substring(0, arrowIdx).trim();
          const target = syncAttr.substring(arrowIdx + 2).trim();
          const wsUrl = this.raa.evaluate(wsUrlExpr, state, root);
          if (wsUrl && target) {
            const socket = new WebSocket(wsUrl);
            root.__raa_socket__ = socket;
            socket.onmessage = (e) => {
              if (!root.__raa_compiled__) return;
              try { state[target] = JSON.parse(e.data); }
              catch (ex) { if (this.raa.debug) console.error('RaaJS WS Parse Error:', ex); }
            };
            socket.onerror = (e) => { if (this.raa.debug) console.error('RaaJS WebSocket Error:', e); };
          }
        }
      }
    }

    setupRouter(root, state) {
      if (!root.hasAttribute('raa-eco:router')) return;
      const routes = {};
      root.querySelectorAll('[raa-eco\\:route]').forEach(el => {
        const path = el.getAttribute('raa-eco:route');
        routes[path] = el;
        el.style.display = 'none';
      });
      const renderRoute = () => {
        const hash = window.location.hash.slice(1) || '/';
        let matched = null;
        Object.entries(routes).forEach(([path, el]) => {
          const regex = new RegExp('^' + path.replace(/:[^/]+/g, '([^/]+)') + '$');
          const match = hash.match(regex);
          if (match && !matched) matched = { el, params: match.slice(1) };
        });
        Object.values(routes).forEach(el => el.style.display = 'none');
        if (matched) { matched.el.style.display = ''; state.$routeParams = matched.params; }
      };
      const handler = () => renderRoute();
      root.__raa_router_handler__ = handler;
      window.addEventListener('hashchange', handler);
      renderRoute();
    }
  }

  // ---------------------------------------------------------------------------
  // PersistAndRefs — localStorage persistence and ref registration
  // ---------------------------------------------------------------------------
  class PersistAndRefs {
    constructor(raa) { this.raa = raa; }

    safeSerialize(value) {
      const seen = new WeakSet();
      return JSON.stringify(value, (key, val) => {
        if (key === '$refs') return undefined;
        if (typeof val === 'function') return undefined;
        if (this.raa.isDomNode?.(val)) return undefined;
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
      try { Object.assign(state, JSON.parse(stored)); }
      catch (e) { if (this.raa.debug) console.error('RaaJS Persist Load Error:', e); }
    }

    savePersistedState(root, state) {
      const persistKey = root.__raa_persist_key__;
      if (!persistKey) return;
      try { localStorage.setItem(persistKey, this.safeSerialize(state)); }
      catch (e) { if (this.raa.debug) console.error('RaaJS Persist Save Error:', e); }
    }

    registerRef(refs, name, el) {
      if (!name) return;
      const current = refs[name];
      if (!current) { refs[name] = el; return; }
      if (Array.isArray(current)) { if (!current.includes(el)) current.push(el); return; }
      if (current !== el) refs[name] = [current, el];
    }
  }

  // ---------------------------------------------------------------------------
  // PluginManager (unchanged except for comment adjustments)
  // ---------------------------------------------------------------------------
  class PluginManager {
    constructor(raa) {
      this.raa = raa;
      this.plugins = new Map();
      this.lifecycleHooks = { beforeCompile: [], afterCompile: [], beforeDestroy: [], afterDestroy: [] };
      this._pluginDirectives = new Map();
      this._anonSeq = 0;
    }

    use(plugin, options = {}) {
      if (typeof plugin === 'function') {
        this._anonSeq++;
        plugin = { name: `anonymous_${this._anonSeq}`, install: plugin };
      }
      if (typeof plugin !== 'object' || !plugin.name || typeof plugin.install !== 'function') {
        throw new Error('RaaJS plugin must have { name, install } or be a function');
      }
      if (this.plugins.has(plugin.name)) {
        RaaDiagnostics.warn("PLUGIN_DUP", `Plugin "${plugin.name}" already registered. Skipping.`);
        return this;
      }
      if (plugin.depends) {
        for (const dep of plugin.depends) {
          if (!this.plugins.has(dep)) throw new Error(`RaaJS: Plugin "${plugin.name}" depends on "${dep}" which is not registered.`);
        }
      }
      const directivesBefore = new Set(this.raa.__raa_custom_directives__.map(d => d[0]));
      try {
        plugin.install(this.raa, options);
        this.plugins.set(plugin.name, { plugin, options });
        const directivesAfter = this.raa.__raa_custom_directives__.map(d => d[0]);
        const addedDirectives = directivesAfter.filter(d => !directivesBefore.has(d));
        if (addedDirectives.length > 0) this._pluginDirectives.set(plugin.name, new Set(addedDirectives));
        if (this.raa.debug) console.log(`RaaJS: Plugin "${plugin.name}" installed successfully.`);
      } catch (e) {
        console.error(`RaaJS: Plugin "${plugin.name}" failed to install.`, e);
      }
      return this;
    }

    uninstall(name) {
      const entry = this.plugins.get(name);
      if (!entry) { RaaDiagnostics.warn("PLUGIN_NOT_FOUND", `Plugin "${name}" is not installed.`); return this; }
      if (typeof entry.plugin.uninstall === 'function') {
        try { entry.plugin.uninstall(this.raa); }
        catch (e) { console.error(`RaaJS: Error during uninstall of plugin "${name}".`, e); }
      }
      Object.keys(this.lifecycleHooks).forEach(hook => {
        this.lifecycleHooks[hook] = this.lifecycleHooks[hook].filter(fn => fn.__raa_plugin__ !== name);
      });
      const pluginDirectives = this._pluginDirectives.get(name);
      if (pluginDirectives && pluginDirectives.size > 0) {
        this.raa.__raa_custom_directives__ = this.raa.__raa_custom_directives__.filter(([pattern]) => !pluginDirectives.has(pattern));
        this._pluginDirectives.delete(name);
      }
      this.plugins.delete(name);
      if (this.raa.debug) console.log(`RaaJS: Plugin "${name}" uninstalled.`);
      return this;
    }

    hasPlugin(name) { return this.plugins.has(name); }
    getPlugins() { return Array.from(this.plugins.keys()); }

    addHook(hook, fn, pluginName) {
      if (this.lifecycleHooks[hook]) {
        fn.__raa_plugin__ = pluginName || 'anonymous';
        this.lifecycleHooks[hook].push(fn);
      } else {
        RaaDiagnostics.warn("HOOK_UNKNOWN", `Unknown lifecycle hook "${hook}".`);
      }
    }

    runHook(hook, ...args) {
      const hooks = this.lifecycleHooks[hook];
      if (hooks) hooks.forEach(fn => {
        try { fn(...args); }
        catch (e) { if (this.raa.debug) console.error(`RaaJS hook error: ${hook}`, e); }
      });
    }
  }

  // =========================================================================
  // 3. MAIN RaaJS CLASS
  // =========================================================================

  class RaaJS {
    constructor(config = {}) {
      this.globalStore = config.store || {};
      this.rootSelector = config.rootSelector || '[raa-core\\:app]';
      this.debug = !!config.debug;
      this._trustHTML = !!config.trustHTML;
      this._sanitizer = config.sanitizer || null;

      this.reactive = new ReactiveSystem(this);
      this.scheduler = new EffectScheduler(this);
      this.evaluator = new ScopeEvaluator(this);
      this.bindings = new BindingApplier(this);
      this.controlFlow = new ControlFlow(this);
      this.network = new NetworkRouter(this);
      this.persist = new PersistAndRefs(this);
      this.pluginManager = new PluginManager(this);

      this._directiveCache = new WeakMap();
      this._domObserver = null;
      this.__raa_custom_directives__ = [];
      this._forBlockSeq = 0;
      this._activeEffect = null;
      this._runningEffects = this.scheduler._runningEffects;

      if (!RaaJS.__safeGlobalsExtras__) RaaJS.__safeGlobalsExtras__ = {};

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
        if (parentRoot && parentRoot !== root && !root.hasAttribute('raa-eco:island')) return;
        this.compileRoot(root);
      });
    }

    use(plugin, options) { return this.pluginManager.use(plugin, options); }

    mount(target) {
      if (!target) return;
      const root = typeof target === 'string' ? document.querySelector(target) : target;
      if (root) this.compileRoot(root);
    }

    nextTick(fn) {
      return new Promise(resolve => queueMicrotask(() => { if (fn) fn(); resolve(); }));
    }

    observeDocument() {
      if (this._domObserver || typeof MutationObserver === 'undefined') return;
      const scanRemoved = (node) => {
        if (!node || node.nodeType !== 1) return;
        if (node.__raa_compiled__) this.destroyRoot(node);
        if (node.querySelectorAll) {
          node.querySelectorAll(this.rootSelector).forEach(root => {
            if (root.__raa_compiled__) this.destroyRoot(root);
          });
        }
      };
      this._domObserver = new MutationObserver(records => {
        for (const record of records) record.removedNodes.forEach(scanRemoved);
      });
      this._domObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    // ══════════════════════════════════════════════════════
    //  SUBSYSTEM DELEGATION SHORTCUTS
    // ══════════════════════════════════════════════════════

    createEffect(fn, options)     { return this.scheduler.createEffect(fn, options); }
    runEffect(effect)             { return this.scheduler.runEffect(effect); }
    disposeEffect(effect)         { this.scheduler.disposeEffect(effect); }
    disposeElementEffects(el)     { this.scheduler.disposeElementEffects(el); }
    scheduleEffect(effect)        { this.scheduler.scheduleEffect(effect); }
    flushEffects()                { this.scheduler.flushEffects(); }
    track(target, key)            { this.reactive.track(target, key, this._activeEffect); }
    trigger(target, key)          { this.reactive.trigger(target, key); }
    createReactive(root, target)  { return this.reactive.createReactive(root, target); }
    isReactiveCandidate(value)    { return this.reactive.isReactiveCandidate(value); }
    isElement(node)               { return !!node && node.nodeType === 1; }
    isDomNode(value)              { return typeof Node !== 'undefined' && value instanceof Node; }

    // ══════════════════════════════════════════════════════
    //  COMPILE PHASE
    // ══════════════════════════════════════════════════════

    compileRoot(root) {
      if (!this.isElement(root)) return;

      if (root.__raa_compiled__) {
        this.updateDOMFallback(root, root.__raa_state__);
        return root.__raa_state__;
      }

      this.pluginManager.runHook('beforeCompile', root);

      root.__raa_compiled__ = true;
      root.__raa_compiling__ = true;

      let appMethods = null;
      let appInit = null;
      const appName = root.getAttribute('raa-core:app');
      let rawData = {};

      if (appName) {
        const appFactory = RaaJS.apps[appName];
        if (!appFactory) {
          const suggestion = suggestClosest(appName, Object.keys(RaaJS.apps));
          RaaDiagnostics.warn("APP_NOT_FOUND", `App instance "${appName}" not found.`, { element: root, suggestion });
          root.__raa_compiling__ = false;
          return;
        }
        const app = appFactory();
        rawData = app.state || {};
        appMethods = app.methods || {};
        appInit = app.init;
      }

      const state = this.createReactive(root, rawData);
      root.__raa_state__ = state;
      if (!state.$refs) state.$refs = {};

      this.persist.loadPersistedState(root, state);

      if (appMethods) {
        Object.keys(appMethods).forEach(key => {
          if (typeof appMethods[key] === 'function') state[key] = appMethods[key].bind(state);
        });
      }

      if (appInit) {
        queueMicrotask(() => {
          if (!root.__raa_compiled__) return;
          try { appInit.call(state); }
          catch (e) { if (this.debug) console.error('RaaJS appInit Error:', e); }
        });
      }

      this.compileSubtree(root, state);
      this.network.setupNetwork(root, state);
      this.network.setupRouter(root, state);

      root.__raa_compiling__ = false;
      this.pluginManager.runHook('afterCompile', root, state);

      return state;
    }

    compileSubtree(root, state) {
      const elements = this.getManagedElements(root);

      // Pass 1: refs, inits, events
      elements.forEach(el => {
        el.__raa_root__ = root;
        const refName = el.getAttribute?.('raa-core:ref');
        if (refName) this.persist.registerRef(state.$refs, refName, el);
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

      for (const { name, value } of directives) {
        // Skip internal directives, with dev warning for removed raa-core:data
        if (name === 'raa-core:data' || name === 'raa-core:ref' || name === 'raa-core:init') {
          if (name === 'raa-core:data' && this.debug) {
            RaaDiagnostics.warn('DEPRECATED', 'raa-core:data has been removed. Use raa-core:init with Object.assign($state, { ... }) instead.', { element: el });
          }
          continue;
        }
        if (isLazy && this._isReactiveDirective(name)) { deferred.push({ name, value }); continue; }
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
            deferred.forEach(({ name, value }) => this.createBindingEffect(el, name, value, state, root));
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
      const createEffect = (fn) => this.scheduler.createEffect(fn, { root, element: el });

      if (name === 'raa-bind:text') {
        el.__raa_effects__.push(createEffect(() => this.bindings.applyTextBinding(el, this.evaluate(value, state, el))));
      } else if (name === 'raa-bind:html') {
        el.__raa_effects__.push(createEffect(() => this.bindings.applyHTMLBinding(el, this.evaluate(value, state, el))));
      } else if (name === 'raa-bind:model') {
        el.__raa_effects__.push(createEffect(() => this.bindings.applyModelBinding(el, this.evaluate(value, state, el))));
      } else if (name === 'raa-bind:class') {
        el.__raa_effects__.push(createEffect(() => this.bindings.applyClassBinding(el, this.evaluate(value, state, el))));
      } else if (name === 'raa-bind:style') {
        el.__raa_effects__.push(createEffect(() => this.bindings.applyStyleBinding(el, this.evaluate(value, state, el))));
      } else if (name.startsWith('raa-bind:')) {
        const attrName = name.slice('raa-bind:'.length);
        el.__raa_effects__.push(createEffect(() => this.bindings.applyAttrBinding(el, attrName, this.evaluate(value, state, el))));
      } else if (name === 'raa-flow:show') {
        el.__raa_effects__.push(createEffect(() => this.bindings.applyShow(el, !!this.evaluate(value, state, el))));
      } else if (name === 'raa-flow:if' && el.tagName.toLowerCase() === 'template') {
        el.__raa_effects__.push(createEffect(() => this.controlFlow.processIfTemplate(el, value, state, root)));
      } else if (name === 'raa-flow:for' && el.tagName.toLowerCase() === 'template') {
        el.__raa_effects__.push(createEffect(() => this.controlFlow.processForTemplate(el, value, state, root)));
      } else if (name === 'raa-eco:auth') {
        el.__raa_effects__.push(createEffect(() => { el.style.display = !!this.evaluate(value, state, el) ? '' : 'none'; }));
      } else if (name === 'raa-ux:focus') {
        if (!el.__raa_focused__) {
          el.__raa_focused__ = true;
          queueMicrotask(() => { try { el.focus(); } catch(_){} });
        }
      } else if (name === 'raa-ux:loading') {
        el.__raa_effects__.push(createEffect(() => {
          const loading = !!this.evaluate(value, state, el);
          el.classList.toggle('raa-loading', loading);
          if (loading) el.setAttribute('aria-busy', 'true');
          else el.removeAttribute('aria-busy');
        }));
      } else if (name === 'raa-ux:disable') {
        el.__raa_effects__.push(createEffect(() => { el.disabled = !!this.evaluate(value, state, el); }));
      } else if (name === 'raa-ux:lazy') {
        // Handled in compileDirectives — explicit no-op guard
      } else if (this.__raa_custom_directives__) {
        for (const [pattern, handler] of this.__raa_custom_directives__) {
          let matches = false;
          if (pattern.endsWith(':*')) {
            const base = pattern.slice(0, -2);
            matches = (name === base) || name.startsWith(base + ':');
          } else {
            matches = (name === pattern);
          }
          if (matches) { handler.call(this, el, name, value, state, root); return; }
        }
      }
    }

    // ══════════════════════════════════════════════════════
    //  DESTROY
    // ══════════════════════════════════════════════════════

    destroyRoot(root) {
      if (!root || !root.__raa_compiled__) return;

      this.pluginManager.runHook('beforeDestroy', root);

      if (root.__raa_fetch_abort__) {
        try { root.__raa_fetch_abort__.abort(); } catch(_){}
        root.__raa_fetch_abort__ = null;
      }
      if (root.__raa_socket__) {
        try { root.__raa_socket__.close(); } catch(_){}
        root.__raa_socket__ = null;
      }
      if (root.__raa_router_handler__) {
        window.removeEventListener('hashchange', root.__raa_router_handler__);
        root.__raa_router_handler__ = null;
      }

      const rootEffects = this.scheduler._rootEffects.get(root);
      if (rootEffects) {
        rootEffects.forEach(effect => this.scheduler.disposeEffect(effect));
        this.scheduler._rootEffects.delete(root);
      }

      this.deepCleanup(root);
      root.__raa_compiled__ = false;
      root.__raa_state__ = null;
      root.__raa_if_nodes__ = null;

      this.pluginManager.runHook('afterDestroy', root);
    }

    deepCleanup(el, visited = new WeakSet()) {
      if (!el || typeof el !== 'object') return;
      if (visited.has(el)) return;
      visited.add(el);

      this.disposeElementEffects(el);

      if (el.__raa_handlers__) {
        Object.entries(el.__raa_handlers__).forEach(([eventType, handler]) => {
          try { el.removeEventListener(eventType, handler); } catch(_){}
        });
        el.__raa_handlers__ = null;
      }

      if (el.__raa_lazy_observer__) {
        try { el.__raa_lazy_observer__.disconnect(); } catch(_){}
        el.__raa_lazy_observer__ = null;
      }

      if (el.__raa_if_nodes__) {
        const nodes = el.__raa_if_nodes__;
        el.__raa_if_nodes__ = null;
        nodes.forEach(node => { this.deepCleanup(node, visited); if (node.isConnected) node.remove(); });
      }

      if (el.__raa_for_blocks__) {
        const blocks = el.__raa_for_blocks__;
        el.__raa_for_blocks__ = null;
        blocks.forEach(block => {
          const nodes = block?.nodes || [];
          this.destroyForBlock(block);
          nodes.forEach(node => { this.deepCleanup(node, visited); if (node.isConnected) node.remove(); });
          block.nodes = null; block.meta = null;
        });
      }

      if (el.children && el.children.length) {
        Array.from(el.children).forEach(child => this.deepCleanup(child, visited));
      }
    }

    // ══════════════════════════════════════════════════════
    //  TEMPLATE & DOM UTILITIES (unchanged)
    // ══════════════════════════════════════════════════════

    cloneTemplateFragment(templateContent) {
      const fragment = templateContent.cloneNode(true);
      return Array.from(fragment.childNodes);
    }

    insertFragmentNodes(parent, anchor, nodes) {
      let last = anchor;
      nodes.forEach(node => { parent.insertBefore(node, last.nextSibling); last = node; });
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
      nodes.forEach(node => { if (node.parentNode) node.parentNode.removeChild(node); });
    }

    makeLoopLocals(rawItemDef, item, idx) {
      const locals = {};
      const parts = rawItemDef.split(',').map(s => s.trim()).filter(Boolean);
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
        key, index: idx, locals, nodes, root,
        createdAt: Date.now(), updatedAt: Date.now(),
        reuseCount: 0, renderCount: 0
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
        node.__raa_effects__.forEach(effect => { if (effect.active) this.scheduleEffect(effect); });
      }
      Array.from(node.children || []).forEach(child => this.rerunSubtreeEffects(child));
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
          if (blockedTags.has(tag) || !allowedTags.has(tag)) { child.remove(); continue; }
          for (const attr of Array.from(child.attributes)) {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim();
            if (name.startsWith('on')) { child.removeAttribute(attr.name); continue; }
            if (!(allowedAttrs.has(name) || name.startsWith('aria-') || name.startsWith('data-'))) { child.removeAttribute(attr.name); continue; }
            if (urlAttrs.has(name) && /^(javascript:|data:text\/html)/i.test(value)) { child.removeAttribute(attr.name); continue; }
            if (name === 'target' && value === '_blank') child.setAttribute('rel', 'noopener noreferrer');
          }
          cleanNode(child);
        }
      };
      cleanNode(template.content);
      return template.innerHTML;
    }

    // ══════════════════════════════════════════════════════
    //  DIRECTIVE & EVENT BINDING
    // ══════════════════════════════════════════════════════

    getDirectives(el) {
      if (this._directiveCache.has(el)) return this._directiveCache.get(el);
      const directives = [];
      if (el.attributes) Array.from(el.attributes).forEach(attr => directives.push({ name: attr.name, value: attr.value }));
      this._directiveCache.set(el, directives);
      return directives;
    }

    bindEventsOnElement(el, state) {
      const directives = this.getDirectives(el);
      directives.forEach(({ name, value }) => {
        if (name.startsWith('raa-on:')) {
          const rest = name.slice('raa-on:'.length);
          const dotIdx = rest.indexOf('.');
          const eventType = dotIdx !== -1 ? rest.substring(0, dotIdx) : rest;
          const modifiers = dotIdx !== -1 ? rest.substring(dotIdx + 1).split('.') : [];
          const handlerKey = `__raa_ev_${eventType}_${modifiers.join('_')}`;
          if (!el.__raa_handlers__[handlerKey]) {
            const handler = (e) => {
              if (modifiers.includes('self') && e.target !== el) return;
              if (modifiers.includes('prevent')) e.preventDefault();
              if (modifiers.includes('stop')) e.stopPropagation();
              this.evaluate(value, state, el, { $event: e });
            };
            el.addEventListener(eventType, handler);
            el.__raa_handlers__[handlerKey] = handler;
          }
        }
        if (name === 'raa-bind:model' && !el.__raa_model_bound__) {
          const eventType = (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT') ? 'change' : 'input';
          const handler = () => {
            let newValue;
            if (el.type === 'checkbox') newValue = el.checked;
            else if (el.type === 'radio') { if (!el.checked) return; newValue = el.value; }
            else newValue = el.value;
            this.assign(value, newValue, state, el);
          };
          el.addEventListener(eventType, handler);
          el.__raa_handlers__[`${eventType}__model`] = handler;
          el.__raa_model_bound__ = true;
        }
      });
    }

    // ══════════════════════════════════════════════════════
    //  EVALUATOR DELEGATION (parseDataObject removed)
    // ══════════════════════════════════════════════════════

    evaluate(expr, state, el, extraLocals = {})  { return this.evaluator.evaluate(expr, state, el, extraLocals); }
    assign(expr, value, state, el, extraLocals = {}) { this.evaluator.assign(expr, value, state, el, extraLocals); }

    // ══════════════════════════════════════════════════════
    //  DOM TRAVERSAL HELPERS
    // ══════════════════════════════════════════════════════

    getManagedElements(root) {
      const all = [root, ...Array.from(root.querySelectorAll('*'))];
      return all.filter(el => {
        if (!this.isElement(el)) return false;
        if (el !== root) {
          if (el.closest('template') && el.tagName.toLowerCase() !== 'template') return false;
          const island = el.closest('[raa-eco\\:island]');
          if (island && island !== root) return false;
        }
        return true;
      });
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

    updateDOMFallback(root, state) { this.scheduler.rerunRootEffects(root); }

    // ══════════════════════════════════════════════════════
    //  STATIC API
    // ══════════════════════════════════════════════════════

    static define(name, factory) {
      if (typeof name !== 'string' || !name.trim()) throw new Error('[RaaJS] App name must be a non-empty string.');
      if (typeof factory !== 'function') throw new Error('[RaaJS] App factory must be a function.');
      RaaJS.apps[name] = factory;
    }

    static defineGlobal(name, getter) {
      if (!RaaJS.__safeGlobalsExtras__) RaaJS.__safeGlobalsExtras__ = {};
      RaaJS.__safeGlobalsExtras__[name] = getter;
    }
  }

  // ── Static registries ──────────────────────────────────────────────────────
  RaaJS.apps = Object.create(null);
  RaaJS.__safeGlobalsExtras__ = Object.create(null);

  // ── Global export & auto-initialization ────────────────────────────────────
  global.RaaJS = RaaJS;
  document.addEventListener('DOMContentLoaded', () => {
    global.Raa = new RaaJS();
  });

})(window);
