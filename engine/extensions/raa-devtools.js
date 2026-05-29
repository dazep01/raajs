/**
Raa DevTools — Glass Cockpit | v3.1.0
File: raa-devtools.js
─────────────────────────────────────────────────────────────
🧬 ANATOMI & PERAN
Sebagai "Glass Cockpit" (Dasbor Kaca). Ekstensi ini adalah mata
elang yang melakukan inspeksi telemetri secara real-time,
menyingkap apa yang tersembunyi di balik lapisan reaktivitas
tanpa mengganggu performa asli mesin.
─────────────────────────────────────────────────────────────
⚙️ DIREKTIF & API UTAMA
Ctrl+Shift+R   : Toggle panel inspeksi secara instan.
God Mode       : Mutasi state langsung dari panel (edit nilai).
Discovery      : Pemindaian otomatis Root & Island via afterCompile hook.
Performance    : Monitor durasi flush dan kepadatan efek per-cycle.
Timeline       : Rekaman kronologis setiap mutasi state.
─────────────────────────────────────────────────────────────
✨ FITUR
Auto-discovery roots & islands (real-time via Plugin hooks)
State inspector + mutasi langsung (God Mode)
Performance profiler (monitor flush duration)
Event logger (evaluate & assign interceptions)
Dependency graph viewer (effect count)
Timeline mutation history
Export state ke JSON
Shortcut Ctrl+Shift+R
─────────────────────────────────────────────────────────────
⚖️ FILOSOFI TEKNIS
Plugin-Native (v3.1.0+), Zero Dependency, Real-time Discovery,
Instance-level patching (bukan prototype patching).
"Melihat yang tak terlihat adalah kunci kendali mutlak."
─────────────────────────────────────────────────────────────
CHANGELOG
v3.1.0 (2026-05-24)
[BREAKING]  Subsystem instance names disesuaikan dengan core v3.1.0:
          raa.effectScheduler → raa.scheduler
          raa.reactiveSystem  → raa.reactive
          raa.scopeEvaluator  → raa.evaluator
[FIX]       raa.scheduler.flushEffects (bukan .flush)
[FIX]       raa.scheduler._pendingEffects (bukan ._pending)
[FIX]       raa._activeEffect lives on main instance (bukan di reactive)
[FIX]       track() wrapper kini meneruskan 3 argumen (target, key, activeEffect)
          → reaktivitas TIDAK mati saat DevTools aktif.
[FIX]       Seluruh typo/artefak OCR (spasi putus, karakter rusak) dibersihkan.
[IMPROVE]   uninstall() kini mengembalikan metode asli (restore) → aman untuk toggle.
          Zero console.log production leak. Guard idempotent aktif.
v2.2.0 (baseline)
Original version — prototype patching approach.
─────────────────────────────────────────────────────────────
*/
(function () {
'use strict';
if (typeof window === 'undefined') return;

// ═══════════════════════════════════════════════════════
//  INTERNAL DEVTOOLS STATE
// ═══════════════════════════════════════════════════════
const dt = {
  active: false,
  panel: null,
  roots: new Set(),
  timeline: [],
  maxTimeline: 200,
  perfEntries: [],
  maxPerf: 100,
  eventLog: [],
  tab: 'inspector',
  writeMode: false,
  effectToId: new WeakMap(),
  nextEffectId: 1,
  _installed: false,
  _updateTimer: null,
  _originals: {} // Menyimpan referensi metode asli untuk restore saat uninstall
};

// ─── Stringify aman (CSP-safe, handles circular) ──────
function safeStringify(obj, indent = 2) {
  try {
    return JSON.stringify(obj, (k, v) => {
      if (typeof v === 'function') return '[Function]';
      if (v && typeof v === 'object' && v.nodeType) return '[DOM]';
      if (v === undefined) return '[undefined]';
      return v;
    }, indent);
  } catch (_) { return '[Circular or Error]'; }
}

// ─── Panel refresh throttle ───────────────────────────
function schedulePanelUpdate() {
  if (dt._updateTimer) return;
  dt._updateTimer = requestAnimationFrame(() => {
    dt._updateTimer = null;
    if (dt.active && dt.panel) renderActiveTab();
  });
}

// ─── Event log helpers ────────────────────────────────
function addEvent(name, payload, element) {
  dt.eventLog.unshift({ name, payload, timestamp: Date.now(), elementTag: element?.tagName || 'unknown' });
  if (dt.eventLog.length > 200) dt.eventLog.pop();
  schedulePanelUpdate();
}

function addTimelineEntry(type, data) {
  dt.timeline.unshift({ type, data, timestamp: Date.now() });
  if (dt.timeline.length > dt.maxTimeline) dt.timeline.pop();
  schedulePanelUpdate();
}

// ═══════════════════════════════════════════════════════
//  UI PANEL
// ═══════════════════════════════════════════════════════
function createPanel() {
  if (dt.panel) return;
  const panel = document.createElement('div');
  panel.id = 'raa-devtools-panel';
  panel.style.cssText = [
    'position:fixed;top:0;right:0;width:500px;height:100vh',
    'background:#0f0f17;color:#d9e0ee;font-family:"JetBrains Mono",monospace',
    'font-size:12px;z-index:1000000;display:flex;flex-direction:column',
    'box-shadow:-2px 0 20px rgba(0,0,0,0.5);border-left:1px solid #2a2a3a',
    'transition:transform 0.2s;transform:translateX(0)'
  ].join(';');

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#1a1a2a;border-bottom:1px solid #2a2a3a;';
  header.innerHTML = '<strong style="color:#cba6f7;">&#128302; Raa DevTools</strong><span style="color:#6c7086;">Glass Cockpit v3.1.0</span>';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'background:none;border:none;color:#f38ba8;cursor:pointer;font-size:16px;';
  closeBtn.onclick = () => RaaDevTools.disable();
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const TABS = ['inspector', 'performance', 'events', 'timeline', 'graph', 'settings'];
  const tabBar = document.createElement('div');
  tabBar.style.cssText = 'display:flex;background:#161626;border-bottom:1px solid #2a2a3a;';
  TABS.forEach(t => {
    const btn = document.createElement('button');
    btn.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    btn.dataset.tab = t;
    btn.style.cssText = 'flex:1;padding:8px 0;background:none;border:none;color:#a6adc8;cursor:pointer;font-family:inherit;font-size:11px;';
    btn.onclick = () => setTab(t);
    tabBar.appendChild(btn);
  });
  panel.appendChild(tabBar);

  const content = document.createElement('div');
  content.id = 'raa-devtools-content';
  content.style.cssText = 'flex:1;overflow:auto;padding:12px;';
  panel.appendChild(content);

  const footer = document.createElement('div');
  footer.id = 'raa-dev-footer';
  footer.style.cssText = 'padding:6px 12px;background:#161626;border-top:1px solid #2a2a3a;font-size:10px;color:#585b70;display:flex;justify-content:space-between;';
  panel.appendChild(footer);

  document.body.appendChild(panel);
  dt.panel = panel;
  updateFooter();
}

function setTab(tab) {
  dt.tab = tab;
  if (!dt.panel) return;
  dt.panel.querySelectorAll('[data-tab]').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.style.color = active ? '#cba6f7' : '#a6adc8';
    btn.style.borderBottom = active ? '2px solid #cba6f7' : 'none';
  });
  renderActiveTab();
}

function updateFooter() {
  const footer = document.getElementById('raa-dev-footer');
  if (footer) {
    footer.innerHTML = [
      `<span>&#128225; Roots: ${dt.roots.size}</span>`,
      `<span>&#9889; Perf samples: ${dt.perfEntries.length}</span>`,
      `<span>&#9998; ${dt.writeMode ? 'God Mode ON' : 'Read-only'}</span>`
    ].join('');
  }
}

function renderActiveTab() {
  const container = document.getElementById('raa-devtools-content');
  if (!container) return;
  container.innerHTML = '';
  switch (dt.tab) {
    case 'inspector':   renderInspector(container);   break;
    case 'performance': renderPerformance(container); break;
    case 'events':      renderEvents(container);      break;
    case 'timeline':    renderTimeline(container);    break;
    case 'graph':       renderGraph(container);       break;
    case 'settings':    renderSettings(container);    break;
  }
  updateFooter();
}

// ─── INSPECTOR TAB ────────────────────────────────────
function renderInspector(container) {
  if (dt.roots.size === 0) {
    container.innerHTML = '<div style="text-align:center;color:#6c7086;padding:40px;">Belum ada Raa root. Buat elemen dengan raa-core:app.</div>';
    return;
  }
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
  const modeBtn = document.createElement('button');
  modeBtn.textContent = dt.writeMode ? '🔓 God Mode (ON)' : '🔒 God Mode (OFF)';
  modeBtn.style.cssText = 'background:#313244;border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer;';
  modeBtn.onclick = () => { dt.writeMode = !dt.writeMode; renderInspector(container); };
  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = '↻ Refresh';
  refreshBtn.style.cssText = 'background:#313244;border:none;color:white;padding:4px 8px;border-radius:4px;cursor:pointer;';
  refreshBtn.onclick = () => renderInspector(container);
  toolbar.appendChild(modeBtn);
  toolbar.appendChild(refreshBtn);
  container.appendChild(toolbar);

  for (const root of dt.roots) {
    const appName = root.getAttribute('raa-core:app') || root.getAttribute('raa-eco:island') || 'Anonymous';
    const card = document.createElement('div');
    card.style.cssText = 'background:#1a1a2a;border-radius:8px;margin-bottom:16px;border:1px solid #2a2a3a;overflow:hidden;';
    const hdr = document.createElement('div');
    hdr.style.cssText = 'background:#252535;padding:8px 12px;font-weight:bold;color:#89dceb;cursor:pointer;';
    hdr.innerHTML = `&#128230; ${appName} <span style="color:#6c7086;font-size:10px;">${root.tagName}</span>`;
    const body = document.createElement('div');
    body.style.padding = '12px';
    hdr.onclick = () => { body.style.display = body.style.display === 'none' ? 'block' : 'none'; };
    if (root.__raa_state__) {
      const rawState = root.__raa_state__.__raa_raw__ || root.__raa_state__;
      renderStateTable(body, rawState, root);
    } else {
      body.innerHTML = '<i style="color:#6c7086;">State belum dikompilasi atau root tidak aktif.</i>';
    }
    card.appendChild(hdr);
    card.appendChild(body);
    container.appendChild(card);
  }
}

function renderStateTable(container, stateObj, rootEl) {
  const keys = Object.keys(stateObj).filter(k =>
    !k.startsWith('__') && k !== '$refs' && typeof stateObj[k] !== 'function'
  );
  if (keys.length === 0) {
    container.innerHTML += '<div style="color:#6c7086;">Tidak ada state properties.</div>';
    return;
  }
  const table = document.createElement('table');
  table.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px;';
  keys.forEach(key => {
    const value = stateObj[key];
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid #2a2a3a';
    const tdKey = document.createElement('td');
    tdKey.style.cssText = 'padding:6px 4px;color:#f9e2af;';
    tdKey.textContent = key;
    const valStr = typeof value === 'object' ? safeStringify(value, 0) : String(value);
    const tdVal = document.createElement('td');
    tdVal.style.cssText = 'padding:6px 4px;word-break:break-all;';
    tdVal.textContent = valStr.substring(0, 80);
    if (dt.writeMode) {
      const editBtn = document.createElement('button');
      editBtn.textContent = '✎';
      editBtn.style.cssText = 'margin-left:8px;background:#313244;border:none;color:#a6e3a1;border-radius:4px;cursor:pointer;';
      editBtn.onclick = () => {
        const newVal = prompt(`Edit "${key}":`, valStr);
        if (newVal !== null) {
          try {
            const parsed = JSON.parse(newVal);
            if (rootEl.__raa_state__) {
              rootEl.__raa_state__[key] = parsed;
              addTimelineEntry('mutate:godmode', { key, value: newVal });
              renderInspector(document.getElementById('raa-devtools-content'));
            }
          } catch (_) { alert('JSON tidak valid.'); }
        }
      };
      tdVal.appendChild(editBtn);
    }
    tr.appendChild(tdKey);
    tr.appendChild(tdVal);
    table.appendChild(tr);
  });
  container.appendChild(table);
}

// ─── PERFORMANCE TAB ──────────────────────────────────
function renderPerformance(container) {
  if (dt.perfEntries.length === 0) {
    container.innerHTML = '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada data performa. Interaksikan aplikasi Anda.</div>';
    return;
  }
  const avg = dt.perfEntries.reduce((a, b) => a + b.duration, 0) / dt.perfEntries.length;
  const maxDur = Math.max(...dt.perfEntries.map(e => e.duration));
  const color = avg > 16 ? '#f38ba8' : avg > 8 ? '#f9e2af' : '#a6e3a1';
  const label = avg > 16 ? '⚠️ Heavy render' : avg > 8 ? '⚡ Moderate' : '✅ Smooth';
  container.innerHTML = `<div style="background:#1a1a2a;border-radius:8px;padding:12px;margin-bottom:12px;">
    <div style="font-size:14px;color:${color};font-weight:bold;">${label}</div>
    <div>Avg flush: ${avg.toFixed(2)} ms &nbsp;|&nbsp; Samples: ${dt.perfEntries.length}</div>
  </div>
  <div style="font-weight:bold;margin-bottom:8px;">Durasi flush terbaru</div>`;
  dt.perfEntries.slice(0, 20).forEach(entry => {
    const w = maxDur > 0 ? (entry.duration / maxDur * 100).toFixed(1) : 0;
    container.innerHTML += `<div style="margin:4px 0;">
      <div style="display:flex;justify-content:space-between;font-size:10px;">
        <span>${new Date(entry.timestamp).toLocaleTimeString()}</span>
        <span>${entry.effectsCount} effects &mdash; ${entry.duration.toFixed(2)}ms</span>
      </div>
      <div style="background:#2a2a3a;border-radius:4px;height:6px;">
        <div style="width:${w}%;background:${entry.duration > 16 ? '#f38ba8' : '#a6e3a1'};height:6px;border-radius:4px;"></div>
      </div>
    </div>`;
  });
}

// ─── EVENTS / TIMELINE / GRAPH / SETTINGS TABS ────────
function renderEvents(container) {
  if (dt.eventLog.length === 0) {
    container.innerHTML = '<div style="color:#6c7086;text-align:center;padding:40px;">Belum ada events yang ditangkap.</div>';
    return;
  }
  dt.eventLog.slice(0, 100).forEach(ev => {
    const div = document.createElement('div');
    div.style.cssText = 'background:#1a1a2a;margin-bottom:6px;padding:8px;border-radius:6px;font-size:10px;border-left:3px solid #89b4fa;';
    div.innerHTML = `<strong style="color:#cba6f7;">${ev.name}</strong> <span style="color:#6c7086;">${new Date(ev.timestamp).toLocaleTimeString()} &lt;${ev.elementTag}&gt;</span><br><span style="opacity:0.7;">${JSON.stringify(ev.payload).substring(0, 120)}</span>`;
    container.appendChild(div);
  });
}

function renderTimeline(container) {
  if (dt.timeline.length === 0) {
    container.innerHTML = '<div style="color:#6c7086;padding:40px;text-align:center;">Belum ada timeline actions.</div>';
    return;
  }
  dt.timeline.slice(0, 50).forEach(item => {
    const div = document.createElement('div');
    div.style.cssText = 'padding:4px 0;border-bottom:1px solid #2a2a3a;font-size:11px;';
    div.innerHTML = `<span style="color:#6c7086;">[${new Date(item.timestamp).toLocaleTimeString()}]</span> <strong style="color:#cba6f7;">${item.type}</strong> ${JSON.stringify(item.data).substring(0, 120)}`;
    container.appendChild(div);
  });
}

function renderGraph(container) {
  const effectCount = dt.nextEffectId - 1;
  container.innerHTML = `<div style="color:#a6e3a1;font-weight:bold;margin-bottom:8px;">&#128202; Dependency Graph</div>
    <div style="background:#1a1a2a;padding:12px;border-radius:8px;">
      <div>&#9889; Effects tracked: <strong>${effectCount}</strong></div>
      <div style="margin-top:8px;color:#6c7086;">Dependency graph (WeakMap) tidak dapat diiterasi secara langsung — ini batasan JavaScript yang menjaga privasi memory.<br>Reaktivitas berjalan normal.</div>
      <div style="margin-top:8px;font-size:10px;color:#585b70;">💡 Gunakan browser console dan inspeksi <code style="color:#a6e3a1;">window.Raa</code> untuk eksplorasi lebih dalam.</div>
    </div>`;
}

function renderSettings(container) {
  container.innerHTML = `<div style="background:#1a1a2a;padding:12px;border-radius:8px;line-height:2;">
    <div style="color:#cba6f7;font-weight:bold;margin-bottom:8px;">Pengaturan DevTools</div>
    <label><input type="checkbox" id="dt-capture-events" checked> Tangkap expression evaluations</label><br>
    <label><input type="checkbox" id="dt-perf-profiler" checked> Performance profiler</label><br>
    <div style="margin-top:12px;display:flex;gap:8px;">
      <button id="dt-clear" style="background:#313244;border:none;color:white;padding:6px 10px;border-radius:4px;cursor:pointer;">&#128465; Bersihkan log</button>
      <button id="dt-export" style="background:#89b4fa;border:none;color:#0f0f17;padding:6px 10px;border-radius:4px;cursor:pointer;">&#128229; Export state</button>
    </div>
  </div>`;
  document.getElementById('dt-clear')?.addEventListener('click', () => {
    dt.eventLog = []; dt.timeline = []; dt.perfEntries = []; renderActiveTab();
  });
  document.getElementById('dt-export')?.addEventListener('click', () => {
    const out = {};
    for (const root of dt.roots) {
      const name = root.getAttribute('raa-core:app') || root.getAttribute('raa-eco:island') || 'root';
      if (root.__raa_state__) out[name] = root.__raa_state__.__raa_raw__ || root.__raa_state__;
    }
    const blob = new Blob([safeStringify(out, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'raa_state_export.json';
    a.click();
  });
}

// ═══════════════════════════════════════════════════════
//  GLOBAL API: window.RaaDevTools
// ═══════════════════════════════════════════════════════
window.RaaDevTools = {
  enable() {
    dt.active = true;
    createPanel();
    setTab(dt.tab);
    if (dt.panel) dt.panel.style.display = 'flex';
  },
  disable() {
    dt.active = false;
    if (dt.panel) dt.panel.style.display = 'none';
  },
  toggle() {
    if (dt.active) this.disable(); else this.enable();
  },
  clear() {
    dt.eventLog = []; dt.timeline = []; dt.perfEntries = []; schedulePanelUpdate();
  }
};

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    window.RaaDevTools.toggle();
  }
});

// ═══════════════════════════════════════════════════════
//  PLUGIN DEFINITION (v3.1.0 Plugin System)
// ═══════════════════════════════════════════════════════
const RaaDevToolsPlugin = {
  name: 'raa-devtools',
  
  install(raa) {
    if (dt._installed) return;
    dt._installed = true;

    // ── 0. BACKFILL: Temukan root yang SUDAH tercompile sebelum plugin load ──
    document.querySelectorAll('[raa-core\\:app], [raa-eco\\:island]').forEach(root => {
      if (root.__raa_compiled__) {
        dt.roots.add(root);
        addTimelineEntry('root:backfilled', { tag: root.tagName, app: root.getAttribute('raa-core:app') });
      }
    });
    schedulePanelUpdate();

    const orig = dt._originals;

    // ── 1. Patch EffectScheduler (v3.1.0 API) ──
    if (raa.scheduler && typeof raa.scheduler.flushEffects === 'function') {
      orig.flushEffects = raa.scheduler.flushEffects.bind(raa.scheduler);
      raa.scheduler.flushEffects = function() {
        const start = performance.now();
        const beforeCount = raa.scheduler._pendingEffects?.size || 0;
        const result = orig.flushEffects();
        if (dt.active && (beforeCount > 0 || performance.now() - start > 0.5)) {
          dt.perfEntries.unshift({ timestamp: Date.now(), duration: performance.now() - start, effectsCount: beforeCount });
          if (dt.perfEntries.length > dt.maxPerf) dt.perfEntries.pop();
          schedulePanelUpdate();
        }
        return result;
      };
    }

    // ── 2. Patch ReactiveSystem.track (v3.1.0 API + 3 args fix) ──
    if (raa.reactive && typeof raa.reactive.track === 'function') {
      orig.track = raa.reactive.track.bind(raa.reactive);
      raa.reactive.track = function(target, key, activeEffect) {
        orig.track(target, key, activeEffect); // ← 3 args, reaktivitas TIDAK mati
        if (dt.active && activeEffect && !dt.effectToId.has(activeEffect)) {
          dt.effectToId.set(activeEffect, dt.nextEffectId++);
        }
      };
    }

    // ── 3. Patch ScopeEvaluator (v3.1.0 API) ──
    if (raa.evaluator && typeof raa.evaluator.evaluate === 'function') {
      orig.evaluate = raa.evaluator.evaluate.bind(raa.evaluator);
      raa.evaluator.evaluate = function(expr, stateObj, el, extraLocals) {
        const res = orig.evaluate(expr, stateObj, el, extraLocals);
        if (dt.active && expr && expr.length > 2) addEvent(`eval:${expr.slice(0,60)}`, { expr, result: safeStringify(res) }, el);
        return res;
      };
    }
    if (raa.evaluator && typeof raa.evaluator.assign === 'function') {
      orig.assign = raa.evaluator.assign.bind(raa.evaluator);
      raa.evaluator.assign = function(expr, value, stateObj, el, extraLocals) {
        let oldVal;
        if (dt.active) try { oldVal = orig.evaluate(expr, stateObj, el, extraLocals); } catch(_) {}
        orig.assign(expr, value, stateObj, el, extraLocals);
        if (dt.active) {
          addEvent('assign', { expr, newValue: safeStringify(value), oldValue: safeStringify(oldVal) }, el);
          addTimelineEntry('mutate', { expr, value: safeStringify(value) });
        }
      };
    }

    // ── 4. Lifecycle Hooks ──
    raa.pluginManager.addHook('afterCompile', (root) => {
      if (!dt.roots.has(root)) {
        dt.roots.add(root);
        addTimelineEntry('root:compiled', { tag: root.tagName, app: root.getAttribute('raa-core:app') || null });
        schedulePanelUpdate();
      }
    }, 'raa-devtools');

    raa.pluginManager.addHook('beforeDestroy', (root) => {
      dt.roots.delete(root);
      addTimelineEntry('root:destroyed', { tag: root.tagName, app: root.getAttribute('raa-core:app') || null });
      schedulePanelUpdate();
    }, 'raa-devtools');
  },

  uninstall(raa) {
    // Restore metode asli
    const orig = dt._originals;
    if (raa.scheduler && orig.flushEffects) raa.scheduler.flushEffects = orig.flushEffects;
    if (raa.reactive && orig.track) raa.reactive.track = orig.track;
    if (raa.evaluator && orig.evaluate) raa.evaluator.evaluate = orig.evaluate;
    if (raa.evaluator && orig.assign) raa.evaluator.assign = orig.assign;
    
    dt._installed = false;
    dt.active = false;
    if (dt.panel) dt.panel.remove();
    dt.panel = null;
    dt.roots.clear();
    dt.timeline = []; dt.perfEntries = []; dt.eventLog = [];
  }
};

// ═══════════════════════════════════════════════════════
//  AUTO-INSTALL
// ═══════════════════════════════════════════════════════
function installPlugin() {
  if (typeof window.Raa === 'undefined') {
    console.warn('[RaaDevTools] window.Raa tidak ditemukan. Muat raa-v3.1.0.js terlebih dahulu.');
    return;
  }
  window.Raa.use(RaaDevToolsPlugin);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installPlugin);
} else {
  installPlugin();
}

})();