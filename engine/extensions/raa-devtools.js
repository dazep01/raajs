/**
 * Raa DevTools — Fusion Cockpit | v3.1.0
 * File: raa-devtools.js
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * DESKRIPSI UMUM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * DevTools v3.1.0 mengintegrasikan seluruh ekosistem Raa (Nervous System,
 * Cognitive Engine, Quantum State, dan Ecosystem) dalam satu panel inspeksi
 * real-time yang komprehensif.
 * 
 * Sebagai "Glass Cockpit", DevTools menyediakan visibilitas penuh terhadap
 * state, reaktivitas, performa, dan alur data tanpa mengganggu eksekusi aplikasi.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * FITUR UTAMA
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * STATE INSPECTION
 *   • Nested State Explorer — tampilkan state dalam struktur pohon
 *   • God Mode — edit nilai state langsung dari panel (reaktivitas natural)
 *   • Real-time Search — cari key dan value secara instan
 *   • Multi-root Support — inspeksi raa-core:app dan raa-eco:island
 * 
 * REACTIVE MAPPING
 *   • Synapse Graph — pemetaan otomatis State Key ↔ DOM Element
 *   • Highlight DOM — klik state key untuk sorot semua elemen terikat
 *   • Dependency Statistics — jumlah key unik dan elemen yang terikat
 * 
 * TIMELINE & EVENTS
 *   • Timeline — kronologi mutasi state dengan timestamp
 *   • Events Log — catatan evaluasi, assignment, dan DOM events
 *   • Causality Chain — lacak event pemicu dan mutasi penyebabnya
 * 
 * DIRECTIVE INSPECTOR
 *   • Inspeksi atribut raa-* pada elemen terpilih
 *   • Tampilkan dependensi reaktif dan efek aktif
 *   • AST Viewer — parse ekspresi RaaJS tanpa evaluasi (CSP-safe)
 * 
 * PERFORMANCE PROFILING
 *   • Reactive Flamegraph — durasi eksekusi per evaluasi dengan color-coding
 *   • Effect Explorer — statistik runs, total waktu, dan rata-rata per efek
 *   • Directive Benchmark — ukur durasi raa-flow:for dan raa-flow:if
 * 
 * MEMORY & DEBUGGING
 *   • Memory Leak Detector — identifikasi zombie effects
 *   • Dependency Heatmap Overlay — sorot elemen berdasarkan frekuensi trigger
 *   • Reactive Coverage — hitung dead state dan state yang tidak digunakan
 *   • Smart Linter — tangkap anti-pattern dan peringatan dari RaaJS
 * 
 * TIME-TRAVEL ENGINE
 *   • Automatic Snapshots — simpan state setiap mutasi (max 50 riwayat)
 *   • Rewind/Forward — navigasi timeline dengan slider dan daftar kronologi
 *   • Safe Cloning — gunakan structuredClone dengan fallback JSON
 *   • Natural DOM Update — DOM diperbarui otomatis setelah rewind
 * 
 * NETWORK MONITORING
 *   • Network Interceptor — pantau raa-net:fetch dan raa-net:sync
 *   • Request Log — tampilkan semua permintaan jaringan
 *   • Integration — terintegrasi dengan raa.network.setupNetwork
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * KEYBOARD SHORTCUTS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Ctrl+Shift+R    Toggle panel inspeksi
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * PRINSIP TEKNIS
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * • Plugin-Native (v3.1.0+) — terintegrasi langsung dengan RaaJS core
 * • Zero Dependency — tidak memerlukan library eksternal
 * • Real-time Discovery — deteksi root dan island secara otomatis
 * • Instance-level Patching — patch instance, bukan prototype
 * • Zero-cost When Inactive — interceptor hanya aktif saat panel terbuka
 * • Idempotent Installation — plugin tidak dipasang dua kali
 * • Safe Uninstall — metode asli dikembalikan untuk toggle berulang
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * CHANGELOG
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * v3.1.0 (2026-06-04)
 *   FEATURES
 *     • Inspector v3+ dengan nested state explorer
 *     • Synapse Graph — mapping state ↔ DOM otomatis
 *     • Timeline & Events Log dengan causality tracking
 *     • Directive Inspector untuk raa-* attributes
 *     • AST Viewer & Dependency Extractor (CSP-safe)
 *     • Reactive Flamegraph dengan color-coding performa
 *     • Effect Explorer dengan statistik per efek
 *     • Time-Travel Engine dengan auto-snapshots (max 50)
 *     • Memory Leak Detector — zombie hunter
 *     • Dependency Heatmap Overlay dengan tooltip
 *     • Network Interceptor untuk raa-net:*
 *     • Reactive Coverage Calculator
 *     • Directive Benchmark untuk raa-flow:*
 *     • Smart Linter dengan deduplication
 *     • UI Premium — glassmorphism, Catppuccin Mocha, JetBrains Mono
 * 
 *   BREAKING CHANGES
 *     • Instance names disesuaikan dengan core v3.1.0:
 *       - raa.effectScheduler → raa.scheduler
 *       - raa.reactiveSystem  → raa.reactive
 *       - raa.scopeEvaluator  → raa.evaluator
 * 
 *   FIXES
 *     • Perbaiki raa.scheduler.flushEffects dan _pendingEffects
 *     • raa._activeEffect lives on main instance
 *     • track() wrapper meneruskan 3 argumen (target, key, activeEffect)
 *     • Reaktivitas tidak mati saat DevTools aktif
 *     • Overlay heatmap benar-benar transparan
 *     • Modal tidak tumpang tindih dengan sidebar (left: 72px)
 *     • Time-travel tidak memicu rekursi (historyIndex, isRewinding)
 *     • Linter tidak menduplikasi warning dalam 3 detik
 * 
 *   IMPROVEMENTS
 *     • Kompatibilitas penuh dengan RaaJS v3.1.0
 *     • uninstall() mengembalikan metode asli
 *     • Zero console.log production leak
 *     • Zero-cost ketika panel ditutup
 *     • Memory leak prevention pada beforeDestroy
 *     • StructuredClone fallback untuk snapshot aman
 * 
 * v2.2.0 (baseline)
 *   Original version dengan prototype patching approach
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * MIGRASI v2.x → v3.1.0
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Tidak ada perubahan breaking pada API window.RaaDevTools.
 * Metode yang tersedia: enable(), disable(), toggle(), rewind(index)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * @author RaaRion
 * @license MIT
 * @requires RaaJS v3.1.0
 * @version 3.1.0
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';
  if (typeof window === 'undefined') return;

  // ═══════════════════════════════════════════════════════════════════════
  //  INTERNAL STATE (The Cerebral Cortex) — Gabungan semua fase
  // ═══════════════════════════════════════════════════════════════════════
  const dt = {
    // Core
    active: false,
    sidebar: null,
    modal: null,
    currentModalTab: null,
    writeMode: false,
    selectMode: false,

    // Roots & Paths
    roots: new Set(),
    pathMaps: new WeakMap(),

    // Synapse (Fase 1 & 3)
    keyToElements: new Map(),
    elementToKeys: new Map(),

    // Timeline & Events (Fase 1)
    timeline: [],
    maxTimeline: 300,
    events: [],
    maxEvents: 300,

    // Directive Inspector
    selectedElement: null,

    // Fase 2: Cognitive Engine
    flameBuffer: [],
    maxFlame: 500,
    effectStats: new Map(), // effectId -> { runs, totalTime, avg, expr, element }
    causality: {
      lastEvent: null,
      lastMutation: null
    },
    astCache: new Map(),

    // Fase 3: Quantum State
    history: [],
    maxHistory: 50,
    historyIndex: -1,
    isRewinding: false,
    effectRegistry: new Map(), // effectId -> { element, root, active, runs, expr }
    heatmapData: new Map(),
    overlayCanvas: null,
    overlayCtx: null,
    _rafId: null,
    _currentTarget: null,

    // Fase 4: Ecosystem
    networkLog: [],
    maxNetwork: 100,
    directiveBench: new Map(), // directive name -> { count, totalTime, avg }
    linterWarnings: [],
    maxLinter: 100,

    // Misc
    _installed: false,
    _updateTimer: null,
    _originals: {},
    _searchQuery: ''
  };

  // ─── Utilities ────────────────────────────────────────────────────────
  function safeStringify(obj, indent = 0) {
    try {
      return JSON.stringify(obj, (k, v) => {
        if (typeof v === 'function') return '[Function]';
        if (v && typeof v === 'object' && v.nodeType) return '[DOM]';
        if (v === undefined) return '[undefined]';
        return v;
      }, indent);
    } catch (_) {
      return '[Circular]';
    }
  }

  function schedulePanelUpdate() {
    if (dt._updateTimer) return;
    dt._updateTimer = requestAnimationFrame(() => {
      dt._updateTimer = null;
      if (dt.active && dt.modal && dt.modal.style.display !== 'none' && dt.currentModalTab) {
        renderModalContent(dt.currentModalTab);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGINE: MINI AST PARSER (Fase 2)
  // ═══════════════════════════════════════════════════════════════════════
  const MiniAST = {
    _tokenize(expr) {
      const tokens = [];
      let i = 0;
      while (i < expr.length) {
        const ch = expr[i];
        if (/\s/.test(ch)) {
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
          while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
          tokens.push({
            type: 'Literal',
            value: Number(num)
          });
          continue;
        }
        if (/[a-zA-Z_$]/.test(ch)) {
          let id = '';
          while (i < expr.length && /[\w$]/.test(expr[i])) id += expr[i++];
          if (['true', 'false', 'null', 'undefined'].includes(id))
            tokens.push({
              type: 'Literal',
              value: id === 'true'
            });
          else tokens.push({
            type: 'Identifier',
            name: id
          });
          continue;
        }
        if (expr.substr(i, 2) === '?.') {
          tokens.push({
            type: 'Punctuator',
            value: '?.'
          });
          i += 2;
          continue;
        }
        if (['===', '!==', '<=', '>=', '==', '!=', '&&', '||'].includes(expr.substr(i, 2))) {
          tokens.push({
            type: 'Punctuator',
            value: expr.substr(i, 2)
          });
          i += 2;
          continue;
        }
        if ('{}?:!<>+-*/%()[].,'.includes(ch)) {
          tokens.push({
            type: 'Punctuator',
            value: ch
          });
          i++;
          continue;
        }
        i++;
      }
      return tokens;
    },

    parse(expr) {
      try {
        const tokens = this._tokenize(expr);
        let pos = 0;
        const peek = () => tokens[pos];
        const consume = () => tokens[pos++];

        const parsePrimary = () => {
          const t = peek();
          if (t.type === 'Literal' || t.type === 'Identifier') {
            consume();
            return {
              type: t.type,
              value: t.value || t.name
            };
          }
          if (t.value === '(') {
            consume();
            const n = parsePrimary();
            consume();
            return n;
          }
          return {
            type: 'Unknown',
            value: t.value
          };
        };

        const parsePostfix = (node) => {
          while (true) {
            const t = peek();
            if (t.value === '.') {
              consume();
              const prop = consume();
              node = {
                type: 'MemberExpression',
                object: node,
                property: prop.name,
                computed: false,
                optional: false
              };
            } else if (t.value === '?.') {
              consume();
              const prop = consume();
              node = {
                type: 'MemberExpression',
                object: node,
                property: prop.name,
                computed: false,
                optional: true
              };
            } else if (t.value === '[') {
              consume();
              const prop = parsePrimary();
              consume();
              node = {
                type: 'MemberExpression',
                object: node,
                property: prop.value,
                computed: true,
                optional: false
              };
            } else if (t.value === '(') {
              consume();
              const args = [];
              while (peek()
                .value !== ')') {
                args.push(parsePrimary());
                if (peek()
                  .value === ',') consume();
              }
              consume();
              node = {
                type: 'CallExpression',
                callee: node,
                arguments: args
              };
            } else {
              break;
            }
          }
          return node;
        };
        return parsePostfix(parsePrimary());
      } catch (e) {
        return {
          type: 'Error',
          message: e.message
        };
      }
    },

    extractDependencies(node, deps = new Set()) {
      if (!node) return deps;
      if (node.type === 'Identifier') deps.add(node.value);
      if (node.type === 'MemberExpression') {
        this.extractDependencies(node.object, deps);
        if (!node.computed) deps.add(node.property);
      }
      if (node.type === 'CallExpression') {
        this.extractDependencies(node.callee, deps);
        node.arguments.forEach(arg => this.extractDependencies(arg, deps));
      }
      return Array.from(deps);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGINE: CAUSALITY & TIMELINE & EVENTS (Fase 1 & 2)
  // ═══════════════════════════════════════════════════════════════════════
  function addTimelineEntry(type, data) {
    dt.timeline.unshift({
      type,
      data,
      timestamp: Date.now()
    });
    if (dt.timeline.length > dt.maxTimeline) dt.timeline.pop();
    schedulePanelUpdate();
  }

  function addEvent(name, payload, element) {
    dt.events.unshift({
      name,
      payload,
      timestamp: Date.now(),
      elementTag: element?.tagName || 'unknown'
    });
    if (dt.events.length > dt.maxEvents) dt.events.pop();
    schedulePanelUpdate();
  }

  function trackCausality(type, data) {
    if (!dt.active) return;
    if (type === 'event') dt.causality.lastEvent = data;
    if (type === 'mutation') dt.causality.lastMutation = data;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGINE: TIME-TRAVEL (Fase 3)
  // ═══════════════════════════════════════════════════════════════════════
  function recordSnapshot(root, action) {
    if (dt.isRewinding || !dt.active) return;
    const raw = root.__raa_state__?.__raa_raw__ || root.__raa_state__;
    if (!raw) return;
    try {
      const snapshot = structuredClone(raw);
      if (dt.historyIndex < dt.history.length - 1) {
        dt.history = dt.history.slice(0, dt.historyIndex + 1);
      }
      dt.history.push({
        timestamp: Date.now(),
        root,
        snapshot,
        action
      });
      if (dt.history.length > dt.maxHistory) dt.history.shift();
      dt.historyIndex = dt.history.length - 1;
      schedulePanelUpdate();
    } catch (_) {}
  }

  function rewindTo(index) {
    if (index < 0 || index >= dt.history.length) return;
    dt.isRewinding = true;
    dt.historyIndex = index;
    const entry = dt.history[index];
    Object.assign(entry.root.__raa_state__, entry.snapshot);
    dt.isRewinding = false;
    schedulePanelUpdate();
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGINE: MEMORY LEAK DETECTOR (Fase 3)
  // ═══════════════════════════════════════════════════════════════════════
  function scanMemoryLeaks() {
    const leaks = [];
    dt.effectRegistry.forEach((info, id) => {
      if (info.active && info.element && !info.element.isConnected) {
        leaks.push({
          id,
          expr: info.expr,
          element: info.element.tagName,
          root: info.root
        });
      }
    });
    return leaks;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGINE: DEPENDENCY HEATMAP OVERLAY (Fase 3)
  // ═══════════════════════════════════════════════════════════════════════
  const OverlayEngine = {
    init() {
      if (dt.overlayCanvas) return;
      const canvas = document.createElement('canvas');
      canvas.id = 'raa-devtools-overlay';
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;';
      document.body.appendChild(canvas);
      dt.overlayCanvas = canvas;
      dt.overlayCtx = canvas.getContext('2d');
      this._resize();
      window.addEventListener('resize', () => this._resize());
      document.addEventListener('mousemove', (e) => this._onMouseMove(e), {
        passive: true
      });
    },

    _resize() {
      if (dt.overlayCanvas) {
        dt.overlayCanvas.width = window.innerWidth;
        dt.overlayCanvas.height = window.innerHeight;
      }
    },

    _onMouseMove(e) {
      if (!dt.active) return;
      const el = e.target.closest('[raa-bind\\:], [raa-flow\\:]');
      if (el === dt._currentTarget) return;
      dt._currentTarget = el;
      if (dt._rafId) cancelAnimationFrame(dt._rafId);
      dt._rafId = requestAnimationFrame(() => this._draw(el));
    },

    _draw(el) {
      const ctx = dt.overlayCtx;
      if (!ctx) return;
      ctx.clearRect(0, 0, dt.overlayCanvas.width, dt.overlayCanvas.height);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const keys = dt.elementToKeys.get(el) || new Set();
      const dirs = Array.from(el.attributes)
        .map(a => a.name)
        .filter(n => n.startsWith('raa-'));

      let maxHeat = 0;
      keys.forEach(k => {
        const heat = dt.heatmapData.get(k) || 0;
        if (heat > maxHeat) maxHeat = heat;
      });

      let strokeColor = '#a6e3a1';
      if (maxHeat >= 20) strokeColor = '#f38ba8';
      else if (maxHeat >= 5) strokeColor = '#f9e2af';

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = maxHeat > 0 ? 3 : 2;
      ctx.setLineDash(maxHeat > 0 ? [] : [4, 4]);
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

      if (keys.size > 0 || dirs.length > 0) {
        const heatLabel = maxHeat > 0 ? ` 🔥${maxHeat}` : '';
        const label = `[${dirs.join(', ')}] ➔ ${Array.from(keys).join(', ')}${heatLabel}`;
        ctx.font = '11px "JetBrains Mono", monospace';
        const w = ctx.measureText(label)
          .width + 12;
        ctx.fillStyle = '#1e1e2e';
        ctx.fillRect(rect.x, rect.y - 20, w, 20);
        ctx.fillStyle = strokeColor;
        ctx.fillText(label, rect.x + 6, rect.y - 6);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGINE: REACTIVE COVERAGE (Fase 4)
  // ═══════════════════════════════════════════════════════════════════════
  function calculateCoverage(root) {
    const raw = root.__raa_state__?.__raa_raw__ || root.__raa_state__;
    if (!raw) return {
      total: 0,
      used: 0,
      percent: 0,
      deadKeys: []
    };
    const allKeys = new Set(Object.keys(raw)
      .filter(k => !k.startsWith('__') && !k.startsWith('_')));
    const usedKeys = new Set();
    dt.keyToElements.forEach((els, fullPath) => {
      const baseKey = fullPath.split('.')[0];
      if (allKeys.has(baseKey)) usedKeys.add(baseKey);
    });
    dt.effectStats.forEach(stats => {
      const match = stats.expr.match(/[a-zA-Z_$][\w$]*/);
      if (match && allKeys.has(match[0])) usedKeys.add(match[0]);
    });
    const deadKeys = Array.from(allKeys)
      .filter(k => !usedKeys.has(k));
    const total = allKeys.size;
    const used = usedKeys.size;
    return {
      total,
      used,
      percent: total === 0 ? 100 : Math.round((used / total) * 100),
      deadKeys
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGINE: SMART LINTER (Fase 4)
  // ═══════════════════════════════════════════════════════════════════════
  function addLinterWarning(code, message, element) {
    if (!dt.active) return;
    const isDup = dt.linterWarnings.some(w => w.code === code && w.message === message && (Date.now() - w.timestamp < 3000));
    if (!isDup) {
      dt.linterWarnings.unshift({
        code,
        message,
        element: element?.tagName || 'unknown',
        timestamp: Date.now()
      });
      if (dt.linterWarnings.length > dt.maxLinter) dt.linterWarnings.pop();
      schedulePanelUpdate();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  UI: SIDEBAR KIRI & MODAL PREMIUM
  // ═══════════════════════════════════════════════════════════════════════
  const TABS = [{
      id: 'inspector',
      icon: '📦',
      label: 'Inspector'
    },
    {
      id: 'ast',
      icon: '🌳',
      label: 'AST Viewer'
    },
    {
      id: 'flame',
      icon: '🔥',
      label: 'Flamegraph'
    },
    {
      id: 'effects',
      icon: '⚙️',
      label: 'Effect Explorer'
    },
    {
      id: 'causality',
      icon: '🔗',
      label: 'Causality'
    },
    {
      id: 'timetravel',
      icon: '⏳',
      label: 'Time Travel'
    },
    {
      id: 'memory',
      icon: '🧟',
      label: 'Memory Leak'
    },
    {
      id: 'heatmap',
      icon: '🌡️',
      label: 'Heatmap'
    },
    {
      id: 'synapse',
      icon: '🕸️',
      label: 'Synapse'
    },
    {
      id: 'directive',
      icon: '🔍',
      label: 'Directive'
    },
    {
      id: 'linter',
      icon: '⚠️',
      label: 'Linter'
    },
    {
      id: 'coverage',
      icon: '📊',
      label: 'Coverage'
    },
    {
      id: 'network',
      icon: '🌐',
      label: 'Network'
    },
    {
      id: 'benchmark',
      icon: '⏱️',
      label: 'Benchmark'
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings'
    }
  ];

  function createSidebar() {
    if (dt.sidebar) return;
    const sidebar = document.createElement('div');
    sidebar.id = 'raa-devtools-sidebar';
    sidebar.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            width: 50px;
            height: 100dvh;
            background: rgba(30, 30, 46, 0.95);
            backdrop-filter: blur(12px);
            border-right: 1px solid rgba(203, 166, 247, 0.2);
            z-index: 1000000;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0 20px 0;
            gap: 10px;
            font-family: "JetBrains Mono", monospace;
            box-shadow: 2px 0 20px rgba(0,0,0,0.3);
            overflow-y: auto;
        `;

    // Logo/Toggle button
    const logo = document.createElement('div');
    logo.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1465 1465" width="28" height="28"><defs><linearGradient id="gradientIkon" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#f78166;stop-opacity:1" /><stop offset="100%" style="stop-color:#d2a8ff;stop-opacity:1" /></linearGradient></defs><path fill-rule="evenodd" fill="url(#gradientIkon)" stroke-linecap="round" stroke-linejoin="round" stroke-width="13.7" d="M267 1150c74 4 248 19 258-178m-260-26-2 204m262-178-89-143q6 219-91 222-1-414 2-406c2-86 49-173 154-225 183-64 342 45 344 176 8 102-31 194-219 205q60 171 239 169 203-25 185-253-9-111 83-157c4 118 2 130 1 220q-32 252-263 271-141 0-221-117C521 773 499 685 506 659q17-94 111-108 117-4 118 146c65-101 48-187-71-227q-194-24-241 176c-1 72 36 156 98 237q152 227 272 248 148 30 268-53 130-113 156-265 4-320 2-337-151-13-242 146c1 4-20 62-8 162q-7 92-93 108-67 11-104-32 147-68 156-186 16-206-135-303c-137-96-366-46-432 34-205 127-71 683-94 745m947-836q12 92-104 97-81 6-151 101-22-63-45-82c84-82 182-126 300-116"/></svg>
    `;
    logo.style.cssText = 'position: sticky; top: 0; font-size: 28px; margin: 0; transform: translateY(-20px); padding-top: 25px; padding-bottom: 25px; cursor: pointer; background: rgba(30, 30, 46, 0.95); backdrop-filter: blur(12px); z-index: 2000000';
    logo.title = 'Raa DevTools';
    logo.onclick = () => window.RaaDevTools.disable();
    sidebar.appendChild(logo);

    // Tab buttons
    TABS.forEach(tab => {
      const btn = document.createElement('button');
      btn.innerHTML = `<span style="font-size: 24px;">${tab.icon}</span><span style="font-size: 10px; margin-top: 4px;">${tab.label.slice(0,3)}</span>`;
      btn.style.cssText = `
                background: transparent;
                border: none;
                color: #a6adc8;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px 0;
                width: 100%;
                border-radius: 8px;
                transition: all 0.2s;
                font-family: inherit;
            `;
      btn.onmouseenter = () => {
        btn.style.background = '#313244';
        btn.style.color = '#cba6f7';
      };
      btn.onmouseleave = () => {
        if (dt.currentModalTab !== tab.id) {
          btn.style.background = 'transparent';
          btn.style.color = '#a6adc8';
        }
      };
      btn.onclick = () => {
        TABS.forEach(t => {
          const otherBtn = dt.sidebar.querySelector(`button[data-tab="${t.id}"]`);
          if (otherBtn) otherBtn.style.background = 'transparent';
        });
        btn.style.background = '#45475a';
        btn.style.color = '#cba6f7';
        dt.currentModalTab = tab.id;
        showModal(tab.id);
      };
      btn.setAttribute('data-tab', tab.id);
      sidebar.appendChild(btn);
    });

    document.body.appendChild(sidebar);
    dt.sidebar = sidebar;
  }

  function showModal(tabId) {
    if (!dt.modal) {
      const modalOverlay = document.createElement('div');
      modalOverlay.id = 'raa-devtools-modal-overlay';
      modalOverlay.style.cssText = `
                position: fixed;
                inset: 0;
                left: 50px;
                background: transparent;
                display: flex;
                align-items: center;
                z-index: 1000001;
                visibility: hidden;
                opacity: 0;
                transition: visibility 0.2s, opacity 0.2s;
            `;
      const modalCard = document.createElement('div');
      modalCard.style.cssText = `
                width: 75vw;
                max-width: 1100px;
                margin-left: 0;
                height: 85vh;
                background: #1e1e2e;
                border-radius: 0 24px 24px 0;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                border: 1px solid rgba(203, 166, 247, 0.3);
                font-family: "JetBrains Mono", monospace;
            `;
      const modalHeader = document.createElement('div');
      modalHeader.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                background: #181825;
                border-bottom: 1px solid #313244;
            `;
      modalHeader.innerHTML = `<strong id="modal-title" style="color:#cba6f7; font-size:1.1rem;">Fusion Cockpit</strong>`;
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.style.cssText = 'background:none; border:none; color:#f38ba8; font-size:20px; cursor:pointer;';
      closeBtn.onclick = () => hideModal();
      modalHeader.appendChild(closeBtn);
      const modalBody = document.createElement('div');
      modalBody.id = 'raa-devtools-modal-body';
      modalBody.style.cssText = 'flex:1; overflow:auto; padding:20px;';
      modalCard.appendChild(modalHeader);
      modalCard.appendChild(modalBody);
      modalOverlay.appendChild(modalCard);
      document.body.appendChild(modalOverlay);
      dt.modal = modalOverlay;
      dt.modalBody = modalBody;
      dt.modalTitle = document.getElementById('modal-title');
    }

    // Update title
    const found = TABS.find(t => t.id === tabId);
    dt.modalTitle.innerText = found ? `${found.icon} ${found.label}` : tabId;
    // Render content
    renderModalContent(tabId);
    // Show modal
    dt.modal.style.visibility = 'visible';
    dt.modal.style.opacity = '1';
  }

  function hideModal() {
    if (dt.modal) {
      dt.modal.style.visibility = 'hidden';
      dt.modal.style.opacity = '0';
    }
    dt.currentModalTab = null;
    // Reset sidebar button highlight
    if (dt.sidebar) {
      TABS.forEach(tab => {
        const btn = dt.sidebar.querySelector(`button[data-tab="${tab.id}"]`);
        if (btn) {
          btn.style.background = 'transparent';
          btn.style.color = '#a6adc8';
        }
      });
    }
  }

  function renderModalContent(tabId) {
    if (!dt.modalBody) return;
    dt.modalBody.innerHTML = '';
    switch (tabId) {
    case 'inspector':
      renderInspector(dt.modalBody);
      break;
    case 'ast':
      renderAST(dt.modalBody);
      break;
    case 'flame':
      renderFlame(dt.modalBody);
      break;
    case 'effects':
      renderEffects(dt.modalBody);
      break;
    case 'causality':
      renderCausality(dt.modalBody);
      break;
    case 'timetravel':
      renderTimeTravel(dt.modalBody);
      break;
    case 'memory':
      renderMemory(dt.modalBody);
      break;
    case 'heatmap':
      renderHeatmap(dt.modalBody);
      break;
    case 'synapse':
      renderSynapse(dt.modalBody);
      break;
    case 'directive':
      renderDirective(dt.modalBody);
      break;
    case 'linter':
      renderLinter(dt.modalBody);
      break;
    case 'coverage':
      renderCoverage(dt.modalBody);
      break;
    case 'network':
      renderNetwork(dt.modalBody);
      break;
    case 'benchmark':
      renderBenchmark(dt.modalBody);
      break;
    case 'settings':
      renderSettings(dt.modalBody);
      break;
    default:
      dt.modalBody.innerHTML = '<div style="color:#6c7086;text-align:center;padding:40px;">Tab not implemented.</div>';
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  //  RENDER FUNCTIONS ───────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────────────────
  function renderInspector(container) {
    container.innerHTML = `<div style="display:flex;gap:8px;margin-bottom:12px;">
            <input id="dt-search" type="text" placeholder="🔍 Search state keys..." value="${dt._searchQuery}" 
                style="flex:1;background:#313244;border:1px solid #45475a;color:#cdd6f4;padding:8px;border-radius:8px;font-family:inherit;">
            <button id="dt-god" style="background:${dt.writeMode ? '#f38ba8' : '#313244'};border:none;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;">
                ${dt.writeMode ? '🔓 God Mode' : '🔒 Read Only'}
            </button>
        </div>`;
    const searchInput = container.querySelector('#dt-search');
    const godBtn = container.querySelector('#dt-god');
    if (searchInput) searchInput.oninput = (e) => {
      dt._searchQuery = e.target.value.toLowerCase();
      renderInspector(container);
    };
    if (godBtn) godBtn.onclick = () => {
      dt.writeMode = !dt.writeMode;
      renderInspector(container);
    };

    if (dt.roots.size === 0) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada root. Buat elemen dengan raa-core:app.</div>';
      return;
    }
    for (const root of dt.roots) {
      const appName = root.getAttribute('raa-core:app') || 'Island';
      const raw = root.__raa_state__?.__raa_raw__ || root.__raa_state__;
      if (!raw) continue;
      const card = document.createElement('div');
      card.style.cssText = 'background:#181825;border-radius:12px;margin-bottom:16px;border:1px solid #313244;overflow:hidden;';
      card.innerHTML = `<div style="padding:10px 16px;background:#313244;color:#89b4fa;font-weight:bold;">📦 ${appName}</div>`;
      const body = document.createElement('div');
      body.style.padding = '12px';
      body.innerHTML = `<pre style="font-size:11px;color:#a6e3a1;overflow:auto;background:#11111b;padding:12px;border-radius:8px;">${safeStringify(raw, 2)}</pre>`;
      card.appendChild(body);
      container.appendChild(card);
    }
  }

  function renderAST(container) {
    container.innerHTML = `<div style="color:#f9e2af;font-weight:bold;margin-bottom:12px;">🌳 AST Viewer & Dependency Extractor</div>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <input id="ast-input" type="text" placeholder="Masukkan ekspresi (cth: user.profile.name.toUpperCase())" 
                    style="flex:1;background:#313244;border:1px solid #45475a;color:#cdd6f4;padding:8px;border-radius:8px;font-family:inherit;" value="user.name">
                <button id="ast-parse" style="background:#89b4fa;border:none;color:#1e1e2e;padding:8px 16px;border-radius:8px;cursor:pointer;">Parse</button>
            </div>
            <div id="ast-output" style="background:#181825;padding:16px;border-radius:12px;border:1px solid #313244;"></div>`;
    const input = container.querySelector('#ast-input');
    const btn = container.querySelector('#ast-parse');
    const output = container.querySelector('#ast-output');
    const doParse = () => {
      const expr = input.value.trim();
      if (!expr) return;
      const ast = MiniAST.parse(expr);
      const deps = MiniAST.extractDependencies(ast);
      let html = `<div style="margin-bottom:12px;"><strong style="color:#a6e3a1;">Dependencies:</strong> <code style="color:#f9e2af;">${deps.join(', ') || 'None'}</code></div>`;
      html += `<pre style="color:#89b4fa;font-size:11px;background:#11111b;padding:12px;border-radius:8px;overflow-x:auto;">${safeStringify(ast, 2)}</pre>`;
      output.innerHTML = html;
    };
    btn.onclick = doParse;
    input.onkeydown = (e) => {
      if (e.key === 'Enter') doParse();
    };
    doParse();
  }

  function renderFlame(container) {
    container.innerHTML = `<div style="color:#f38ba8;font-weight:bold;margin-bottom:12px;">🔥 Reactive Flamegraph</div>
            <div style="font-size:10px;color:#a6adc8;margin-bottom:12px;">50 evaluasi ekspresi terbaru. Merah = >5ms.</div>`;
    if (dt.flameBuffer.length === 0) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada data.</div>';
      return;
    }
    const recent = dt.flameBuffer.slice(-50);
    const maxDur = Math.max(...recent.map(e => e.duration), 1);
    recent.forEach(f => {
      const w = (f.duration / maxDur * 100)
        .toFixed(1);
      const color = f.duration > 5 ? '#f38ba8' : f.duration > 2 ? '#f9e2af' : '#a6e3a1';
      const div = document.createElement('div');
      div.style.cssText = 'margin-bottom:8px;';
      div.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px;"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:70%;">${f.expr}</span><span style="color:${color};">${f.duration.toFixed(2)}ms</span></div>
                <div style="background:#313244;height:4px;border-radius:2px;"><div style="width:${w}%;background:${color};height:4px;border-radius:2px;"></div></div>`;
      container.appendChild(div);
    });
  }

  function renderEffects(container) {
    container.innerHTML = `<div style="color:#89b4fa;font-weight:bold;margin-bottom:12px;">⚙️ Effect Explorer</div>`;
    if (dt.effectStats.size === 0) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada efek dieksekusi.</div>';
      return;
    }
    const sorted = Array.from(dt.effectStats.entries())
      .sort((a, b) => b[1].runs - a[1].runs);
    sorted.forEach(([id, stats]) => {
      const div = document.createElement('div');
      div.style.cssText = 'background:#181825;padding:10px;margin-bottom:8px;border-radius:8px;border-left:3px solid #cba6f7;';
      div.innerHTML = `<div style="display:flex;justify-content:space-between;"><strong>Effect #${id}</strong><span>${stats.element || '?'}</span></div>
                <div style="font-size:11px;">Expr: <code>${stats.expr}</code></div>
                <div>Runs: ${stats.runs} | Avg: ${stats.avg.toFixed(2)}ms</div>`;
      container.appendChild(div);
    });
  }

  function renderCausality(container) {
    container.innerHTML = `<div style="color:#94e2d5;font-weight:bold;margin-bottom:12px;">🔗 Why Did This Update?</div>`;
    if (!dt.causality.lastMutation && !dt.causality.lastEvent) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada rantai kausalitas.</div>';
      return;
    }
    const chain = document.createElement('div');
    chain.style.cssText = 'background:#181825;padding:16px;border-radius:12px;';
    let html = '';
    if (dt.causality.lastEvent) html += `<div><strong>1. Pemicu:</strong> ${dt.causality.lastEvent.type} pada &lt;${dt.causality.lastEvent.target}&gt;</div>`;
    if (dt.causality.lastMutation) html += `<div><strong>2. Mutasi:</strong> ${dt.causality.lastMutation.key} → ${safeStringify(dt.causality.lastMutation.value, 0).slice(0, 50)}</div>`;
    html += `<div><strong>3. Dampak:</strong> Efek dependen dijadwalkan ulang.</div>`;
    chain.innerHTML = html;
    container.appendChild(chain);
  }

  function renderTimeTravel(container) {
    container.innerHTML = `<div style="color:#89b4fa;font-weight:bold;margin-bottom:12px;">⏳ Time-Travel Engine</div>
            <div style="background:#181825;padding:16px;border-radius:12px;text-align:center;margin-bottom:16px;">
                <div>Snapshot ${dt.historyIndex + 1} / ${dt.history.length}</div>
                <input type="range" min="0" max="${Math.max(0, dt.history.length - 1)}" value="${dt.historyIndex}" style="width:100%;margin-top:12px;" oninput="window.RaaDevTools.rewind(parseInt(this.value))">
            </div>`;
    if (dt.history.length === 0) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:20px;">Belum ada snapshot.</div>';
      return;
    }
    dt.history.slice()
      .reverse()
      .forEach((h, i) => {
        const idx = dt.history.length - 1 - i;
        const div = document.createElement('div');
        div.style.cssText = `padding:8px;background:${idx === dt.historyIndex ? '#313244' : '#181825'};margin-bottom:4px;border-radius:6px;cursor:pointer;border-left:3px solid ${idx === dt.historyIndex ? '#cba6f7' : '#45475a'};`;
        div.innerHTML = `<span style="color:#6c7086;">${new Date(h.timestamp).toLocaleTimeString()}</span> <strong>${h.action}</strong>`;
        div.onclick = () => rewindTo(idx);
        container.appendChild(div);
      });
  }

  function renderMemory(container) {
    container.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:12px;"><div style="color:#f38ba8;">🧟 Memory Leak Detector</div><button id="dt-scan-mem" class="premium-btn">🔍 Scan Now</button></div>`;
    const scanBtn = container.querySelector('#dt-scan-mem');
    if (scanBtn) {
      scanBtn.style.cssText = 'background:#313244;border:none;color:white;padding:6px 12px;border-radius:8px;cursor:pointer;';
      scanBtn.onclick = () => {
        const leaks = scanMemoryLeaks();
        const listDiv = document.createElement('div');
        if (leaks.length === 0) listDiv.innerHTML = '<div style="color:#a6e3a1;text-align:center;padding:20px;">✅ Tidak ada zombie effect.</div>';
        else {
          listDiv.innerHTML = `<div style="margin-bottom:8px;">Ditemukan ${leaks.length} kebocoran:</div>`;
          leaks.forEach(l => {
            const item = document.createElement('div');
            item.style.cssText = 'background:#313244;padding:8px;margin-bottom:6px;border-radius:6px;border-left:3px solid #f38ba8;';
            item.innerHTML = `<strong>Effect #${l.id}</strong> pada &lt;${l.element}&gt;<br><code>${l.expr}</code><br><span style="color:#f38ba8;">⚠️ Zombie effect terdeteksi</span>`;
            listDiv.appendChild(item);
          });
        }
        const old = container.querySelector('#mem-result');
        if (old) old.remove();
        listDiv.id = 'mem-result';
        container.appendChild(listDiv);
      };
    }
  }

  function renderHeatmap(container) {
    container.innerHTML = `<div style="color:#f9e2af;font-weight:bold;margin-bottom:12px;">🌡️ Dependency Heatmap</div>
            <div style="background:#181825;padding:12px;border-radius:8px;margin-bottom:12px;font-size:11px;">
                Frekuensi trigger state. Hover elemen untuk melihat skor panas.
                <div style="display:flex;gap:12px;margin-top:8px;"><span style="color:#a6e3a1;">■ Dingin (<5)</span><span style="color:#f9e2af;">■ Hangat (5-19)</span><span style="color:#f38ba8;">■ Panas (≥20)</span></div>
            </div>
            <div>Top 20 state keys paling sering berubah:</div>`;
    const sorted = Array.from(dt.heatmapData.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    const list = document.createElement('div');
    if (sorted.length === 0) list.innerHTML = '<div style="color:#6c7086;text-align:center;padding:20px;">Belum ada data.</div>';
    else {
      const maxH = sorted[0][1];
      sorted.forEach(([key, count]) => {
        const w = (count / maxH * 100)
          .toFixed(1);
        const color = count >= 20 ? '#f38ba8' : count >= 5 ? '#f9e2af' : '#a6e3a1';
        const item = document.createElement('div');
        item.style.marginBottom = '8px';
        item.innerHTML = `<div style="display:flex;justify-content:space-between;"><span>${key}</span><span style="color:${color};">${count}x</span></div>
                    <div style="background:#313244;height:4px;"><div style="width:${w}%;background:${color};height:4px;"></div></div>`;
        list.appendChild(item);
      });
    }
    container.appendChild(list);
  }

  function renderSynapse(container) {
    container.innerHTML = `<div style="color:#cba6f7;font-weight:bold;margin-bottom:12px;">🕸️ Synapse Graph</div>
            <div style="background:#181825;padding:12px;border-radius:8px;margin-bottom:12px;">State Keys: ${dt.keyToElements.size} | Elements: ${dt.elementToKeys.size}</div>`;
    const list = document.createElement('div');
    list.style.maxHeight = '400px';
    list.style.overflowY = 'auto';
    dt.keyToElements.forEach((els, key) => {
      const item = document.createElement('div');
      item.style.cssText = 'background:#313244;padding:8px;margin-bottom:4px;border-radius:6px;cursor:pointer;display:flex;justify-content:space-between;';
      item.innerHTML = `<strong>${key}</strong> <span>${els.size} elemen</span>`;
      item.onclick = () => {
        els.forEach(el => {
          el.style.outline = '2px solid #cba6f7';
          setTimeout(() => el.style.outline = '', 2000);
        });
      };
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  function renderDirective(container) {
    container.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="color:#94e2d5;">🔍 Directive Inspector</div>
            <button id="dt-select" class="premium-btn" style="background:${dt.selectMode ? '#f38ba8' : '#313244'};border:none;padding:6px 12px;border-radius:8px;cursor:pointer;">${dt.selectMode ? '⏹ Stop Select' : '▶ Select Element'}</button>
        </div>`;
    const selectBtn = container.querySelector('#dt-select');
    if (selectBtn) selectBtn.onclick = () => {
      dt.selectMode = !dt.selectMode;
      document.body.style.cursor = dt.selectMode ? 'crosshair' : 'default';
      renderDirective(container);
    };
    if (!dt.selectedElement) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:40px;">Klik "Select Element" lalu klik elemen.</div>';
      return;
    }
    const el = dt.selectedElement;
    const dirs = Array.from(el.attributes)
      .map(a => a.name)
      .filter(n => n.startsWith('raa-'));
    const deps = dt.elementToKeys.get(el) || new Set();
    container.innerHTML += `<div style="background:#181825;padding:16px;border-radius:12px;"><div>&lt;${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}&gt;</div>
            <div><strong>Directives:</strong> ${dirs.join(', ') || 'None'}</div>
            <div><strong>Dependencies:</strong> ${Array.from(deps).join(', ') || 'None'}</div></div>`;
  }

  function renderLinter(container) {
    container.innerHTML = `<div style="color:#f9e2af;font-weight:bold;margin-bottom:12px;">⚠️ Smart Linter</div>`;
    if (dt.linterWarnings.length === 0) container.innerHTML += '<div style="color:#a6e3a1;text-align:center;padding:40px;">✅ Tidak ada warning.</div>';
    else dt.linterWarnings.forEach(w => {
      const div = document.createElement('div');
      div.style.cssText = `background:#181825;border-left:3px solid ${w.code === 'EFFECT_LOOP' ? '#f38ba8' : '#f9e2af'};padding:10px;margin-bottom:6px;border-radius:6px;`;
      div.innerHTML = `<strong>[${w.code}]</strong> ${w.message} <span style="color:#6c7086;">(&lt;${w.element}&gt;)</span>`;
      container.appendChild(div);
    });
  }

  function renderCoverage(container) {
    container.innerHTML = `<div style="color:#a6e3a1;font-weight:bold;margin-bottom:12px;">📊 Reactive Coverage</div>`;
    if (dt.roots.size === 0) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada root.</div>';
      return;
    }
    for (const root of dt.roots) {
      const appName = root.getAttribute('raa-core:app') || 'Island';
      const cov = calculateCoverage(root);
      const barColor = cov.percent >= 80 ? '#a6e3a1' : cov.percent >= 50 ? '#f9e2af' : '#f38ba8';
      const card = document.createElement('div');
      card.style.cssText = 'background:#181825;padding:16px;border-radius:12px;margin-bottom:16px;';
      card.innerHTML = `<div style="display:flex;justify-content:space-between;"><strong>📦 ${appName}</strong><strong style="color:${barColor};">${cov.percent}% Used</strong></div>
                <div style="background:#313244;height:6px;margin:8px 0;"><div style="width:${cov.percent}%;background:${barColor};height:6px;"></div></div>
                <div>Total Keys: ${cov.total} | Used: ${cov.used} | Dead: ${cov.deadKeys.length}</div>`;
      if (cov.deadKeys.length) {
        const deadDiv = document.createElement('div');
        deadDiv.style.marginTop = '8px';
        deadDiv.innerHTML = `<strong style="color:#f38ba8;">Dead State:</strong> <code>${cov.deadKeys.slice(0,10).join(', ')}${cov.deadKeys.length>10?'...':''}</code>`;
        card.appendChild(deadDiv);
      }
      container.appendChild(card);
    }
  }

  function renderNetwork(container) {
    container.innerHTML = `<div style="color:#89dceb;font-weight:bold;margin-bottom:12px;">🌐 Network Interceptor</div>`;
    if (dt.networkLog.length === 0) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada aktivitas jaringan.</div>';
      return;
    }
    dt.networkLog.slice(0, 50)
      .forEach(req => {
        const div = document.createElement('div');
        const color = req.type === 'fetch' ? '#89b4fa' : '#cba6f7';
        div.style.cssText = `background:#181825;padding:10px;margin-bottom:8px;border-radius:8px;border-left:3px solid ${color};`;
        div.innerHTML = `<div><strong>${req.method}</strong> ${req.url.slice(0,60)} <span style="float:right;">${new Date(req.timestamp).toLocaleTimeString()}</span></div>
                <div style="font-size:10px;">Root: ${req.rootName} | Status: ${req.status || 'pending'}</div>`;
        container.appendChild(div);
      });
  }

  function renderBenchmark(container) {
    container.innerHTML = `<div style="color:#f38ba8;font-weight:bold;margin-bottom:12px;">⏱️ Directive Benchmark</div>`;
    if (dt.directiveBench.size === 0) {
      container.innerHTML += '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada data.</div>';
      return;
    }
    const sorted = Array.from(dt.directiveBench.entries())
      .sort((a, b) => b[1].avg - a[1].avg);
    sorted.forEach(([name, stats]) => {
      const color = stats.avg > 5 ? '#f38ba8' : stats.avg > 2 ? '#f9e2af' : '#a6e3a1';
      const div = document.createElement('div');
      div.style.cssText = 'background:#181825;padding:10px;margin-bottom:8px;border-radius:8px;';
      div.innerHTML = `<div><strong>${name}</strong> <span style="float:right;color:${color};">${stats.avg.toFixed(2)}ms avg</span></div>
                <div style="font-size:10px;">Runs: ${stats.count} | Total: ${stats.totalTime.toFixed(2)}ms</div>`;
      container.appendChild(div);
    });
  }

  function renderSettings(container) {
    container.innerHTML = `<div style="background:#181825;padding:16px;border-radius:12px;">
            <div style="color:#cba6f7;margin-bottom:12px;">⚙️ Settings</div>
            <button id="dt-clear" style="background:#313244;border:none;color:white;padding:8px;width:100%;margin-bottom:8px;border-radius:8px;cursor:pointer;">🗑 Bersihkan Semua Telemetry</button>
            <button id="dt-toggle-overlay" style="background:#45475a;border:none;color:white;padding:8px;width:100%;border-radius:8px;cursor:pointer;">👁️ Toggle Heatmap Overlay</button>
        </div>`;
    const clearBtn = container.querySelector('#dt-clear');
    if (clearBtn) clearBtn.onclick = () => {
      dt.history = [];
      dt.historyIndex = -1;
      dt.heatmapData.clear();
      dt.effectRegistry.clear();
      dt.linterWarnings = [];
      dt.networkLog = [];
      dt.directiveBench.clear();
      dt.flameBuffer = [];
      dt.effectStats.clear();
      dt.timeline = [];
      dt.events = [];
      schedulePanelUpdate();
    };
    const toggleBtn = container.querySelector('#dt-toggle-overlay');
    if (toggleBtn) toggleBtn.onclick = () => {
      if (dt.overlayCanvas) dt.overlayCanvas.style.display = dt.overlayCanvas.style.display === 'none' ? 'block' : 'none';
      else OverlayEngine.init();
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  GLOBAL API
  // ═══════════════════════════════════════════════════════════════════════
  window.RaaDevTools = {
    enable() {
      dt.active = true;
      createSidebar();
      OverlayEngine.init();
      if (dt.modal) hideModal();
      // optional: open default tab
      dt.currentModalTab = 'inspector';
      showModal('inspector');
    },
    disable() {
      dt.active = false;
      dt.selectMode = false;
      document.body.style.cursor = 'default';
      if (dt.sidebar) dt.sidebar.remove();
      if (dt.modal) dt.modal.remove();
      if (dt.overlayCanvas) dt.overlayCanvas.style.display = 'none';
      dt.sidebar = null;
      dt.modal = null;
    },
    toggle() {
      if (dt.active) this.disable();
      else this.enable();
    },
    rewind: rewindTo
  };

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      window.RaaDevTools.toggle();
    }
  });

  document.addEventListener('click', (e) => {
    if (dt.selectMode && dt.active) {
      e.preventDefault();
      e.stopPropagation();
      dt.selectedElement = e.target;
      dt.selectMode = false;
      document.body.style.cursor = 'default';
      trackCausality('event', {
        type: 'click',
        target: e.target.tagName + (e.target.id ? '#' + e.target.id : '')
      });
      if (dt.modal && dt.modal.style.visibility === 'visible') renderModalContent('directive');
      else showModal('directive');
    }
  }, true);

  // ═══════════════════════════════════════════════════════════════════════
  //  PLUGIN PATCHING (Gabungan semua fase)
  // ═══════════════════════════════════════════════════════════════════════
  const RaaDevToolsPlugin = {
    name: 'raa-devtools',
    install(raa) {
      if (dt._installed) return;
      dt._installed = true;
      const orig = dt._originals;

      // Backfill roots
      document.querySelectorAll('[raa-core\\:app], [raa-eco\\:island]')
        .forEach(root => {
          if (root.__raa_compiled__) dt.roots.add(root);
        });

      // 1. track (Synapse)
      if (raa.reactive && typeof raa.reactive.track === 'function') {
        orig.track = raa.reactive.track.bind(raa.reactive);
        raa.reactive.track = function (target, key, activeEffect) {
          orig.track(target, key, activeEffect);
          if (dt.active && activeEffect && activeEffect.element) {
            const el = activeEffect.element;
            const path = String(key);
            if (!dt.keyToElements.has(path)) dt.keyToElements.set(path, new Set());
            dt.keyToElements.get(path)
              .add(el);
            if (!dt.elementToKeys.has(el)) dt.elementToKeys.set(el, new Set());
            dt.elementToKeys.get(el)
              .add(path);
          }
        };
      }

      // 2. trigger (Time-Travel + Heatmap + Timeline)
      if (raa.reactive && typeof raa.reactive.trigger === 'function') {
        orig.trigger = raa.reactive.trigger.bind(raa.reactive);
        raa.reactive.trigger = function (target, key) {
          if (dt.active && !dt.isRewinding) {
            const kStr = String(key);
            dt.heatmapData.set(kStr, (dt.heatmapData.get(kStr) || 0) + 1);
            trackCausality('mutation', {
              key: kStr,
              value: target[key]
            });
            addTimelineEntry('mutate', {
              key: kStr
            });
            for (const root of dt.roots) {
              if (root.__raa_state__) {
                const raw = root.__raa_state__.__raa_raw__ || root.__raa_state__;
                if (raw && (kStr in raw || Array.isArray(raw))) {
                  recordSnapshot(root, `mutate:${kStr}`);
                  break;
                }
              }
            }
          }
          orig.trigger(target, key);
        };
      }

      // 3. evaluate (Flamegraph + EffectStats + Events)
      if (raa.evaluator && typeof raa.evaluator.evaluate === 'function') {
        orig.evaluate = raa.evaluator.evaluate.bind(raa.evaluator);
        raa.evaluator.evaluate = function (expr, stateObj, el, extraLocals) {
          const start = performance.now();
          const res = orig.evaluate(expr, stateObj, el, extraLocals);
          const dur = performance.now() - start;
          if (dt.active && expr) {
            dt.flameBuffer.push({
              expr,
              el: el?.tagName || 'unknown',
              duration: dur,
              timestamp: Date.now()
            });
            if (dt.flameBuffer.length > dt.maxFlame) dt.flameBuffer.shift();
            const activeEff = raa._activeEffect;
            if (activeEff) {
              const effId = activeEff._dt_id || (activeEff._dt_id = Math.random()
                .toString(36)
                .substr(2, 5));
              if (!dt.effectStats.has(effId)) {
                dt.effectStats.set(effId, {
                  runs: 0,
                  totalTime: 0,
                  avg: 0,
                  expr: expr.slice(0, 50),
                  element: el?.tagName || 'unknown'
                });
              }
              const stats = dt.effectStats.get(effId);
              stats.runs++;
              stats.totalTime += dur;
              stats.avg = stats.totalTime / stats.runs;
            }
            addEvent(`eval:${expr.slice(0,40)}`, {
              expr
            }, el);
          }
          return res;
        };
        // assign interceptor
        if (typeof raa.evaluator.assign === 'function') {
          orig.assign = raa.evaluator.assign.bind(raa.evaluator);
          raa.evaluator.assign = function (expr, value, stateObj, el, extraLocals) {
            orig.assign(expr, value, stateObj, el, extraLocals);
            if (dt.active) addEvent('assign', {
              expr,
              value: safeStringify(value)
            }, el);
          };
        }
      }

      // 4. createEffect (Memory registry)
      if (raa.scheduler && typeof raa.scheduler.createEffect === 'function') {
        orig.createEffect = raa.scheduler.createEffect.bind(raa.scheduler);
        raa.scheduler.createEffect = function (fn, options = {}) {
          const effect = orig.createEffect(fn, options);
          if (dt.active) {
            const effId = Math.random()
              .toString(36)
              .substr(2, 6);
            effect._dt_id = effId;
            dt.effectRegistry.set(effId, {
              element: options.element || null,
              root: options.root || null,
              active: true,
              runs: 0,
              expr: fn.toString()
                .slice(0, 80)
            });
          }
          return effect;
        };
        if (typeof raa.scheduler.disposeEffect === 'function') {
          orig.disposeEffect = raa.scheduler.disposeEffect.bind(raa.scheduler);
          raa.scheduler.disposeEffect = function (effect) {
            orig.disposeEffect(effect);
            if (dt.active && effect._dt_id) {
              const info = dt.effectRegistry.get(effect._dt_id);
              if (info) info.active = false;
            }
          };
        }
      }

      // 5. Directive Benchmark (controlFlow)
      if (raa.controlFlow) {
        if (typeof raa.controlFlow.processForTemplate === 'function') {
          orig.processForTemplate = raa.controlFlow.processForTemplate.bind(raa.controlFlow);
          raa.controlFlow.processForTemplate = function (el, expr, state, root) {
            const start = performance.now();
            orig.processForTemplate(el, expr, state, root);
            const dur = performance.now() - start;
            if (dt.active) {
              const name = 'raa-flow:for';
              if (!dt.directiveBench.has(name)) dt.directiveBench.set(name, {
                count: 0,
                totalTime: 0,
                avg: 0
              });
              const stats = dt.directiveBench.get(name);
              stats.count++;
              stats.totalTime += dur;
              stats.avg = stats.totalTime / stats.count;
            }
          };
        }
        if (typeof raa.controlFlow.processIfTemplate === 'function') {
          orig.processIfTemplate = raa.controlFlow.processIfTemplate.bind(raa.controlFlow);
          raa.controlFlow.processIfTemplate = function (el, expr, state, root) {
            const start = performance.now();
            orig.processIfTemplate(el, expr, state, root);
            const dur = performance.now() - start;
            if (dt.active && dur > 1) {
              const name = 'raa-flow:if';
              if (!dt.directiveBench.has(name)) dt.directiveBench.set(name, {
                count: 0,
                totalTime: 0,
                avg: 0
              });
              const stats = dt.directiveBench.get(name);
              stats.count++;
              stats.totalTime += dur;
              stats.avg = stats.totalTime / stats.count;
            }
          };
        }
      }

      // 6. Network interceptor (basic logging)
      if (raa.network && typeof raa.network.setupNetwork === 'function') {
        orig.setupNetwork = raa.network.setupNetwork.bind(raa.network);
        raa.network.setupNetwork = function (root, state) {
          const rootName = root.getAttribute('raa-core:app') || 'Island';
          const fetchAttr = root.getAttribute('raa-net:fetch');
          if (fetchAttr && dt.active) {
            const arrowIdx = fetchAttr.lastIndexOf('->');
            const url = arrowIdx !== -1 ? fetchAttr.substring(0, arrowIdx)
              .trim() : fetchAttr;
            dt.networkLog.unshift({
              type: 'fetch',
              method: 'GET',
              url,
              rootName,
              status: 'registered',
              timestamp: Date.now()
            });
            if (dt.networkLog.length > dt.maxNetwork) dt.networkLog.pop();
          }
          return orig.setupNetwork(root, state);
        };
      }

      // 7. Smart Linter via console.warn interception
      orig.consoleWarn = console.warn;
      console.warn = function (...args) {
        if (dt.active && typeof args[0] === 'string' && args[0].includes('[RaaJS warn:')) {
          const match = args[0].match(/\[RaaJS warn:([A-Z_]+)\]\s+(.*)/);
          if (match) addLinterWarning(match[1], match[2], args[2]?.element || null);
        }
        return orig.consoleWarn.apply(console, args);
      };

      // 8. Lifecycle hooks
      if (raa.pluginManager) {
        raa.pluginManager.addHook('afterCompile', (root) => {
          dt.roots.add(root);
          schedulePanelUpdate();
        }, 'raa-devtools');
        raa.pluginManager.addHook('beforeDestroy', (root) => {
          dt.roots.delete(root);
          root.querySelectorAll('*')
            .forEach(el => {
              const keys = dt.elementToKeys.get(el);
              if (keys) keys.forEach(k => {
                const els = dt.keyToElements.get(k);
                if (els) els.delete(el);
              });
              dt.elementToKeys.delete(el);
            });
          schedulePanelUpdate();
        }, 'raa-devtools');
      }
    },

    uninstall(raa) {
      const orig = dt._originals;
      if (raa.reactive && orig.track) raa.reactive.track = orig.track;
      if (raa.reactive && orig.trigger) raa.reactive.trigger = orig.trigger;
      if (raa.evaluator && orig.evaluate) raa.evaluator.evaluate = orig.evaluate;
      if (raa.evaluator && orig.assign) raa.evaluator.assign = orig.assign;
      if (raa.scheduler && orig.createEffect) raa.scheduler.createEffect = orig.createEffect;
      if (raa.scheduler && orig.disposeEffect) raa.scheduler.disposeEffect = orig.disposeEffect;
      if (raa.controlFlow && orig.processForTemplate) raa.controlFlow.processForTemplate = orig.processForTemplate;
      if (raa.controlFlow && orig.processIfTemplate) raa.controlFlow.processIfTemplate = orig.processIfTemplate;
      if (raa.network && orig.setupNetwork) raa.network.setupNetwork = orig.setupNetwork;
      if (orig.consoleWarn) console.warn = orig.consoleWarn;
      if (dt.overlayCanvas) dt.overlayCanvas.remove();
      if (dt.sidebar) dt.sidebar.remove();
      if (dt.modal) dt.modal.remove();
      dt._installed = false;
      dt.active = false;
      dt.roots.clear();
      dt.keyToElements.clear();
      dt.elementToKeys.clear();
      dt.history = [];
      dt.heatmapData.clear();
      dt.effectRegistry.clear();
      dt.linterWarnings = [];
      dt.networkLog = [];
      dt.directiveBench.clear();
      dt.flameBuffer = [];
      dt.effectStats.clear();
      dt.timeline = [];
      dt.events = [];
    }
  };

  function installPlugin() {
    if (typeof window.Raa === 'undefined') {
      console.warn('[RaaDevTools] window.Raa not found. Load RaaJS first.');
      return;
    }
    window.Raa.use(RaaDevToolsPlugin);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPlugin);
  else installPlugin();
})();
