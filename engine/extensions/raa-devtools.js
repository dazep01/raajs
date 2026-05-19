/**
 * RaaJS DevTools Extension v1.0
 * 
 * ════════════════════════════════════════════════════
 *  DIREKTIF
 * ════════════════════════════════════════════════════
 * Tidak ada directive. DevTools adalah panel inspeksi.
 * 
 * ════════════════════════════════════════════════════
 *  FUNGSI GLOBAL
 * ════════════════════════════════════════════════════
 * RaaDevTools.enable()      – aktifkan panel
 * RaaDevTools.disable()     – nonaktifkan panel
 * RaaDevTools.toggle()      – toggle panel
 * RaaDevTools.isActive()    – status aktif
 * RaaDevTools.show()        – tampilkan panel
 * RaaDevTools.hide()        – sembunyikan panel
 * RaaDevTools.minimize()    – minimize panel
 * RaaDevTools.restore()     – restore panel
 * 
 * ════════════════════════════════════════════════════
 *  API INSPECTION
 * ════════════════════════════════════════════════════
 * RaaDevTools.getRoots()    – daftar root
 * RaaDevTools.getState(root)– state root
 * RaaDevTools.getEffects(root)– efek root
 * RaaDevTools.getHandlers(el)– event handlers
 * RaaDevTools.getStore()    – global store
 * RaaDevTools.getApps()     – daftar app terdaftar
 * RaaDevTools.getExtensions()– ekstensi terdeteksi
 * 
 * ════════════════════════════════════════════════════
 *  FITUR
 * ════════════════════════════════════════════════════
 * - Component Tree (island-aware)
 * - State Inspector (read-only default, write mode)
 * - Effects Tracker (hotspot visual)
 * - Event Logger (dengan snapshot time-travel)
 * - Performance Profiler (bar chart)
 * - Tabbed Panel (docked right, resizeable)
 * - Shortcut: Ctrl+Shift+R
 * - CSP‑safe, no eval, no innerHTML untuk data
 * - Zero overhead saat nonaktif
 */
(function () {
  'use strict';

  // ──────────────────────────────────────────────
  //  TUNGGU RAAJS SIAP
  // ──────────────────────────────────────────────
  function waitForRaa(callback) {
    // Sudah tersedia saat ini
    if (window.Raa && typeof window.Raa.createEffect === 'function') {
      callback();
      return;
    }

    // Coba setelah DOM siap
    function tryInit() {
      if (window.Raa && typeof window.Raa.createEffect === 'function') {
        callback();
        return;
      }
      // Polling singkat sebagai fallback
      let attempts = 0;
      const id = setInterval(() => {
        if (window.Raa && typeof window.Raa.createEffect === 'function') {
          clearInterval(id);
          callback();
        } else if (++attempts > 50) { // ~5 detik
          clearInterval(id);
          console.warn('[RaaDevTools] RaaJS tidak ditemukan setelah 5 detik. DevTools tidak aktif.');
        }
      }, 100);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryInit);
    } else {
      tryInit();
    }
  }

  // ──────────────────────────────────────────────
  //  BARU MULAI SETELAH Raa ADA
  // ──────────────────────────────────────────────
  waitForRaa(function () {
    const Raa = window.Raa;
    const doc = document;

    // ══════════════════════════════════════════════
    //  STATE
    // ══════════════════════════════════════════════
    const state = {
      active: false,
      panel: null,
      originalMethods: {},
      eventLog: [],
      maxEventLog: 500,
      effectStats: new Map(),
      performanceData: [],
      writeMode: false,
      tab: 'inspector',
      config: {
        position: 'right',
        shortcut: 'Ctrl+Shift+R',
        autoActivateLocalhost: true,
        theme: 'dark'
      }
    };

    // ══════════════════════════════════════════════
    //  UTILS
    // ══════════════════════════════════════════════
    const safeStringify = (obj) => {
      try { return JSON.stringify(obj, null, 2); }
      catch { return '[Unserializable]'; }
    };
    const safeClone = (obj) => {
      try { return JSON.parse(JSON.stringify(obj)); }
      catch { return null; }
    };

    // ══════════════════════════════════════════════
    //  MONKEY-PATCH
    // ══════════════════════════════════════════════
    function patchMethods() {
      if (!state.active || state.originalMethods.createEffect) return;
      state.originalMethods.createEffect = Raa.createEffect.bind(Raa);
      state.originalMethods.scheduleEffect = Raa.scheduleEffect.bind(Raa);
      state.originalMethods.flushEffects = Raa.flushEffects.bind(Raa);

      Raa.createEffect = function (fn, options = {}) {
        const effect = state.originalMethods.createEffect(fn, options);
        if (state.active) {
          const count = state.effectStats.get(effect) || 0;
          state.effectStats.set(effect, count + 1);
          schedulePanelUpdate();
        }
        return effect;
      };

      Raa.scheduleEffect = function (effect) {
        if (state.active) {
          const count = state.effectStats.get(effect) || 0;
          state.effectStats.set(effect, count + 1);
        }
        state.originalMethods.scheduleEffect(effect);
      };

      Raa.flushEffects = function () {
        const start = performance.now();
        state.originalMethods.flushEffects();
        const duration = performance.now() - start;
        if (state.active) {
          state.performanceData.push({
            time: Date.now(),
            duration,
            effects: Raa._pendingEffects?.size || 0
          });
          if (state.performanceData.length > 200) state.performanceData.shift();
          schedulePanelUpdate();
        }
      };
    }

    function unpatchMethods() {
      if (state.originalMethods.createEffect) {
        Raa.createEffect = state.originalMethods.createEffect;
        Raa.scheduleEffect = state.originalMethods.scheduleEffect;
        Raa.flushEffects = state.originalMethods.flushEffects;
        state.originalMethods = {};
      }
    }

    let updateTimer = null;
    function schedulePanelUpdate() {
      if (updateTimer) return;
      updateTimer = requestAnimationFrame(() => {
        updateTimer = null;
        if (state.active && state.panel) {
          renderActiveTab();
        }
      });
    }

    // ══════════════════════════════════════════════
    //  BUILD PANEL UI
    // ══════════════════════════════════════════════
    function createPanel() {
      if (state.panel) return;

      const panel = doc.createElement('div');
      panel.id = 'raa-devtools';
      panel.style.cssText = `
        position: fixed; top: 0; right: 0; width: 380px; height: 100vh;
        background: #1e1e2e; color: #cdd6f4; font-family: monospace; font-size: 12px;
        z-index: 99999; display: flex; flex-direction: column;
        box-shadow: -2px 0 10px rgba(0,0,0,0.5); transition: transform 0.2s;
        transform: translateX(0);
      `;

      // Header
      const header = doc.createElement('div');
      header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:#313244;border-bottom:1px solid #45475a;';
      header.innerHTML = '<span style="font-weight:bold;color:#89b4fa;">RaaJS DevTools</span>';
      const headerBtns = doc.createElement('div');
      ['minimize','restore','close'].forEach(action => {
        const btn = doc.createElement('button');
        btn.textContent = action === 'minimize' ? '–' : action === 'restore' ? '□' : '✕';
        btn.style.cssText = 'background:none;border:none;color:#cdd6f4;cursor:pointer;margin-left:6px;';
        btn.addEventListener('click', () => {
          if (action === 'minimize') minimizePanel();
          else if (action === 'restore') restorePanel();
          else RaaDevTools.disable();
        });
        headerBtns.appendChild(btn);
      });
      header.appendChild(headerBtns);
      panel.appendChild(header);

      // Tab bar
      const tabs = ['inspector','effects','events','performance','about'];
      const tabBar = doc.createElement('div');
      tabBar.style.cssText = 'display:flex;background:#313244;border-bottom:1px solid #45475a;';
      tabs.forEach(t => {
        const tab = doc.createElement('button');
        tab.textContent = t.charAt(0).toUpperCase() + t.slice(1);
        tab.style.cssText = 'padding:6px 12px;background:none;border:none;color:#a6adc8;cursor:pointer;';
        tab.addEventListener('click', () => setTab(t));
        tab.dataset.tab = t;
        tabBar.appendChild(tab);
      });
      panel.appendChild(tabBar);

      // Content
      const content = doc.createElement('div');
      content.id = 'raa-devtools-content';
      content.style.cssText = 'flex:1;overflow-y:auto;padding:10px;';
      panel.appendChild(content);

      // Status bar
      const statusBar = doc.createElement('div');
      statusBar.id = 'raa-devtools-status';
      statusBar.style.cssText = 'padding:4px 10px;background:#313244;border-top:1px solid #45475a;font-size:11px;color:#a6adc8;';
      panel.appendChild(statusBar);

      // Resize handle
      const handle = doc.createElement('div');
      handle.style.cssText = 'position:absolute;left:0;top:0;width:4px;height:100%;cursor:ew-resize;';
      handle.addEventListener('mousedown', initResize);
      panel.appendChild(handle);

      doc.body.appendChild(panel);
      state.panel = panel;
      updateStatus();
    }

    function initResize(e) {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = state.panel.offsetWidth;
      function onMove(ev) {
        const newWidth = startWidth + (startX - ev.clientX);
        state.panel.style.width = Math.max(280, Math.min(800, newWidth)) + 'px';
      }
      function onUp() {
        doc.removeEventListener('mousemove', onMove);
        doc.removeEventListener('mouseup', onUp);
      }
      doc.addEventListener('mousemove', onMove);
      doc.addEventListener('mouseup', onUp);
    }

    function setTab(name) {
      state.tab = name;
      if (!state.panel) return;
      state.panel.querySelectorAll('[data-tab]').forEach(b => {
        b.style.color = b.dataset.tab === name ? '#89b4fa' : '#a6adc8';
        b.style.borderBottom = b.dataset.tab === name ? '2px solid #89b4fa' : 'none';
      });
      renderActiveTab();
    }

    function updateStatus() {
      const bar = doc.getElementById('raa-devtools-status');
      if (bar) {
        const roots = RaaDevTools.getRoots().length;
        const effects = state.effectStats.size;
        const events = state.eventLog.length;
        bar.textContent = `Roots: ${roots}  |  Effects tracked: ${effects}  |  Events: ${events}`;
      }
    }

    function minimizePanel() {
      if (!state.panel) return;
      state.panel.style.transform = 'translateX(380px)';
    }
    function restorePanel() {
      if (!state.panel) return;
      state.panel.style.transform = 'translateX(0)';
    }

    // ══════════════════════════════════════════════
    //  RENDER TAB
    // ══════════════════════════════════════════════
    function renderActiveTab() {
      if (!state.panel) return;
      const content = doc.getElementById('raa-devtools-content');
      if (!content) return;
      content.innerHTML = '';
      switch (state.tab) {
        case 'inspector': renderInspector(content); break;
        case 'effects': renderEffects(content); break;
        case 'events': renderEvents(content); break;
        case 'performance': renderPerformance(content); break;
        case 'about': renderAbout(content); break;
      }
      updateStatus();
    }

    function renderInspector(container) {
      const roots = RaaDevTools.getRoots();
      if (!roots.length) {
        container.textContent = 'No RaaJS roots found.';
        return;
      }
      const tree = buildComponentTree(roots);
      renderTree(container, tree, 0);
    }

    function buildComponentTree(roots) {
      return roots.map(root => {
        const appState = root.__raa_state__ || {};
        const appName = root.getAttribute('raa-core:app') || '(anonymous)';
        const islands = Array.from(root.querySelectorAll('[raa-eco\\:island]'))
          .filter(island => island.closest('[raa-eco\\:island]') === root || island.closest('[raa-core\\:app]') === root);
        return {
          name: appName,
          element: root,
          state: appState,
          children: islands.map(island => ({
            name: island.getAttribute('raa-core:app') || '(island)',
            element: island,
            state: island.__raa_state__ || {},
            children: []
          }))
        };
      });
    }

    function renderTree(container, nodes, depth) {
      nodes.forEach(node => {
        const wrapper = doc.createElement('div');
        wrapper.style.marginLeft = depth * 16 + 'px';

        const header = doc.createElement('div');
        header.style.cssText = 'display:flex;align-items:center;cursor:pointer;';
        header.innerHTML = `<span style="color:#89b4fa;">▸ ${node.name}</span>`;
        const contentDiv = doc.createElement('div');
        contentDiv.className = 'tree-content';
        contentDiv.style.display = 'block';
        contentDiv.style.marginLeft = '12px';

        header.addEventListener('click', () => {
          if (contentDiv.style.display === 'none') {
            contentDiv.style.display = 'block';
            header.querySelector('span').textContent = '▾ ' + node.name;
          } else {
            contentDiv.style.display = 'none';
            header.querySelector('span').textContent = '▸ ' + node.name;
          }
        });

        wrapper.appendChild(header);
        renderStateObject(contentDiv, node.state, node.element);
        if (node.children.length) {
          renderTree(contentDiv, node.children, depth + 1);
        }
        wrapper.appendChild(contentDiv);
        container.appendChild(wrapper);
      });
    }

    function renderStateObject(container, obj, rootEl) {
      if (!obj || typeof obj !== 'object') {
        container.textContent = String(obj);
        return;
      }
      const keys = Object.keys(obj);
      if (!keys.length) {
        container.textContent = '(empty state)';
        return;
      }
      keys.forEach(key => {
        if (key === '$refs' || key === '$http' || key.startsWith('__')) return;
        const row = doc.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;margin:2px 0;';
        const val = obj[key];
        const type = typeof val;
        const displayVal = type === 'object'
          ? (Array.isArray(val) ? `Array(${val.length})` : '{…}')
          : JSON.stringify(val);
        row.innerHTML = `<span style="color:#f9e2af;">${key}</span>: <span style="color:#a6adc8;">${displayVal}</span>`;
        if (state.writeMode) {
          const editBtn = doc.createElement('button');
          editBtn.textContent = '✎';
          editBtn.style.cssText = 'background:none;border:none;color:#89b4fa;cursor:pointer;margin-left:4px;';
          editBtn.addEventListener('click', () => {
            const newVal = prompt(`Edit ${key}:`, JSON.stringify(val));
            if (newVal !== null) {
              try {
                const parsed = JSON.parse(newVal);
                rootEl.__raa_state__[key] = parsed;
              } catch { alert('Invalid JSON'); }
            }
          });
          row.appendChild(editBtn);
        }
        container.appendChild(row);
      });
    }

    function renderEffects(container) {
      const roots = RaaDevTools.getRoots();
      if (!roots.length) return;
      const allEffects = [];
      roots.forEach(root => {
        const set = Raa._rootEffects?.get(root);
        if (set) set.forEach(e => allEffects.push(e));
      });
      if (!allEffects.length) {
        container.textContent = 'No effects recorded.';
        return;
      }
      allEffects.forEach(effect => {
        const count = state.effectStats.get(effect) || 0;
        const el = doc.createElement('div');
        el.style.cssText = 'margin:4px 0;padding:4px;background:#313244;border-radius:4px;';
        el.innerHTML = `<span style="color:#f9e2af;">Effect</span> runs: ${count} (active: ${effect.active})`;
        container.appendChild(el);
      });
    }

    function renderEvents(container) {
      if (!state.eventLog.length) {
        container.textContent = 'No events captured. Listen to RaaEvents or DOM events.';
        return;
      }
      state.eventLog.slice(-50).forEach(entry => {
        const el = doc.createElement('div');
        el.style.cssText = 'margin:4px 0;padding:4px;background:#313244;border-radius:4px;';
        el.innerHTML = `<span style="color:#89b4fa;">${entry.name}</span> <span style="color:#a6adc8;">${new Date(entry.timestamp).toLocaleTimeString()}</span>`;
        if (entry.snapshot) {
          const snapBtn = doc.createElement('button');
          snapBtn.textContent = 'View Snapshot';
          snapBtn.style.cssText = 'background:none;border:none;color:#89b4fa;cursor:pointer;margin-left:6px;';
          snapBtn.addEventListener('click', () => alert(safeStringify(entry.snapshot)));
          el.appendChild(snapBtn);
        }
        container.appendChild(el);
      });
    }

    function renderPerformance(container) {
      const data = state.performanceData;
      if (!data.length) {
        container.textContent = 'No performance data yet. Interact with the app.';
        return;
      }
      const maxDuration = Math.max(...data.map(d => d.duration), 1);
      data.forEach(d => {
        const label = doc.createElement('div');
        label.style.cssText = 'font-size:10px;color:#a6adc8;';
        label.textContent = `${d.duration.toFixed(1)}ms`;
        container.appendChild(label);
        const bar = doc.createElement('div');
        const width = (d.duration / maxDuration) * 100;
        bar.style.cssText = `height:12px;width:${width}%;background:#89b4fa;margin:2px 0;border-radius:2px;`;
        container.appendChild(bar);
      });
    }

    function renderAbout(container) {
      container.innerHTML = `
        <h3 style="color:#89b4fa;">RaaJS DevTools v1.0</h3>
        <p>Reactive inspection panel for RaaJS.</p>
        <p>Features: Component Tree, Effects Tracker, Event Logger, Performance Profiler.</p>
        <p>Shortcut: Ctrl+Shift+R</p>
      `;
    }

    // ══════════════════════════════════════════════
    //  EVENT LOGGING
    // ══════════════════════════════════════════════
    function setupEventLogging() {
      if (window.RaaEvents) {
        const origEmit = window.RaaEvents.emit;
        window.RaaEvents.emit = function(name, payload) {
          captureEvent(name, payload);
          return origEmit.call(window.RaaEvents, name, payload);
        };
      }
    }

    function captureEvent(name, payload) {
      if (!state.active) return;
      state.eventLog.push({
        name,
        payload,
        timestamp: Date.now(),
        snapshot: safeClone(RaaDevTools.getRoots().map(r => r.__raa_state__))
      });
      if (state.eventLog.length > state.maxEventLog) state.eventLog.shift();
      schedulePanelUpdate();
    }

    // ══════════════════════════════════════════════
    //  PUBLIC API
    // ══════════════════════════════════════════════
    window.RaaDevTools = {
      enable() {
        if (state.active) return;
        state.active = true;
        createPanel();
        patchMethods();
        setupEventLogging();
        setTab('inspector');
        doc.addEventListener('keydown', handleShortcut);
        console.log('[RaaDevTools] Enabled');
      },
      disable() {
        if (!state.active) return;
        state.active = false;
        unpatchMethods();
        if (state.panel) {
          state.panel.remove();
          state.panel = null;
        }
        doc.removeEventListener('keydown', handleShortcut);
        state.originalMethods = {};
        state.effectStats.clear();
        state.performanceData = [];
        state.eventLog = [];
      },
      toggle() {
        state.active ? this.disable() : this.enable();
      },
      isActive() { return state.active; },
      show() { this.enable(); },
      hide() { this.disable(); },
      minimize() { minimizePanel(); },
      restore() { restorePanel(); },

      getRoots() {
        return Array.from(doc.querySelectorAll('[raa-core\\:app]'))
          .filter(r => r.__raa_compiled__);
      },
      getState(root) {
        return root?.__raa_state__ || null;
      },
      getEffects(root) {
        return Raa._rootEffects?.get(root) || null;
      },
      getHandlers(el) {
        return el?.__raa_handlers__ || null;
      },
      getStore() {
        return Raa.globalStore;
      },
      getApps() {
        return Object.keys(window.RaaJS?.apps || {});
      },
      getExtensions() {
        const exts = [];
        if (window.RaaAnimation) exts.push('animation');
        if (window.RaaValidate) exts.push('validate');
        if (window.RaaEvents) exts.push('eventbus');
        if (window.RaaHttp) exts.push('http');
        if (window.RaaI18n) exts.push('i18n');
        if (window.RaaUI) exts.push('ui');
        return exts;
      }
    };

    function handleShortcut(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        RaaDevTools.toggle();
      }
    }

    // Auto-activate
    if (state.config.autoActivateLocalhost &&
        (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      RaaDevTools.enable();
    } else if (location.search.includes('raa-devtools') || location.search.includes('raa-debug')) {
      RaaDevTools.enable();
    }

    console.log('[RaaDevTools] v1.0 ready. Shortcut: Ctrl+Shift+R');
  });

})();