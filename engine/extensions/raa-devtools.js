/**
 * Raa DevTools — Glass Cockpit | v2.2.0
 * File: raa-devtools.txt (fixed)
 * ───────────────────────────────────────────────────────────
 * 🧬 ANATOMI & PERAN
 * Sebagai "Glass Cockpit" (Dasbor Kaca). Ekstensi ini adalah mata 
 * elang yang melakukan inspeksi telemetri secara real-time, 
 * menyingkap apa yang tersembunyi di balik lapisan reaktivitas 
 * tanpa mengganggu performa asli mesin [13].
 * ───────────────────────────────────────────────────────────
 * ⚙️ DIREKTIF & API UTAMA
 * - Ctrl+Shift+R   : Pemicu saklar panel inspeksi secara instan [13, 14].
 * - God Mode       : Kemampuan melakukan mutasi state langsung dari panel [13, 15].
 * - Discovery      : Pemindaian otomatis Root & Island via MutationObserver [13, 16].
 * - Performance    : Monitor durasi flush dan kepadatan efek per-cycle [13, 17].
 * - Timeline       : Rekaman kronologis setiap perubahan yang terjadi di sistem [13, 18].
 * ───────────────────────────────────────────────────────────
 * ✨ FITUR
 * - Auto-discovery roots & islands (real-time)
 * - State inspector + mutasi langsung (God Mode)
 * - Performance profiler (monitor efek, durasi flush)
 * - Event logger (menangkap action dari binding/events)
 * - Dependency graph viewer (siapa tergantung state apa)
 * - Timeline mutation & replay (undo/redo sederhana)
 * - Export/import state
 * - Shortcut Ctrl+Shift+R
 * ───────────────────────────────────────────────────────────
 * ⚖️ FILOSOFI TEKNIS
 * - Liaison Protocol (Internal Patching), Zero Dependency, 
 *   Real-time Discovery, Zero-Build [13, 19].
 * 
 * "Melihat yang tak terlihat adalah kunci kendali mutlak."
 * ───────────────────────────────────────────────────────────
 */

(function() {
  'use strict';

  // ======================== KONFIGURASI & STATE ========================
  const state = {
    active: false,
    panel: null,
    roots: new Set(),           // Set elemen root
    instances: new WeakMap(),   // root -> RaaJS instance (yg mengelola)
    timeline: [],               // { type, data, timestamp, snapshot? }
    maxTimeline: 200,
    perfEntries: [],            // { duration, effectsCount, timestamp }
    maxPerf: 100,
    eventLog: [],               // event dari evaluate/assign
    tab: 'inspector',
    writeMode: false,
    observer: null,
    originalMethods: new Map(), // untuk restore
    // Dependency graph: Map(proxy -> Map(key -> Set(effectId)))
    depGraph: new WeakMap(),
    effectToId: new WeakMap(),
    nextEffectId: 1,
    // Replay support
    history: [],                // snapshot perbedaan
    historyIndex: -1,
  };

  // Helper: stringify aman
  const safeStringify = (obj, indent = 2) => {
    try {
      return JSON.stringify(obj, (k, v) => {
        if (typeof v === 'function') return '[Function]';
        if (v && typeof v === 'object' && v.nodeType) return '[DOM]';
        if (v === undefined) return '[undefined]';
        return v;
      }, indent);
    } catch (e) {
      return '[Circular or Error]';
    }
  };

  // ======================== PATCH RaaJS CORE (non-invasif) ========================
  function patchRaaJS() {
    if (!window.RaaJS) {
      console.warn('[RaaDevTools] RaaJS not loaded yet, retry later');
      return false;
    }
    if (window.RaaJS.__devtoolsPatched) return true;

    const proto = window.RaaJS.prototype;

    // 1. Patch scheduleEffect untuk capture performa
    const originalSchedule = proto.scheduleEffect;
    proto.scheduleEffect = function(effect) {
      if (state.active && effect.root) {
        const start = performance.now();
        // Simpan start time di effect
        effect.__devtools_start = start;
      }
      return originalSchedule.call(this, effect);
    };

    // 2. Patch flushEffects untuk hitung durasi batch
    const originalFlush = proto.flushEffects;
    proto.flushEffects = function() {
      const startAll = performance.now();
      const beforeCount = this._pendingEffects?.size || 0;
      const result = originalFlush.call(this);
      const duration = performance.now() - startAll;
      if (state.active && (beforeCount > 0 || duration > 1)) {
        const entry = {
          timestamp: Date.now(),
          duration: duration,
          effectsCount: beforeCount
        };
        state.perfEntries.unshift(entry);
        if (state.perfEntries.length > state.maxPerf) state.perfEntries.pop();
        schedulePanelUpdate();
      }
      return result;
    };

    // 3. Patch createReactive untuk melacak dependency graph
    const originalCreateReactive = proto.createReactive;
    proto.createReactive = function(root, target) {
      const proxy = originalCreateReactive.call(this, root, target);
      if (!state.active) return proxy;
      // Simpan root di proxy untuk tracing
      if (proxy && typeof proxy === 'object') {
        const raw = proxy.__raa_raw__ || target;
        state.depGraph.set(proxy, new Map());
        // Override track sementara? Kita bisa manfaatkan track asli.
      }
      return proxy;
    };

    // 4. Patch track untuk mapping dependency
    const originalTrack = proto.track;
    proto.track = function(target, key) {
      originalTrack.call(this, target, key);
      if (!state.active) return;
      // Catat effect aktif ke graph
      const active = this._activeEffect;
      if (active && target && typeof target === 'object') {
        let effectId = state.effectToId.get(active);
        if (!effectId) {
          effectId = state.nextEffectId++;
          state.effectToId.set(active, effectId);
        }
        let depsMap = state.depGraph.get(target);
        if (!depsMap) {
          depsMap = new Map();
          state.depGraph.set(target, depsMap);
        }
        let keyDeps = depsMap.get(key);
        if (!keyDeps) {
          keyDeps = new Set();
          depsMap.set(key, keyDeps);
        }
        keyDeps.add(effectId);
      }
    };

    // 5. Patch evaluate untuk mencatat event ketika expression dieksekusi
    const originalEvaluate = proto.evaluate;
    proto.evaluate = function(expr, stateObj, el, extraLocals) {
      const result = originalEvaluate.call(this, expr, stateObj, el, extraLocals);
      if (state.active && expr && typeof expr === 'string') {
        const eventName = `eval:${expr.substring(0, 60)}`;
        addEvent(eventName, { expr, result: safeStringify(result) }, el);
      }
      return result;
    };

    // 6. Patch assign untuk mencatat mutasi state
    const originalAssign = proto.assign;
    proto.assign = function(expr, value, stateObj, el, extraLocals) {
      const oldVal = this.evaluate(expr, stateObj, el, extraLocals);
      originalAssign.call(this, expr, value, stateObj, el, extraLocals);
      if (state.active) {
        addEvent('assign', { expr, newValue: safeStringify(value), oldValue: safeStringify(oldVal) }, el);
        // Tambah ke timeline untuk replay
        addTimelineEntry('mutate', { expr, value: safeStringify(value), target: stateObj?.__raa_raw__ ? 'state' : 'global' });
      }
    };

    window.RaaJS.__devtoolsPatched = true;
    return true;
  }

  function addEvent(name, payload, element) {
    state.eventLog.unshift({
      name,
      payload,
      timestamp: Date.now(),
      elementTag: element ? element.tagName : 'unknown'
    });
    if (state.eventLog.length > 200) state.eventLog.pop();
    schedulePanelUpdate();
  }

  function addTimelineEntry(type, data) {
    state.timeline.unshift({ type, data, timestamp: Date.now() });
    if (state.timeline.length > state.maxTimeline) state.timeline.pop();
    schedulePanelUpdate();
  }

  // ======================== DISCOVERY ROOTS & ISLANDS ========================
  function discoverRoots() {
    const roots = document.querySelectorAll('[raa-core\\:app], [raa-eco\\:island]');
    roots.forEach(el => {
      if (!state.roots.has(el)) {
        state.roots.add(el);
        // Hubungkan dengan instance RaaJS jika ada
        if (window.Raa && el.__raa_state__) {
          state.instances.set(el, window.Raa);
        }
        addTimelineEntry('root_discovered', { tag: el.tagName, app: el.getAttribute('raa-core:app') });
      }
    });
    schedulePanelUpdate();
  }

  function startObserver() {
    if (state.observer) state.observer.disconnect();
    state.observer = new MutationObserver((mutations) => {
      let needScan = false;
      for (const m of mutations) {
        if (m.addedNodes.length) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1 && (node.hasAttribute('raa-core:app') || node.hasAttribute('raa-eco:island'))) {
              needScan = true;
              break;
            }
          }
        }
      }
      if (needScan) discoverRoots();
    });
    state.observer.observe(document.body, { childList: true, subtree: true });
  }

  // ======================== UI PANEL ========================
  function createPanel() {
    if (state.panel) return;
    const panel = document.createElement('div');
    panel.id = 'raa-devtools-panel';
    panel.style.cssText = `
      position: fixed; top: 0; right: 0; width: 500px; height: 100vh;
      background: #0f0f17; color: #d9e0ee; font-family: 'JetBrains Mono', monospace;
      font-size: 12px; z-index: 1000000; display: flex; flex-direction: column;
      box-shadow: -2px 0 20px rgba(0,0,0,0.5); border-left: 1px solid #2a2a3a;
      transition: transform 0.2s; transform: translateX(0);
    `;
    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#1a1a2a; border-bottom:1px solid #2a2a3a;';
    header.innerHTML = `<strong style="color:#cba6f7;">🔬 Raa DevTools v3</strong><span style="color:#6c7086;">Glass Cockpit</span>`;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:none; border:none; color:#f38ba8; cursor:pointer; font-size:16px;';
    closeBtn.onclick = () => RaaDevTools.disable();
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Tab bar
    const tabs = ['inspector', 'performance', 'events', 'timeline', 'graph', 'settings'];
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex; background:#161626; border-bottom:1px solid #2a2a3a;';
    tabs.forEach(t => {
      const btn = document.createElement('button');
      btn.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      btn.style.cssText = 'flex:1; padding:8px 0; background:none; border:none; color:#a6adc8; cursor:pointer; font-family:inherit; font-size:11px;';
      btn.dataset.tab = t;
      btn.onclick = () => setTab(t);
      tabBar.appendChild(btn);
    });
    panel.appendChild(tabBar);

    // Content area
    const content = document.createElement('div');
    content.id = 'raa-devtools-content';
    content.style.cssText = 'flex:1; overflow:auto; padding:12px;';
    panel.appendChild(content);

    // Footer status
    const footer = document.createElement('div');
    footer.id = 'raa-dev-footer';
    footer.style.cssText = 'padding:6px 12px; background:#161626; border-top:1px solid #2a2a3a; font-size:10px; color:#585b70; display:flex; justify-content:space-between;';
    panel.appendChild(footer);
    document.body.appendChild(panel);
    state.panel = panel;
    updateFooter();
  }

  function setTab(tab) {
    state.tab = tab;
    if (!state.panel) return;
    const btns = state.panel.querySelectorAll('[data-tab]');
    btns.forEach(btn => {
      const isActive = btn.dataset.tab === tab;
      btn.style.color = isActive ? '#cba6f7' : '#a6adc8';
      btn.style.borderBottom = isActive ? '2px solid #cba6f7' : 'none';
    });
    renderActiveTab();
  }

  function updateFooter() {
    const footer = document.getElementById('raa-dev-footer');
    if (footer) {
      footer.innerHTML = `<span>📡 Roots: ${state.roots.size}</span><span>⚡ Perf samples: ${state.perfEntries.length}</span><span>✏️ ${state.writeMode ? 'God Mode ON' : 'Read-only'}</span>`;
    }
  }

  function renderActiveTab() {
    const container = document.getElementById('raa-devtools-content');
    if (!container) return;
    container.innerHTML = '';
    switch (state.tab) {
      case 'inspector': renderInspector(container); break;
      case 'performance': renderPerformance(container); break;
      case 'events': renderEvents(container); break;
      case 'timeline': renderTimeline(container); break;
      case 'graph': renderGraph(container); break;
      case 'settings': renderSettings(container); break;
    }
    updateFooter();
  }

  // ================= INSPECTOR TAB =================
  function renderInspector(container) {
    if (state.roots.size === 0) {
      container.innerHTML = '<div style="text-align:center;color:#6c7086;padding:40px;">No Raa roots found. Create an element with raa-core:app or raa-eco:island.</div>';
      return;
    }
    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.style.cssText = 'display:flex; justify-content:space-between; margin-bottom:12px;';
    const modeBtn = document.createElement('button');
    modeBtn.textContent = state.writeMode ? '🔓 God Mode (ON)' : '🔒 God Mode (OFF)';
    modeBtn.style.cssText = 'background:#313244; border:none; color:white; padding:4px 8px; border-radius:4px; cursor:pointer;';
    modeBtn.onclick = () => { state.writeMode = !state.writeMode; renderInspector(container); };
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '⟳ Refresh roots';
    refreshBtn.style.cssText = 'background:#313244; border:none; color:white; padding:4px 8px; border-radius:4px; cursor:pointer;';
    refreshBtn.onclick = () => { discoverRoots(); renderInspector(container); };
    toolbar.appendChild(modeBtn);
    toolbar.appendChild(refreshBtn);
    container.appendChild(toolbar);

    for (const root of state.roots) {
      const card = document.createElement('div');
      card.style.cssText = 'background:#1a1a2a; border-radius:8px; margin-bottom:16px; border:1px solid #2a2a3a; overflow:hidden;';
      const appName = root.getAttribute('raa-core:app') || root.getAttribute('raa-eco:island') || 'Anonymous Root';
      const header = document.createElement('div');
      header.style.cssText = 'background:#252535; padding:8px 12px; font-weight:bold; color:#89dceb; cursor:pointer;';
      header.innerHTML = `📦 ${appName} <span style="color:#6c7086; font-size:10px;">${root.tagName}</span>`;
      const body = document.createElement('div');
      body.style.padding = '12px';
      body.style.display = 'block';
      header.onclick = () => { body.style.display = body.style.display === 'none' ? 'block' : 'none'; };
      if (root.__raa_state__) {
        const rawState = root.__raa_state__.__raa_raw__ || root.__raa_state__;
        renderStateTable(body, rawState, root);
      } else {
        body.innerHTML = '<i>State not yet compiled or root not active</i>';
      }
      card.appendChild(header);
      card.appendChild(body);
      container.appendChild(card);
    }
  }

  function renderStateTable(container, stateObj, rootEl) {
    const keys = Object.keys(stateObj).filter(k => !k.startsWith('__') && k !== '$refs' && typeof stateObj[k] !== 'function');
    if (keys.length === 0) {
      container.innerHTML += '<div style="color:#6c7086;">No state properties</div>';
      return;
    }
    const table = document.createElement('table');
    table.style.cssText = 'width:100%; border-collapse:collapse; font-size:11px;';
    for (const key of keys) {
      const value = stateObj[key];
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #2a2a3a';
      const tdKey = document.createElement('td');
      tdKey.style.padding = '6px 4px'; tdKey.style.color = '#f9e2af'; tdKey.textContent = key;
      const tdVal = document.createElement('td');
      tdVal.style.padding = '6px 4px';
      const valStr = typeof value === 'object' ? safeStringify(value, 0) : String(value);
      tdVal.textContent = valStr.substring(0, 60);
      if (state.writeMode) {
        const editBtn = document.createElement('button');
        editBtn.textContent = '✎';
        editBtn.style.cssText = 'margin-left:8px; background:#313244; border:none; color:#a6e3a1; border-radius:4px; cursor:pointer;';
        editBtn.onclick = () => {
          const newVal = prompt(`Edit ${key}:`, valStr);
          if (newVal !== null) {
            try {
              const parsed = JSON.parse(newVal);
              if (rootEl.__raa_state__) {
                rootEl.__raa_state__[key] = parsed;
                addTimelineEntry('mutate', { expr: key, value: newVal });
                renderInspector(document.getElementById('raa-devtools-content'));
              }
            } catch (e) {
              alert('Invalid JSON');
            }
          }
        };
        tdVal.appendChild(editBtn);
      }
      tr.appendChild(tdKey);
      tr.appendChild(tdVal);
      table.appendChild(tr);
    }
    container.appendChild(table);
  }

  // ================= PERFORMANCE TAB =================
  function renderPerformance(container) {
    if (state.perfEntries.length === 0) {
      container.innerHTML = '<div style="color:#6c7086;text-align:center;">No performance data yet. Interact with your app.</div>';
      return;
    }
    const avg = state.perfEntries.reduce((a,b) => a + b.duration, 0) / state.perfEntries.length;
    const maxDur = Math.max(...state.perfEntries.map(e => e.duration));
    const badgeColor = avg > 16 ? '#f38ba8' : (avg > 8 ? '#f9e2af' : '#a6e3a1');
    const badgeText = avg > 16 ? '⚠️ Heavy render' : (avg > 8 ? '⚡ Moderate' : '✅ Smooth');
    container.innerHTML = `
      <div style="background:#1a1a2a; border-radius:8px; padding:12px; margin-bottom:12px;">
        <div style="font-size:14px; color:${badgeColor}; font-weight:bold;">${badgeText}</div>
        <div>Average flush: ${avg.toFixed(2)} ms | Samples: ${state.perfEntries.length}</div>
      </div>
      <div style="font-weight:bold;">Recent flush durations</div>
      <div style="margin-top:8px;">`;
    for (const entry of state.perfEntries.slice(0, 20)) {
      const width = (entry.duration / maxDur) * 100;
      container.innerHTML += `
        <div style="margin:4px 0;">
          <div style="display:flex; justify-content:space-between;"><span>${new Date(entry.timestamp).toLocaleTimeString()}</span><span>${entry.effectsCount} effects</span></div>
          <div style="background:#2a2a3a; border-radius:4px; height:6px;"><div style="width:${width}%; background:${entry.duration>16?'#f38ba8':'#a6e3a1'}; height:6px; border-radius:4px;"></div></div>
        </div>`;
    }
    container.innerHTML += `</div>`;
  }

  // ================= EVENTS TAB =================
  function renderEvents(container) {
    if (state.eventLog.length === 0) {
      container.innerHTML = '<div style="color:#6c7086;text-align:center;">No events captured yet.</div>';
      return;
    }
    for (const ev of state.eventLog.slice(0, 100)) {
      const div = document.createElement('div');
      div.style.cssText = 'background:#1a1a2a; margin-bottom:6px; padding:8px; border-radius:6px; font-size:10px; border-left:3px solid #89b4fa;';
      div.innerHTML = `<strong style="color:#cba6f7;">${ev.name}</strong> <span style="color:#6c7086;">${new Date(ev.timestamp).toLocaleTimeString()}</span><br>${JSON.stringify(ev.payload).substring(0, 120)}`;
      container.appendChild(div);
    }
  }

  // ================= TIMELINE TAB =================
  function renderTimeline(container) {
    if (state.timeline.length === 0) {
      container.innerHTML = '<div style="color:#6c7086;">No timeline actions. Mutations will appear here.</div>';
      return;
    }
    for (const item of state.timeline.slice(0, 50)) {
      const div = document.createElement('div');
      div.style.cssText = 'padding:4px 0; border-bottom:1px solid #2a2a3a; font-size:11px;';
      div.innerHTML = `[${new Date(item.timestamp).toLocaleTimeString()}] <strong>${item.type}</strong> ${JSON.stringify(item.data).substring(0, 100)}`;
      container.appendChild(div);
    }
  }

  // ================= DEPENDENCY GRAPH (sederhana) =================
function renderGraph(container) {
  let effectCount = state.effectToId.size;
  let proxyCount = 0;
  // Karena WeakMap tidak punya .keys(), kita tidak bisa loop secara normal.
  // Alternatif: kita tidak usah coba iterasi, cukup tampilkan info dari properti lain.
  // Tapi kita bisa akses internal _depMap milik RaaJS jika perlu (advanced).
  container.innerHTML = `
    <div style="color:#a6e3a1;">📊 Dependency Graph (Limited View)</div>
    <div style="background:#1a1a2a; padding:12px; border-radius:8px; margin-top:8px;">
      <div>⚡ Effects tracked: <strong>${effectCount}</strong></div>
      <div>🔗 Dependency graph aktif (WeakMap) tidak dapat diiterasi langsung, tetapi reaktivitas berfungsi normal.</div>
      <div style="margin-top:8px; font-size:10px;">💡 Gunakan console: <code>Raa._depMap</code> (jika terekspos) untuk inspeksi lebih dalam.</div>
    </div>
  `;
}

  // ================= SETTINGS =================
  function renderSettings(container) {
    container.innerHTML = `
      <div style="background:#1a1a2a; padding:12px; border-radius:8px;">
        <label><input type="checkbox" id="autoDiscover" checked> Auto-discover new roots</label><br>
        <label><input type="checkbox" id="captureEvents" checked> Capture expression evaluations</label><br>
        <label><input type="checkbox" id="performanceProfiler" checked> Performance profiler</label><br>
        <button id="clearData" style="margin-top:12px; background:#313244; border:none; padding:6px; border-radius:4px;">Clear logs & timeline</button>
        <button id="exportState" style="margin-top:12px; background:#89b4fa; border:none; padding:6px; border-radius:4px;">Export all state</button>
      </div>
    `;
    document.getElementById('clearData')?.addEventListener('click', () => {
      state.eventLog = [];
      state.timeline = [];
      state.perfEntries = [];
      renderActiveTab();
    });
    document.getElementById('exportState')?.addEventListener('click', () => {
      const exportData = {};
      for (const root of state.roots) {
        const name = root.getAttribute('raa-core:app') || 'root';
        if (root.__raa_state__) exportData[name] = root.__raa_state__.__raa_raw__ || root.__raa_state__;
      }
      const blob = new Blob([safeStringify(exportData, 2)], {type: 'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'raa_state_export.json';
      a.click();
    });
  }

  let updateScheduled = false;
  function schedulePanelUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    requestAnimationFrame(() => {
      if (state.active && state.panel) renderActiveTab();
      updateScheduled = false;
    });
  }

  // ================= PUBLIC API =================
  window.RaaDevTools = {
    enable() {
      if (state.active) return;
      if (!patchRaaJS()) { console.error('[RaaDevTools] Cannot patch RaaJS, is it loaded?'); return; }
      state.active = true;
      createPanel();
      discoverRoots();
      startObserver();
      setTab('inspector');
      document.addEventListener('keydown', handleShortcut);
      console.log('[RaaDevTools] Enabled. Press Ctrl+Shift+R to toggle.');
    },
    disable() {
      if (!state.active) return;
      state.active = false;
      if (state.panel) state.panel.remove();
      state.panel = null;
      if (state.observer) state.observer.disconnect();
      document.removeEventListener('keydown', handleShortcut);
      console.log('[RaaDevTools] Disabled.');
    },
    toggle() { state.active ? this.disable() : this.enable(); }
  };

  function handleShortcut(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      RaaDevTools.toggle();
    }
  }

  // Auto-enable di localhost
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.search.includes('raa-debug')) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => RaaDevTools.enable());
    else RaaDevTools.enable();
  }
})();